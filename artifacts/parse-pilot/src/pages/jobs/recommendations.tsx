import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getJobRecCredits,
  recommendJobs,
  type JobResult,
  type RecommendResponse,
} from "@/lib/jobs-api";
import { authedFetch } from "@/lib/authed-fetch";
import {
  MapPin,
  Building2,
  ExternalLink,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  createdAt: string;
}

function MatchScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold w-10 text-right">{score}%</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="bg-green-100 text-green-800 border-green-200">Strong Match</Badge>;
  if (score >= 45) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Partial Match</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200">Weak Match</Badge>;
}

function JobCard({ rec }: { rec: JobResult }) {
  const [expanded, setExpanded] = useState(false);
  const { job } = rec;

  const salaryText =
    job.salary_min && job.salary_max
      ? `${Number(job.salary_min).toLocaleString()}–${Number(job.salary_max).toLocaleString()} ${job.currency}`
      : job.salary_min
      ? `From ${Number(job.salary_min).toLocaleString()} ${job.currency}`
      : null;

  return (
    <Card className="border border-border hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground leading-tight truncate">
              {job.title}
            </h3>
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
              {job.remote_type && (
                <Badge variant="outline" className="text-xs capitalize">
                  {job.remote_type}
                </Badge>
              )}
              {salaryText && (
                <span className="text-xs font-medium text-foreground/80">{salaryText}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ScoreBadge score={rec.matchScore} />
          </div>
        </div>

        <div className="mb-3">
          <MatchScoreBar score={rec.matchScore} />
        </div>

        {rec.recommendationSummary && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed italic">
            {rec.recommendationSummary}
          </p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide details" : "Show details"}
        </button>

        {expanded && (
          <div className="space-y-3 mt-2">
            {(rec.fitReasons as string[]).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1.5">Why it fits</p>
                <ul className="space-y-1">
                  {(rec.fitReasons as string[]).map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(rec.missingRequirements as string[]).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1.5">Gaps to bridge</p>
                <ul className="space-y-1">
                  {(rec.missingRequirements as string[]).map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                      <span className="text-amber-500 mt-0.5">△</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {job.description && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">About the role</p>
                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-4">
                  {job.description.replace(/<[^>]+>/g, "").trim()}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize">
            via {job.source === "adzuna" ? "Adzuna" : "The Muse"}
          </span>
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Apply now
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function JobRecommendations() {
  const { toast } = useToast();

  const [credits, setCredits] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("__latest__");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [country, setCountry] = useState("gb");
  const [remotePreference, setRemotePreference] = useState("any");
  const [roleType, setRoleType] = useState("");
  const [minScore, setMinScore] = useState(0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJobRecCredits()
      .then((d) => setCredits(d.jobRecCredits))
      .catch(() => setCredits(0));

    authedFetch(`${BASE}/applications`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const apps: Application[] = Array.isArray(data.applications)
          ? data.applications
          : Array.isArray(data)
          ? data
          : [];
        setApplications(apps);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await recommendJobs({
        applicationId: selectedApp !== "__latest__" ? selectedApp : undefined,
        preferredLocation: preferredLocation.trim() || undefined,
        country,
        remotePreference: remotePreference !== "any" ? remotePreference : undefined,
        roleType: roleType.trim() || undefined,
      });
      setResult(res);
      setCredits(res.remainingCredits);
      toast({ title: `${res.recommendations.length} jobs matched for you`, description: `${res.remainingCredits} recommendations remaining` });
    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong";
      setError(msg);
      if (err?.code === "NO_JOB_REC_CREDITS") {
        toast({ variant: "destructive", title: "No recommendation credits", description: "Unlock a CV analysis to receive 10 job recommendations." });
      } else {
        toast({ variant: "destructive", title: "Failed to get recommendations", description: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  const filtered = result?.recommendations.filter((r) => r.matchScore >= minScore) ?? [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Find Matching Jobs
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              AI-powered job recommendations based on your CV and preferences
            </p>
          </div>
          {credits !== null && (
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-medium">{credits}</span>
              <span className="text-muted-foreground">searches left</span>
            </div>
          )}
        </div>

        {credits === 0 && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">No recommendation credits remaining</p>
              <p className="text-amber-700 mt-0.5">
                Pro users get 10 fresh searches every day. Not on Pro? Unlock a CV analysis ($6.99) to receive 10 one-time searches.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Search Preferences</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {applications.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">CV to use</label>
                  <Select value={selectedApp} onValueChange={setSelectedApp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select application" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__latest__">Most recent CV</SelectItem>
                      {applications.slice(0, 20).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.jobTitle} @ {a.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Preferred location <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. London, Stockholm"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Country</label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gb">United Kingdom</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="nl">Netherlands</SelectItem>
                    <SelectItem value="se">Sweden</SelectItem>
                    <SelectItem value="sg">Singapore</SelectItem>
                    <SelectItem value="in">India</SelectItem>
                    <SelectItem value="nz">New Zealand</SelectItem>
                    <SelectItem value="za">South Africa</SelectItem>
                    <SelectItem value="br">Brazil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Work arrangement</label>
                <Select value={remotePreference} onValueChange={setRemotePreference}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="remote">Remote only</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Job title <span className="text-muted-foreground font-normal">(optional override)</span>
                </label>
                <Input
                  placeholder="e.g. Senior Product Manager"
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading || credits === 0}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finding matching jobs…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Find My Jobs {credits !== null && credits > 0 ? `(${credits} left)` : ""}
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {result.recommendations.length} Jobs Matched
                  {result.candidateName && (
                    <span className="text-muted-foreground font-normal ml-2 text-base">
                      for {result.candidateName}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Searched across {result.totalJobsFetched} live openings ·{" "}
                  {result.targetRoles.slice(0, 3).join(", ")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Min score</label>
                <Select
                  value={String(minScore)}
                  onValueChange={(v) => setMinScore(Number(v))}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All</SelectItem>
                    <SelectItem value="30">30%+</SelectItem>
                    <SelectItem value="50">50%+</SelectItem>
                    <SelectItem value="70">70%+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No jobs above {minScore}% match. Try lowering the filter.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((rec) => (
                  <JobCard key={rec.id} rec={rec} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
