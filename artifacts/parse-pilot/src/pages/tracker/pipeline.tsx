import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  listTrackedApps,
  updateStage,
  type TrackedApp,
  type ApplicationStage,
  STAGE_LABELS,
  PIPELINE_STAGES,
} from "@/lib/tracker-api";
import {
  Loader2,
  Search,
  FileText,
  MailOpen,
  Building2,
  MapPin,
  ChevronRight,
  ChevronDown,
  Plus,
  LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<ApplicationStage, string> = {
  saved: "bg-gray-100 text-gray-700 border-gray-200",
  preparing: "bg-blue-50 text-blue-700 border-blue-200",
  applied: "bg-purple-50 text-purple-700 border-purple-200",
  screening: "bg-yellow-50 text-yellow-700 border-yellow-200",
  interview: "bg-orange-50 text-orange-700 border-orange-200",
  final_round: "bg-pink-50 text-pink-700 border-pink-200",
  offer: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-500 border-gray-200",
};

const COLUMN_HEADER_COLORS: Record<ApplicationStage, string> = {
  saved: "border-t-gray-400",
  preparing: "border-t-blue-500",
  applied: "border-t-purple-500",
  screening: "border-t-yellow-500",
  interview: "border-t-orange-500",
  final_round: "border-t-pink-500",
  offer: "border-t-green-500",
  rejected: "border-t-red-400",
  withdrawn: "border-t-gray-300",
};

function AppCard({
  app,
  onMoveStage,
}: {
  app: TrackedApp;
  onMoveStage: (app: TrackedApp, stage: ApplicationStage) => void;
}) {
  const [, navigate] = useLocation();
  const nextStages = PIPELINE_STAGES.filter((s) => s !== app.stage);

  return (
    <div
      className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/tracker/${app.id}`)}
    >
      <p className="font-medium text-sm leading-snug line-clamp-2">{app.applicationTitle}</p>
      <div className="mt-1.5 space-y-1">
        {app.company && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3" />
            {app.company}
          </p>
        )}
        {app.location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {app.location}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2.5">
        {app.tailoredCvId && (
          <span title="Has tailored CV" className="flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded px-1 py-0.5">
            <FileText className="w-2.5 h-2.5" /> CV
          </span>
        )}
        {app.coverLetterId && (
          <span title="Has cover letter" className="flex items-center gap-0.5 text-[10px] bg-purple-50 text-purple-600 border border-purple-200 rounded px-1 py-0.5">
            <MailOpen className="w-2.5 h-2.5" /> CL
          </span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {new Date(app.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
      </div>
      <div
        className="mt-2.5 pt-2 border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between gap-1.5 text-[11px] px-2 py-1 rounded border border-border hover:bg-accent transition-colors text-muted-foreground">
              <span className="font-medium">Move to stage</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            {nextStages.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onMoveStage(app, s)}
                className="text-xs cursor-pointer"
              >
                <span className={cn("w-2 h-2 rounded-full mr-2 flex-shrink-0 border", STAGE_COLORS[s])} />
                {STAGE_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [apps, setApps] = useState<TrackedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadApps();
  }, [showArchived]);

  async function loadApps() {
    setLoading(true);
    try {
      const { apps: fetched } = await listTrackedApps(showArchived ? "archived" : "active");
      setApps(fetched);
    } catch {
      toast({ variant: "destructive", title: "Failed to load applications" });
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveStage(app: TrackedApp, newStage: ApplicationStage) {
    try {
      await updateStage(app.id, newStage);
      setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, stage: newStage, updatedAt: new Date().toISOString() } : a));
      toast({ title: `Moved to ${STAGE_LABELS[newStage]}` });
    } catch {
      toast({ variant: "destructive", title: "Failed to update stage" });
    }
  }

  const filtered = apps.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.applicationTitle.toLowerCase().includes(q) || (a.company ?? "").toLowerCase().includes(q);
  });

  const byStage = (stage: ApplicationStage) => filtered.filter((a) => a.stage === stage);
  const rejected = filtered.filter((a) => a.stage === "rejected" || a.stage === "withdrawn");

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-primary" />
              Job Pipeline
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {apps.length} active application{apps.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? "Show Active" : "Show Archived"}
            </Button>
            <Link href="/tracker/new">
              <Button size="sm" className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Application
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-5 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by role or company…"
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-20">
            <LayoutGrid className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-muted-foreground">No applications yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Save a job and start tracking it here.
            </p>
            <Button className="mt-4" onClick={() => navigate("/tracker/saved")}>
              View Saved Jobs
            </Button>
          </div>
        ) : (
          <>
            {/* Pipeline columns */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-3 min-w-max">
                {PIPELINE_STAGES.map((stage) => {
                  const stageApps = byStage(stage);
                  return (
                    <div key={stage} className="w-56 flex-shrink-0">
                      <div className={cn(
                        "bg-card border-t-2 border border-border rounded-lg p-3 mb-2",
                        COLUMN_HEADER_COLORS[stage],
                      )}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{STAGE_LABELS[stage]}</span>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {stageApps.length}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {stageApps.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border p-4 text-center">
                            <p className="text-[11px] text-muted-foreground">Empty</p>
                          </div>
                        ) : (
                          stageApps.map((app) => (
                            <AppCard key={app.id} app={app} onMoveStage={handleMoveStage} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rejected/Withdrawn section */}
            {rejected.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Closed ({rejected.length})
                </h2>
                <div className="space-y-2">
                  {rejected.map((app) => (
                    <Link key={app.id} href={`/tracker/${app.id}`}>
                      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                        <Badge className={cn("text-[10px] shrink-0", STAGE_COLORS[app.stage])}>
                          {STAGE_LABELS[app.stage]}
                        </Badge>
                        <span className="text-sm font-medium truncate flex-1">{app.applicationTitle}</span>
                        {app.company && <span className="text-xs text-muted-foreground">{app.company}</span>}
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
