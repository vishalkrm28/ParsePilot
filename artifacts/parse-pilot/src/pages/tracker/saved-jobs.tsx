import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  listSavedJobs,
  deleteSavedJob,
  createTrackedApp,
  type SavedJob,
} from "@/lib/tracker-api";
import {
  Bookmark,
  Building2,
  MapPin,
  ExternalLink,
  Loader2,
  Trash2,
  Plus,
  Briefcase,
} from "lucide-react";

export default function SavedJobsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    listSavedJobs()
      .then((r) => setJobs(r.savedJobs))
      .catch(() => toast({ variant: "destructive", title: "Failed to load saved jobs" }))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteSavedJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast({ title: "Job removed from saved list" });
    } catch {
      toast({ variant: "destructive", title: "Failed to remove job" });
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreateApp(job: SavedJob) {
    setCreating(job.id);
    try {
      const { app } = await createTrackedApp({
        savedJobId: job.id,
        externalJobCacheId: job.externalJobCacheId,
        applicationTitle: `${job.jobTitle}${job.company ? ` at ${job.company}` : ""}`,
        company: job.company,
        location: job.location,
        applyUrl: job.applyUrl,
        jobSnapshot: job.jobSnapshot,
      });
      toast({ title: "Application created", description: "Redirecting to your tracker…" });
      navigate(`/tracker/${app.id}`);
    } catch {
      toast({ variant: "destructive", title: "Failed to create application" });
    } finally {
      setCreating(null);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-primary" />
              Saved Jobs
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Jobs you've bookmarked — start tracking when you're ready to apply.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-muted-foreground">No saved jobs yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Save jobs from your recommendations to track them here.
            </p>
            <Button className="mt-4" onClick={() => navigate("/jobs/recommendations")}>
              Find Jobs
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{job.jobTitle}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        {job.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {job.company}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        )}
                        {job.remoteType && job.remoteType !== "onsite" && (
                          <Badge variant="outline" className="text-xs h-5">
                            {job.remoteType === "remote" ? "Remote" : "Hybrid"}
                          </Badge>
                        )}
                        {job.salaryMin && job.salaryMax && (
                          <span className="text-xs">
                            {Number(job.salaryMin).toLocaleString()}–{Number(job.salaryMax).toLocaleString()} {job.currency}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Saved {new Date(job.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {job.applyUrl && (
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleCreateApp(job)}
                        disabled={creating === job.id}
                      >
                        {creating === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 mr-1" />
                        )}
                        Track Application
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(job.id)}
                        disabled={deleting === job.id}
                      >
                        {deleting === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
