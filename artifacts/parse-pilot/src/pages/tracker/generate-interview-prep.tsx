import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getTrackedApp,
  generateInterviewPrep,
  type TrackedApp,
} from "@/lib/tracker-api";
import { Loader2, Sparkles, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function GenerateInterviewPrepPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(search);
  const appId = params.get("appId");

  const [app, setApp] = useState<TrackedApp | null>(null);
  const [loadingApp, setLoadingApp] = useState(!!appId);
  const [jobText, setJobText] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!appId) return;
    getTrackedApp(appId)
      .then((r) => setApp(r.app))
      .catch(() => toast({ variant: "destructive", title: "Failed to load application" }))
      .finally(() => setLoadingApp(false));
  }, [appId]);

  async function handleGenerate() {
    if (!appId) {
      toast({ variant: "destructive", title: "No application selected" });
      return;
    }
    setGenerating(true);
    try {
      const { prep } = await generateInterviewPrep({
        applicationId: appId,
        tailoredCvId: app?.tailoredCvId,
        coverLetterId: app?.coverLetterId,
        jobText: jobText.trim() || null,
      });
      toast({ title: "Interview prep generated!", description: "Redirecting to your prep…" });
      navigate(`/tracker/interview-prep/${prep.id}`);
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message ?? "Please try again",
      });
    } finally {
      setGenerating(false);
    }
  }

  if (!appId) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">No application selected</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Open an application from the pipeline to generate interview prep.
          </p>
          <Link href="/tracker">
            <Button className="mt-4">Go to Pipeline</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          {appId && (
            <Link href={`/tracker/${appId}`}>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to application
              </button>
            </Link>
          )}
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Generate Interview Prep
          </h1>
          {loadingApp ? (
            <p className="text-sm text-muted-foreground mt-1">Loading application…</p>
          ) : app ? (
            <p className="text-sm text-muted-foreground mt-1">
              For: <span className="font-medium text-foreground">{app.applicationTitle}</span>
            </p>
          ) : null}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Job Description (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              If the application already has a job linked, we'll use that automatically.
              Paste the full job description here for the best results.
            </p>
            <Textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the job description here…"
              rows={8}
              className="text-sm resize-none"
            />
          </CardContent>
        </Card>

        <div className="p-4 bg-muted/40 rounded-lg text-sm text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground">What you'll get:</p>
          <p>• 8–12 likely interview questions with answer strategies</p>
          <p>• Strengths to emphasize and gaps to address</p>
          <p>• 30-second and 90-second personal pitches</p>
          <p>• Questions to ask the interviewer</p>
          <p>• All grounded in your actual CV — no invented facts</p>
          <p className="text-xs mt-2 text-amber-700">Uses 1 credit</p>
        </div>

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={generating || loadingApp}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating — this takes 20–30 seconds…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Interview Prep
            </>
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
