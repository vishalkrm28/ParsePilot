import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  Building2, Users, Mail, ChevronLeft, Copy, Check,
  Loader2, AlertCircle, Plus, X, Trash2, Settings,
  BarChart3, CreditCard, Shield, UserPlus,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  getWorkspaceDetail,
  inviteMember,
  updateMemberRole,
  removeMember,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceInvitation,
  type WorkspaceUsageSummary,
  ROLE_LABELS,
  WORKSPACE_TYPE_LABELS,
} from "@/lib/workspaces-api";

const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  pro: "bg-blue-50 text-blue-700",
  recruiter_solo: "bg-purple-50 text-purple-700",
  recruiter_team: "bg-green-50 text-green-700",
};

const ROLE_OPTIONS = ["admin", "recruiter", "member", "viewer"] as const;

export default function WorkspaceDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [usageSummary, setUsageSummary] = useState<WorkspaceUsageSummary | null>(null);
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviting, setInviting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getWorkspaceDetail(id);
      setWorkspace(data.workspace);
      setMembers(data.members);
      setInvitations(data.invitations);
      setUsageSummary(data.usageSummary);
      setPlan(data.plan);
      setMyRole(data.myRole);
      setMemberCount(data.memberCount);
    } catch {
      toast({ variant: "destructive", title: "Failed to load workspace" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const canManage = myRole === "owner" || myRole === "admin";

  async function handleInvite() {
    if (!workspace || !inviteEmail) return;
    setInviting(true);
    try {
      const { invite, inviteLink } = await inviteMember(workspace.id, inviteEmail, inviteRole);
      setInvitations(prev => [invite, ...prev]);
      setInviteEmail("");
      setShowInvite(false);
      toast({ title: "Invitation created", description: `Share link: ${inviteLink}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to invite", description: e.message });
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!workspace) return;
    try {
      await updateMemberRole(workspace.id, userId, newRole);
      setMembers(prev =>
        prev.map(m => m.member.userId === userId ? { ...m, member: { ...m.member, role: newRole } } : m),
      );
      toast({ title: "Role updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: e.message });
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!workspace) return;
    try {
      await removeMember(workspace.id, userId);
      setMembers(prev => prev.filter(m => m.member.userId !== userId));
      toast({ title: "Member removed" });
    } catch (e: any) {
      toast({ variant: "destructive", title: e.message });
    }
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite-response?token=${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!workspace) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Workspace not found</h2>
          <Button className="mt-4" variant="outline" onClick={() => setLocation("/workspaces")}>
            Back to workspaces
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => setLocation("/workspaces")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Workspaces
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{workspace.name}</h1>
                <p className="text-sm text-muted-foreground">
                  /{workspace.slug} · {WORKSPACE_TYPE_LABELS[workspace.workspaceType] ?? workspace.workspaceType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", PLAN_BADGE[workspace.planCode] ?? "bg-gray-100 text-gray-700")}>
                {workspace.planCode.replace(/_/g, " ")}
              </span>
              {myRole && (
                <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  {ROLE_LABELS[myRole] ?? myRole}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: members + invitations */}
          <div className="lg:col-span-2 space-y-5">
            {/* Members */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Team Members ({memberCount})
                  </CardTitle>
                  {canManage && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary" onClick={() => setShowInvite(f => !f)}>
                      {showInvite ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {showInvite ? "Cancel" : "Invite"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {showInvite && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
                    <Input
                      placeholder="colleague@company.com"
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="text-xs h-8"
                    />
                    <div className="flex gap-2">
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                        className="flex-1 h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleInvite} disabled={inviting || !inviteEmail}>
                        {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                        Send invite
                      </Button>
                    </div>
                  </div>
                )}

                {members.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No members yet</p>
                ) : (
                  members.map(({ member, user }) => (
                    <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {(user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email ?? member.userId}
                        </p>
                        {user?.email && <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>}
                      </div>
                      {canManage && member.role !== "owner" ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={member.role}
                            onChange={e => handleRoleChange(member.userId, e.target.value)}
                            className="h-7 text-[11px] rounded border border-input bg-background px-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Invitations */}
            {invitations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Pending Invitations ({invitations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {invitations.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{inv.email}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">
                          Role: {ROLE_LABELS[inv.role] ?? inv.role}
                          {inv.expiresAt && ` · expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        className="text-muted-foreground hover:text-primary flex items-center gap-1 text-[11px]"
                        title="Copy invite link"
                      >
                        {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedToken === inv.token ? "Copied!" : "Copy link"}
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Usage summary */}
            {usageSummary && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Workspace Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">Total credits used: <span className="text-foreground font-medium">{usageSummary.totalCreditsUsed}</span></p>
                  {Object.keys(usageSummary.byFeature).length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {Object.entries(usageSummary.byFeature).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-medium">{val.events} events · {val.credits} credits</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Plan */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Plan & Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plan ? (
                  <>
                    <p className="font-semibold text-sm">{String(plan.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${String(plan.monthlyPrice)}/mo · {String(plan.includedCredits)} credits/mo
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Up to {String(plan.maxTeamMembers)} seat{Number(plan.maxTeamMembers) > 1 ? "s" : ""}
                    </p>
                    <div className="pt-1">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">Seat usage</p>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (memberCount / (Number(plan.maxTeamMembers) || 1)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{memberCount} / {String(plan.maxTeamMembers)} seats used</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Plan details unavailable</p>
                )}
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Your Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Your role</span>
                  <span className="font-medium">{ROLE_LABELS[myRole ?? ""] ?? myRole ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Manage members</span>
                  <span className={canManage ? "text-green-600 font-medium" : "text-muted-foreground"}>
                    {canManage ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">View billing</span>
                  <span className={canManage ? "text-green-600 font-medium" : "text-muted-foreground"}>
                    {canManage ? "Yes" : "No"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
