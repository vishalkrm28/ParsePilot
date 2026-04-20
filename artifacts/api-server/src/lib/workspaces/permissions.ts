/**
 * Workspace permission helpers.
 *
 * Role hierarchy (highest → lowest):
 *   owner > admin > recruiter > member > viewer
 *
 * All enforcement helpers throw or return false — never trust the frontend for role gating.
 */

import { getMemberInWorkspace } from "./workspace-helpers.js";

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_RANK: Record<string, number> = {
  owner: 100,
  admin: 80,
  recruiter: 60,
  member: 40,
  viewer: 20,
};

function atLeast(role: string | undefined, min: string): boolean {
  return (ROLE_RANK[role ?? ""] ?? 0) >= (ROLE_RANK[min] ?? 0);
}

// ─── isWorkspaceOwner ─────────────────────────────────────────────────────────

export async function isWorkspaceOwner(workspaceId: string, userId: string): Promise<boolean> {
  const member = await getMemberInWorkspace(workspaceId, userId);
  return member?.role === "owner";
}

// ─── isWorkspaceAdmin ─────────────────────────────────────────────────────────

export async function isWorkspaceAdmin(workspaceId: string, userId: string): Promise<boolean> {
  const member = await getMemberInWorkspace(workspaceId, userId);
  return atLeast(member?.role, "admin");
}

// ─── canManageMembers ─────────────────────────────────────────────────────────
// Owner and admin can manage members. Admin cannot change owner role.

export async function canManageMembers(workspaceId: string, userId: string): Promise<boolean> {
  const member = await getMemberInWorkspace(workspaceId, userId);
  return atLeast(member?.role, "admin");
}

// ─── canViewWorkspaceBilling ──────────────────────────────────────────────────

export async function canViewWorkspaceBilling(workspaceId: string, userId: string): Promise<boolean> {
  const member = await getMemberInWorkspace(workspaceId, userId);
  return atLeast(member?.role, "admin");
}

// ─── canUseRecruiterFeatures ──────────────────────────────────────────────────

export async function canUseRecruiterFeatures(workspaceId: string, userId: string): Promise<boolean> {
  const member = await getMemberInWorkspace(workspaceId, userId);
  return atLeast(member?.role, "recruiter");
}

// ─── requireWorkspacePermission ──────────────────────────────────────────────
// Throws a structured error if the user does not have at least `minRole`.

export async function requireWorkspacePermission(
  workspaceId: string,
  userId: string,
  minRole: "viewer" | "member" | "recruiter" | "admin" | "owner",
): Promise<void> {
  const member = await getMemberInWorkspace(workspaceId, userId);
  if (!member) {
    throw Object.assign(new Error("You are not a member of this workspace"), { status: 403 });
  }
  if (!atLeast(member.role, minRole)) {
    throw Object.assign(
      new Error(`This action requires at least the '${minRole}' role`),
      { status: 403 },
    );
  }
}

// ─── getMemberRole ────────────────────────────────────────────────────────────

export async function getMemberRole(
  workspaceId: string,
  userId: string,
): Promise<string | null> {
  const member = await getMemberInWorkspace(workspaceId, userId);
  return member?.role ?? null;
}
