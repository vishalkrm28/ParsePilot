import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/debug-auth", (req, res) => {
  res.json({
    cookies: Object.fromEntries(
      Object.entries(req.cookies ?? {}).map(([k, v]) => [
        k,
        typeof v === "string" ? `${v.slice(0, 30)}...` : v,
      ]),
    ),
    hasAuthHeader: !!req.headers["authorization"],
    authHeaderPrefix: (req.headers["authorization"] ?? "").slice(0, 30),
    isAuthenticated: req.isAuthenticated?.() ?? false,
    user: req.user ?? null,
  });
});

export default router;
