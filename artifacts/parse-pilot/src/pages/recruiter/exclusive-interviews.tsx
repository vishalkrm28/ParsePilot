import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Video, Building2, Calendar, ChevronRight, CheckCircle, X,
  Search, ChevronDown, ChevronUp, MapPin, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

interface Invite {
  id: string;
  applicationId: string;
  jobId: string;
  inviteTitle: string;
  interviewType: string;
  scheduledAt: string;
  timezone: string | null;
  location: string | null;
  meetingUrl: string | null;
  status: string;
  candidateResponseNote: string | null;
  candidateUserId: string;
  createdAt: string;
  jobTitle: string | null;
  jobCompany: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  reschedule_requested: "bg-orange-50 text-orange-700 border-orange-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "reschedule_requested", label: "Reschedule requested" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_LABELS: Record<string, string> = {
  recruiter_screen: "Recruiter Screen",
  hiring_manager: "Hiring Manager",
  technical: "Technical",
  case_study: "Case Study",
  final_round: "Final Round",
  general: "Interview",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Single invite card (upcoming) ───────────────────────────────────────────

function UpcomingCard({
  invite,
  onMarkStatus,
  onNavigate,
}: {
  invite: Invite;
  onMarkStatus: (id: string, status: "completed" | "cancelled") => void;
  onNavigate: (jobId: string, appId: string) => void;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{invite.inviteTitle}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {TYPE_LABELS[invite.interviewType] ?? invite.interviewType}
            </p>
          </div>
          <Badge variant="outline" className={cn("text-xs capitalize shrink-0", STATUS_COLORS[invite.status])}>
            {invite.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(invite.scheduledAt)}
            {invite.timezone ? ` (${invite.timezone})` : ""}
          </span>
          {invite.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {invite.location}
            </span>
          )}
          {invite.meetingUrl && (
            <a
              href={invite.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Join link
            </a>
          )}
        </div>

        {invite.candidateResponseNote && (
          <p className="text-xs text-muted-foreground italic mb-3 border-l-2 border-muted pl-2">
            {invite.candidateResponseNote}
          </p>
        )}

        <div className="flex gap-2">
          {!["completed", "cancelled"].includes(invite.status) && (
            <>
              <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200"
                onClick={() => onMarkStatus(invite.id, "completed")}>
                <CheckCircle className="w-3 h-3 mr-1" /> Complete
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 text-red-700 border-red-200"
                onClick={() => onMarkStatus(invite.id, "cancelled")}>
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="text-xs h-7 ml-auto"
            onClick={() => onNavigate(invite.jobId, invite.applicationId)}>
            Application <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RecruiterExclusiveInterviews() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPast, setShowPast] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ invites: Invite[] }>({
    queryKey: ["recruiter-all-invites"],
    queryFn: async () => {
      const res = await authedFetch(`${BASE}/internal-job-interviews/recruiter`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
  });

  const invites = data?.invites ?? [];

  // Apply search + status filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invites.filter((i) => {
      const matchesSearch = !q || [
        i.inviteTitle, i.jobTitle, i.jobCompany, i.interviewType,
      ].some((f) => f?.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invites, search, statusFilter]);

  const upcoming = filtered.filter((i) => !["cancelled", "completed"].includes(i.status));
  const past = filtered.filter((i) => ["cancelled", "completed"].includes(i.status));

  // Group upcoming by jobId
  const upcomingByJob = useMemo(() => {
    const map = new Map<string, { jobTitle: string | null; jobCompany: string | null; invites: Invite[] }>();
    for (const inv of upcoming) {
      if (!map.has(inv.jobId)) {
        map.set(inv.jobId, { jobTitle: inv.jobTitle, jobCompany: inv.jobCompany, invites: [] });
      }
      map.get(inv.jobId)!.invites.push(inv);
    }
    return Array.from(map.entries());
  }, [upcoming]);

  async function markStatus(id: string, status: "completed" | "cancelled") {
    try {
      const res = await authedFetch(`${BASE}/internal-job-interviews/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      refetch();
      toast({ title: `Interview marked as ${status}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message });
    }
  }

  const hasResults = upcoming.length > 0 || past.length > 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-purple-600" />
            Interview Schedule
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All interview invites sent to candidates.
          </p>
        </div>

        {/* Search + filter */}
        {invites.length > 0 && (
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by round, job, or company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && invites.length === 0 && (
          <div className="text-center py-20 text-muted-foreground space-y-3">
            <Video className="w-12 h-12 mx-auto opacity-20 text-purple-400" />
            <p className="text-sm">No interview invites sent yet</p>
            <p className="text-xs opacity-70">Open an applicant's profile to schedule an interview.</p>
          </div>
        )}

        {/* No matches after filtering */}
        {!isLoading && invites.length > 0 && !hasResults && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No invites match your filters.</p>
          </div>
        )}

        {/* ── Upcoming — grouped by job ── */}
        {upcomingByJob.length > 0 && (
          <div className="mb-8 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming · {upcoming.length}
            </p>
            {upcomingByJob.map(([jobId, group]) => (
              <div key={jobId}>
                {/* Job group header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs font-semibold text-foreground truncate">
                    {group.jobCompany
                      ? `${group.jobCompany} — ${group.jobTitle ?? "Untitled role"}`
                      : (group.jobTitle ?? "Untitled role")}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {group.invites.length} invite{group.invites.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.invites.map((invite) => (
                    <UpcomingCard
                      key={invite.id}
                      invite={invite}
                      onMarkStatus={markStatus}
                      onNavigate={(jId, appId) => navigate(`/recruiter/exclusive-jobs/${jId}/application/${appId}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Past — collapsible ── */}
        {past.length > 0 && (
          <div>
            <button
              onClick={() => setShowPast((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-3 w-full text-left"
            >
              {showPast ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Past · {past.length}
            </button>

            {showPast && (
              <div className="space-y-2 opacity-70">
                {past.map((invite) => (
                  <Card key={invite.id} className="border-border/40">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{invite.inviteTitle}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatDateShort(invite.scheduledAt)}
                          {invite.jobTitle ? ` — ${invite.jobTitle}` : ""}
                          {invite.jobCompany ? ` · ${invite.jobCompany}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn("text-xs capitalize", STATUS_COLORS[invite.status])}>
                          {invite.status}
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2"
                          onClick={() => navigate(`/recruiter/exclusive-jobs/${invite.jobId}/application/${invite.applicationId}`)}>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
