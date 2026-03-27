import { createClerkClient, verifyToken } from "@clerk/express";
import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { initFreeCredits } from "../lib/credits.js";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

function extractToken(req: Request): string | null {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Fallback: Clerk's __session cookie
  const sessionCookie = req.cookies?.["__session"];
  if (sessionCookie) return sessionCookie;
  return null;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const token = extractToken(req);

  req.log?.debug(
    { hasToken: !!token, path: req.path },
    "authMiddleware: token check",
  );

  if (!token) {
    next();
    return;
  }

  let userId: string;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    });
    userId = payload.sub;
  } catch (err) {
    req.log?.warn(
      { err: (err as Error).message, path: req.path },
      "authMiddleware: token verification failed",
    );
    next();
    return;
  }

  try {
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (existingUser) {
      req.user = {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        profileImageUrl: existingUser.profileImageUrl,
      };
    } else {
      const clerkUser = await clerk.users.getUser(userId);
      const userData = {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
        firstName: clerkUser.firstName ?? null,
        lastName: clerkUser.lastName ?? null,
        profileImageUrl: clerkUser.imageUrl ?? null,
      };

      const [newUser] = await db
        .insert(usersTable)
        .values(userData)
        .onConflictDoUpdate({
          target: usersTable.id,
          set: { ...userData, updatedAt: new Date() },
        })
        .returning();

      await initFreeCredits(newUser.id);

      req.user = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        profileImageUrl: newUser.profileImageUrl,
      };
    }
  } catch (err) {
    req.log?.error({ err }, "authMiddleware: failed to upsert Clerk user");
  }

  next();
}
