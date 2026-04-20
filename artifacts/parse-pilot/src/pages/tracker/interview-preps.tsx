import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { listInterviewPreps, type InterviewPrep } from "@/lib/tracker-api";
import { Loader2, Sparkles, Building2, ChevronRight, Calendar } from "lucide-react";

export default function InterviewPrepsPage() {
  const { toast } = useToast();
  const [preps, setPreps] = useState<InterviewPrep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listInterviewPreps()
      .then((r) => setPreps(r.preps))
      .catch(() => toast({ variant: "destructive", title: "Failed to load interview preps" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Interview Preps
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              AI-generated interview preparation packs, grounded in your CV and each job.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : preps.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-muted-foreground">No interview preps yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Open an application and click "Generate Interview Prep" to create one.
            </p>
            <Link href="/tracker">
              <Button className="mt-4">Go to Pipeline</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {preps.map((prep) => {
              const prepJson = prep.prepJson as { likely_questions?: unknown[] };
              const qCount = prepJson.likely_questions?.length ?? 0;
              return (
                <Link key={prep.id} href={`/tracker/interview-prep/${prep.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">
                          {prep.applicationTitle ?? "Interview Prep"}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          {prep.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {prep.company}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(prep.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                          <span>{qCount} question{qCount !== 1 ? "s" : ""}</span>
                        </div>
                        {prep.prepSummary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{prep.prepSummary}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
