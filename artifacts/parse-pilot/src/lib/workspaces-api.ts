const BASE = "/api";

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  workspaceType: string;
  planCode: string;
  createdAt: string;
  updatedAt: string;
  role?: string;
  memberCount?: number;
}

export interface WorkspaceMember {
  member: {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    status: string;
    createdAt: string;
  };
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface WorkspaceUsageSummary {
  totalCreditsUsed: number;
  byFeature: Record<string, { events: number; credits: number }>;
  recentEvents: Array<{ id: string; featureKey: string; creditsUsed: number; createdAt: string }>;
}

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  recruiter: "Recruiter",
  member: "Member",
  viewer: "Viewer",
};

export const WORKSPACE_TYPE_LABELS: Record<string, string> = {
  recruiter_team: "Recruiter Team",
  institution: "Institution",
  personal: "Personal",
};

// ─── API calls ────────────────────────────────────────────────────────────────

export async function listWorkspaces(): Promise<Workspace[]> {
  const data = await apiFetch<{ workspaces: Workspace[] }>("/workspaces");
  return data.workspaces;
}

export async function createWorkspace(input: {
  name: string;
  slug: string;
  workspaceType?: string;
}): Promise<Workspace> {
  const data = await apiFetch<{ workspace: Workspace }>("/workspaces", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.workspace;
}

export async function getWorkspaceDetail(id: string): Promise<{
  workspace: Workspace;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  usageSummary: WorkspaceUsageSummary;
  memberCount: number;
  plan: Record<string, unknown> | null;
  myRole: string | null;
}> {
  return apiFetch(`/workspaces/${id}`);
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: string,
): Promise<{ invite: WorkspaceInvitation; inviteLink: string }> {
  return apiFetch(`/workspaces/${workspaceId}/invite`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: string,
): Promise<void> {
  await apiFetch(`/workspaces/${workspaceId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(workspaceId: string, userId: string): Promise<void> {
  await apiFetch(`/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE" });
}

export async function acceptInvite(token: string): Promise<{ success: boolean; workspaceId: string }> {
  return apiFetch("/workspaces/accept-invite", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
