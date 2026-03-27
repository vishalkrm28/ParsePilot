import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import router from "./routes/index.js";
import webhookRouter from "./routes/webhook.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// credentials: true required for cookie-based session auth through Replit proxy
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());

// Disable all caching for API responses — user-specific data must never be served
// from a proxy or browser cache to another user.
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ─── Stripe webhook — must be mounted BEFORE express.json() ──────────────────
// Stripe signature verification requires the exact raw bytes of the body.
// express.json() consumes the stream and loses that raw buffer, so the webhook
// route is registered here with its own express.raw() middleware instead.
app.use("/api", webhookRouter);

// Global body parsers for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware must run before routes — loads user from session on every request
app.use(authMiddleware);

app.use("/api", router);

export default app;
