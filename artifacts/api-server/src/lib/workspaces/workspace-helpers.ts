/**
 * Workspace helpers — create, read, and manage workspaces and their members.
 */

import { and, eq, count } from "drizzle-orm";
import {
  db,
  workspacesTable,
  workspaceMembersTable,
  workspaceInvitationsTable,
  usersTable,
  featureUsageEventsTable,
  type InsertWorkspace,
  type InsertWorkspaceMember,
} from "@workspace/db";
import { randomBytes } from "crypto";
import { logger } from "../logger.js";

// ─── getWorkspaceById ─────────────────────────────────────────────────────────

export async function getWorkspaceById(workspaceId: string) {
  const [ws] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.id, workspaceId))
    .limit(1);
  return ws ?? null;
}

// ─── getWorkspacesForUser ──────────────────────────────────────────────────────
// Returns all workspaces where the user is an active member.

export async function getWorkspacesForUser(userId: string) {
  return db
    .select({
      workspace: workspacesTable,
      member: workspaceMembersTable,
    })
    .from(workspaceMembersTable)
    .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
    .where(
      and(
        eq(workspaceMembersTable.userId, userId),
        eq(workspaceMembersTable.status, "active"),
      ),
    );
}

// ─── createWorkspace ──────────────────────────────────────────────────────────

export async function createWorkspace(input: {
  ownerUserId: string;
  name: string;
  slug: string;
  workspaceType?: string;
  planCode?: string;
}) {
  const [ws] = await db
    .insert(workspacesTable)
    .values({
      ownerUserId: input.ownerUserId,
      name: input.name,
      slug: input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      workspaceType: input.workspaceType ?? "recruiter_team",
      planCode: input.planCode ?? "recruiter_team",
    })
    .returning();

  // Add owner as first member with owner role
  await db.insert(workspaceMembersTable).values({
    workspaceId: ws.id,
    userId: input.ownerUserId,
    role: "owner",
    status: "active",
  });

  return ws;
}

// ─── getWorkspaceMembers ──────────────────────────────────────────────────────

export async function getWorkspaceMembers(workspaceId: string) {
  return db
    .select({
      member: workspaceMembersTable,
      user: {
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      },
    })
    .from(workspaceMembersTable)
    .leftJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.status, "active"),
      ),
    );
}

// ─── getMemberCountForWorkspace ───────────────────────────────────────────────

export async function getMemberCountForWorkspace(workspaceId: string): Promise<number> {
  const [row] = await db
    .select({ cnt: count() })
    .from(workspaceMembersTable)
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.status, "active"),
      ),
    );
  return Number(row?.cnt ?? 0);
}

// ─── getMemberInWorkspace ─────────────────────────────────────────────────────

export async function getMemberInWorkspace(workspaceId: string, userId: string) {
  const [member] = await db
    .select()
    .from(workspaceMembersTable)
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, userId),
        eq(workspaceMembersTable.status, "active"),
      ),
    )
    .limit(1);
  return member ?? null;
}

// ─── inviteMember ─────────────────────────────────────────────────────────────

export async function inviteMember(input: {
  workspaceId: string;
  email: string;
  role: string;
  invitedByUserId: string;
}) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Revoke any existing pending invite for same email in same workspace
  await db
    .delete(workspaceInvitationsTable)
    .where(
      and(
        eq(workspaceInvitationsTable.workspaceId, input.workspaceId),
        eq(workspaceInvitationsTable.email, input.email),
        eq(workspaceInvitationsTable.status, "pending"),
      ),
    );

  const [invite] = await db
    .insert(workspaceInvitationsTable)
    .values({
      workspaceId: input.workspaceId,
      email: input.email,
      role: input.role,
      invitedByUserId: input.invitedByUserId,
      token,
      status: "pending",
      expiresAt,
    })
    .returning();

  return invite;
}

// ─── acceptInvite ─────────────────────────────────────────────────────────────

export async function acceptInvite(token: string, userId: string) {
  const [invite] = await db
    .select()
    .from(workspaceInvitationsTable)
    .where(
      and(
        eq(workspaceInvitationsTable.token, token),
        eq(workspaceInvitationsTable.status, "pending"),
      ),
    )
    .limit(1);

  if (!invite) throw new Error("Invitation not found or already used");
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    await db
      .update(workspaceInvitationsTable)
      .set({ status: "expired" })
      .where(eq(workspaceInvitationsTable.id, invite.id));
    throw new Error("Invitation has expired");
  }

  // Check user email matches invite email if user has an email
  const [user] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (user?.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error("This invitation was sent to a different email address");
  }

  // Add as member (or update if already removed/suspended)
  const existing = await getMemberInWorkspace(invite.workspaceId, userId);
  if (existing) {
    logger.info({ workspaceId: invite.workspaceId, userId }, "User already active in workspace");
  } else {
    await db.insert(workspaceMembersTable).values({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      status: "active",
      invitedByUserId: invite.invitedByUserId,
    });
  }

  await db
    .update(workspaceInvitationsTable)
    .set({ status: "accepted" })
    .where(eq(workspaceInvitationsTable.id, invite.id));

  return invite;
}

// ─── updateMemberRole ─────────────────────────────────────────────────────────

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: string,
) {
  if (newRole === "owner") throw new Error("Cannot reassign owner role via this route");
  await db
    .update(workspaceMembersTable)
    .set({ role: newRole })
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, targetUserId),
      ),
    );
}

// ─── removeMember ─────────────────────────────────────────────────────────────

export async function removeMember(workspaceId: string, targetUserId: string) {
  await db
    .update(workspaceMembersTable)
    .set({ status: "removed" })
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, targetUserId),
      ),
    );
}

// ─── getWorkspaceUsageSummary ─────────────────────────────────────────────────
// Credits used in the workspace this month, by feature.

export async function getWorkspaceUsageSummary(workspaceId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(featureUsageEventsTable)
    .where(eq(featureUsageEventsTable.workspaceId, workspaceId));

  const byFeature = rows.reduce<Record<string, { events: number; credits: number }>>((acc, r) => {
    const key = r.featureKey;
    if (!acc[key]) acc[key] = { events: 0, credits: 0 };
    acc[key].events++;
    acc[key].credits += r.creditsUsed ?? 0;
    return acc;
  }, {});

  const totalCredits = rows.reduce((sum, r) => sum + (r.creditsUsed ?? 0), 0);
  return { totalCreditsUsed: totalCredits, byFeature, recentEvents: rows.slice(-10) };
}

// ─── getPendingInvitationsForWorkspace ────────────────────────────────────────

export async function getPendingInvitationsForWorkspace(workspaceId: string) {
  return db
    .select()
    .from(workspaceInvitationsTable)
    .where(
      and(
        eq(workspaceInvitationsTable.workspaceId, workspaceId),
        eq(workspaceInvitationsTable.status, "pending"),
      ),
    );
}
