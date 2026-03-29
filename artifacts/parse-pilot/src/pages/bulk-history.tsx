import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { authedFetch } from "@/lib/authed-fetch";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Users,
  ChevronRight,
  Loader2,
  Building2,
  Calendar,
  BarChart2,
  Plus,
  Trophy,
  ShoppingCart,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BulkStatus {
  isPro?: boolean;
  activePass?: { remaining: number; cvLimit: number } | null;
}

interface BulkSessionSummary {
  id: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  cvCount: number;
  topScore: number | null;
  avgScore: number | null;
}

function ScorePill({ score, label }: { score: number | null; label: string }) {
  if (score === null) return <span className="text-xs text-muted-foreground">—</span>;
  const rounded = Math.round(score);
  const color =
    rounded >= 75 ? "text-emerald-600 bg-emerald-500/10" :
    rounded >= 50 ? "text-amber-600 bg-amber-500/10" :
    "text-red-600 bg-red-500/10";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full", color)}>
      {rounded}% <span className="font-normal opacity-70">{label}</span>
    </span>
  );
}

export default function BulkHistory() {
  const [, navigate] = useLocation();
  const [sessions, setSessions] = useState<BulkSessionSummary[]>([]);
  const [bulkStatus, setBulkStatus] = useState<BulkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch("/api/billing/bulk-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((status: BulkStatus | null) => {
        const hasAccess =
          status?.isPro || (status?.activePass && status.activePass.remaining > 0);
        if (!hasAccess) {
          navigate("/bulk");
          return;
        }
        setBulkStatus(status);
        return authedFetch("/api/bulk-sessions")
          .then((r) => r.json())
          .then((data) => setSessions(data))
          .catch(() => setError("Failed to load bulk sessions"));
      })
      .catch(() => navigate("/bulk"))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Bulk Mode</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1">Batch analysis history</h1>
              <p className="text-sm text-muted-foreground">
                All your previous bulk screening sessions — click one to see the full ranked results.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
              <Link href="/bulk">
                <button className="inline-flex items-center gap-1.5 text-sm font-semibold border border-border px-3 py-2 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-colors whitespace-nowrap">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Buy more slots
                </button>
              </Link>
              <Link href="/bulk/session">
                <button className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
                  <Plus className="w-4 h-4" />
                  New batch
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Pass usage banner */}
        {bulkStatus && !loading && (
          <div className="mb-6">
            {bulkStatus.isPro ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-sm text-violet-700">
                <Crown className="w-4 h-4 flex-shrink-0" />
                <span>You're on <strong>Pro</strong> — bulk analyses use your credit balance. Buy a bulk pass below if you want a dedicated slot bank.</span>
              </div>
            ) : bulkStatus.activePass ? (
              (() => {
                const { remaining, cvLimit } = bulkStatus.activePass;
                const pct = Math.round(((cvLimit - remaining) / cvLimit) * 100);
                const isLow = remaining <= Math.ceil(cvLimit * 0.2);
                return (
                  <div className={cn(
                    "px-4 py-3 rounded-xl border text-sm",
                    isLow ? "bg-amber-500/5 border-amber-400/30" : "bg-emerald-500/5 border-emerald-500/25"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("font-semibold", isLow ? "text-amber-700" : "text-emerald-700")}>
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />}
                        Active pass — {remaining} of {cvLimit} slots remaining
                      </span>
                      {isLow && (
                        <Link href="/bulk">
                          <button className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2">
                            Top up
                          </button>
                        </Link>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", isLow ? "bg-amber-500" : "bg-emerald-500")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-muted-foreground">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No sessions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Run your first batch analysis to see results here.</p>
            </div>
            <Link href="/bulk/session">
              <button className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity mt-2">
                <Plus className="w-4 h-4" />
                Start a batch
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => navigate(`/bulk/sessions/${session.id}`)}
                className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-base truncate">{session.jobTitle}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {session.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(session.createdAt), "d MMM yyyy, HH:mm")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {session.cvCount} CV{session.cvCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <ScorePill score={session.topScore} label="top" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <ScorePill score={session.avgScore} label="avg" />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
