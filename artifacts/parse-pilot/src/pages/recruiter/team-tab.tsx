import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeam, inviteTeamMember, cancelTeamInvite, removeTeamMember, leaveTeam, startRecruiterCheckout, cancelRecruiterPlan } from "@/lib/recruiter-api";
import { Users, Mail, X, UserPlus, Clock, CheckCircle2, Crown, LogOut, ArrowRight, Loader2, Lock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccessData {
  hasAccess: boolean;
  plan: "solo" | "team" | null;
  isTeamOwner: boolean;
  isMember: boolean;
  teamOwnerId?: string;
}

interface Props {
  accessData: AccessData;
}

export function TeamTab({ accessData }: Props) {
  const { plan, isTeamOwner, isMember } = accessData;
  const { toast } = useToast();
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["recruiter-team"],
    queryFn: getTeam,
    enabled: isTeamOwner,
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => inviteTeamMember(email),
    onSuccess: () => {
      toast({ title: "Invite sent", description: `Invitation emailed to ${inviteEmail}` });
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["recruiter-team"] });
    },
    onError: (err: any) => toast({ title: "Invite failed", description: err.message, variant: "destructive" }),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (id: string) => cancelTeamInvite(id),
    onSuccess: () => { toast({ title: "Invite cancelled" }); qc.invalidateQueries({ queryKey: ["recruiter-team"] }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeTeamMember(userId),
    onSuccess: () => { toast({ title: "Member removed" }); qc.invalidateQueries({ queryKey: ["recruiter-team"] }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const leaveMutation = useMutation({
    mutationFn: leaveTeam,
    onSuccess: () => {
      toast({ title: "You left the team" });
      qc.invalidateQueries({ queryKey: ["recruiter-access"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const upgradeMutation = useMutation({
    mutationFn: () => {
      const base = window.location.origin;
      return startRecruiterCheckout("team", `${base}/recruiter/dashboard`, `${base}/recruiter/pricing`);
    },
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err: any) => toast({ title: "Checkout failed", description: err.message, variant: "destructive" }),
  });

  const cancelPlanMutation = useMutation({
    mutationFn: cancelRecruiterPlan,
    onSuccess: (data) => {
      setShowCancelConfirm(false);
      const until = data.periodEnd
        ? new Date(data.periodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : "the end of your billing period";
      toast({
        title: "Plan cancellation scheduled",
        description: `You'll keep full access until ${until}. After that your plan and team will be removed.`,
      });
      qc.invalidateQueries({ queryKey: ["recruiter-access"] });
    },
    onError: (err: any) => {
      setShowCancelConfirm(false);
      toast({ title: "Cancellation failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Solo plan: locked upgrade prompt ──────────────────────────────────────
  if (plan === "solo") {
    return (
      <>
      <div className="max-w-lg mx-auto text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-3">Team features require a Team plan</h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Upgrade to Team to invite up to 3 colleagues, share a candidate pool, and collaborate on your hiring pipeline.
        </p>
        <div className="bg-muted/30 rounded-2xl border border-border/40 p-5 mb-6 text-left space-y-2">
          {["3 recruiter seats (including you)", "Shared candidate pool", "Collaborative pipeline & notes", "Priority email support"].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {f}
            </div>
          ))}
        </div>
        <button
          onClick={() => upgradeMutation.mutate()}
          disabled={upgradeMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all text-sm disabled:opacity-50"
        >
          {upgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Upgrade to Team — $79/month
        </button>
        <p className="text-xs text-muted-foreground mt-3">Cancel any time. Your Solo plan balance will be credited.</p>
      </div>

      <CancelPlanSection showConfirm={showCancelConfirm} setShowConfirm={setShowCancelConfirm} isPending={cancelPlanMutation.isPending} onConfirm={() => cancelPlanMutation.mutate()} plan="solo" />
      </>
    );
  }

  // ── Team member: read-only view ────────────────────────────────────────────
  if (isMember) {
    return (
      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="bg-muted/20 border border-border/40 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-bold text-foreground text-lg mb-2">You're part of a team</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You're accessing this recruiter workspace as a team member. You share the same candidate pool and pipeline as the team owner.
          </p>
          <button
            onClick={() => { if (confirm("Are you sure you want to leave this team? You'll lose access to the shared pipeline.")) leaveMutation.mutate(); }}
            disabled={leaveMutation.isPending}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 mx-auto transition-colors disabled:opacity-50"
          >
            {leaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Leave this team
          </button>
        </div>
      </div>
    );
  }

  // ── Team owner: full management UI ────────────────────────────────────────
  const seats = teamData?.usedSeats ?? 1;
  const maxSeats = teamData?.maxSeats ?? 3;
  const members: any[] = teamData?.members ?? [];
  const invites: any[] = teamData?.invites ?? [];
  const isFull = seats >= maxSeats;

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Seat counter */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Team Management</h2>
          <p className="text-sm text-muted-foreground">Manage who has access to your recruiter workspace</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-foreground">{seats}<span className="text-muted-foreground font-normal text-base">/{maxSeats}</span></div>
          <div className="text-xs text-muted-foreground">seats used</div>
        </div>
      </div>

      {/* Seat bar */}
      <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(seats / maxSeats) * 100}%` }}
        />
      </div>

      {/* Invite form */}
      <div className="mb-8">
        <label className="text-sm font-semibold text-foreground block mb-2">Invite a teammate</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            disabled={isFull}
            className="flex-1 h-10 rounded-lg border border-border/60 bg-background text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            onKeyDown={e => { if (e.key === "Enter" && inviteEmail.trim()) inviteMutation.mutate(inviteEmail.trim()); }}
          />
          <button
            onClick={() => inviteEmail.trim() && inviteMutation.mutate(inviteEmail.trim())}
            disabled={inviteMutation.isPending || isFull || !inviteEmail.trim()}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold px-4 h-10 rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 shrink-0"
          >
            {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Send invite
          </button>
        </div>
        {isFull && (
          <p className="text-xs text-amber-600 mt-2">Your team is full ({maxSeats} seats). Remove a member to invite someone new.</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Owner row */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/10">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">You (Owner)</p>
              <p className="text-xs text-muted-foreground">Team plan admin</p>
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">Active</span>
          </div>

          {/* Active members */}
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 p-4 rounded-xl border border-border/40">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                {m.firstName?.[0] ?? m.email?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>
              <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800 shrink-0">Active</span>
              <button
                onClick={() => { if (confirm(`Remove ${m.email} from your team?`)) removeMemberMutation.mutate(m.id); }}
                disabled={removeMemberMutation.isPending}
                className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Pending invites */}
          {invites.map((inv: any) => (
            <div key={inv.id} className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border/60 bg-muted/5">
              <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{inv.invitedEmail}</p>
                <p className="text-xs text-muted-foreground">Invite pending</p>
              </div>
              <span className="text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 shrink-0">Pending</span>
              <button
                onClick={() => { if (confirm(`Cancel invite to ${inv.invitedEmail}?`)) cancelInviteMutation.mutate(inv.id); }}
                disabled={cancelInviteMutation.isPending}
                className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {members.length === 0 && invites.length === 0 && (
            <div className="text-center py-10 border border-dashed border-border/40 rounded-2xl">
              <Mail className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No team members yet. Invite a colleague above to get started.</p>
            </div>
          )}
        </div>
      )}

      <CancelPlanSection showConfirm={showCancelConfirm} setShowConfirm={setShowCancelConfirm} isPending={cancelPlanMutation.isPending} onConfirm={() => cancelPlanMutation.mutate()} plan="team" />
    </div>
  );
}

// ─── Cancel Plan Section ──────────────────────────────────────────────────────

function CancelPlanSection({ showConfirm, setShowConfirm, isPending, onConfirm, plan }: {
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
  plan: "solo" | "team";
}) {
  const label = plan === "team" ? "Team plan" : "Solo plan";
  const price = plan === "team" ? "$79/mo" : "$29.99/mo";

  return (
    <div className="max-w-2xl mx-auto px-0 pb-8 pt-4">
      <div className="border-t border-border/40 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Cancel {label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You'll keep access until your billing period ends. Your pipeline data won't be deleted.
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors shrink-0 underline underline-offset-2"
          >
            Cancel plan
          </button>
        </div>
      </div>

      {/* Confirmation dialog overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Cancel {label}?</h3>
                <p className="text-xs text-muted-foreground">{price} · billed monthly</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 mb-5 space-y-2">
              {plan === "team" && (
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  Team members will lose access when the period ends
                </div>
              )}
              <div className="flex items-start gap-2 text-sm text-foreground">
                <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                Candidate pipeline and invites become read-only
              </div>
              <div className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                Full access kept until the end of your billing period
              </div>
              <div className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                All your data is preserved — you can re-subscribe at any time
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                Keep my plan
              </button>
              <button
                onClick={onConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
