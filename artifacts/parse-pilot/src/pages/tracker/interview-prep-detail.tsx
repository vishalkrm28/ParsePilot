import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getInterviewPrep,
  saveAnswerDraft,
  type InterviewPrep,
  type InterviewQuestionAnswer,
  type TrackedApp,
} from "@/lib/tracker-api";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Save,
  Building2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ANSWER_TYPE_COLORS: Record<string, string> = {
  behavioral: "bg-blue-50 text-blue-700 border-blue-200",
  technical: "bg-purple-50 text-purple-700 border-purple-200",
  role_fit: "bg-green-50 text-green-700 border-green-200",
  motivation: "bg-yellow-50 text-yellow-700 border-yellow-200",
  culture: "bg-pink-50 text-pink-700 border-pink-200",
  leadership: "bg-orange-50 text-orange-700 border-orange-200",
  experience: "bg-indigo-50 text-indigo-700 border-indigo-200",
  general: "bg-gray-50 text-gray-600 border-gray-200",
};

function QuestionCard({ qa, onSaved }: { qa: InterviewQuestionAnswer; onSaved: (id: string, draft: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(qa.answerDraft ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { toast } = useToast();

  async function handleSave() {
    setSaving(true);
    try {
      await saveAnswerDraft(qa.id, draft);
      setDirty(false);
      onSaved(qa.id, draft);
      toast({ title: "Answer saved" });
    } catch {
      toast({ variant: "destructive", title: "Failed to save answer" });
    } finally {
      setSaving(false);
    }
  }

  const hasDraft = !!draft.trim();

  return (
    <Card className={cn("transition-shadow", expanded ? "shadow-md" : "hover:shadow-sm")}>
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <Badge className={cn("text-[10px] shrink-0", ANSWER_TYPE_COLORS[qa.answerType] ?? ANSWER_TYPE_COLORS.general)}>
                {qa.answerType.replace(/_/g, " ")}
              </Badge>
              {hasDraft && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />}
            </div>
            <p className="font-medium text-sm mt-1.5 leading-snug">{qa.question}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
        </div>
      </button>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {qa.whyItMatters && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-1">Why it matters</p>
              <p className="text-xs text-amber-700">{qa.whyItMatters}</p>
            </div>
          )}
          {qa.answerStrategy && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-1">Answer strategy</p>
              <p className="text-xs text-blue-700">{qa.answerStrategy}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-foreground mb-1.5">Your answer draft</p>
            <Textarea
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
              placeholder="Write your answer here. Use the STAR method for behavioral questions: Situation, Task, Action, Result."
              rows={5}
              className="text-sm resize-none"
            />
            {dirty && (
              <Button
                size="sm"
                className="mt-2"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
                Save answer
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function InterviewPrepDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestionAnswer[]>([]);
  const [application, setApplication] = useState<TrackedApp | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getInterviewPrep(id!);
      setPrep(data.prep);
      setQuestions(data.questions);
      setApplication(data.application);
    } catch {
      toast({ variant: "destructive", title: "Failed to load interview prep" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function handleAnswerSaved(questionId: string, draft: string) {
    setQuestions((prev) => prev.map((q) => q.id === questionId ? { ...q, answerDraft: draft } : q));
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

  if (!prep) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Interview prep not found</h2>
          <Link href="/tracker/interview-preps">
            <Button className="mt-4" variant="outline">Back to list</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const prepJson = prep.prepJson as {
    prep_summary?: string;
    "30_second_pitch"?: string;
    "90_second_pitch"?: string;
    company_focus_areas?: string[];
    role_focus_areas?: string[];
    strengths_to_emphasize?: string[];
    risks_to_address?: string[];
    questions_to_ask_them?: string[];
  };

  const answeredCount = questions.filter((q) => q.answerDraft?.trim()).length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <Link href="/tracker/interview-preps">
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to interview preps
            </button>
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {application?.applicationTitle ?? prep.applicationTitle ?? "Interview Prep"}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {(application?.company ?? prep.company) && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {application?.company ?? prep.company}
                  </span>
                )}
                <span>
                  {new Date(prep.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
                <span className="text-primary font-medium">
                  {answeredCount}/{questions.length} answered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary + pitches */}
        {prep.prepSummary && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Prep Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{prep.prepSummary}</p>
            </CardContent>
          </Card>
        )}

        {(prepJson["30_second_pitch"] || prepJson["90_second_pitch"]) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prepJson["30_second_pitch"] && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">30-Second Pitch</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{prepJson["30_second_pitch"]}</p>
                </CardContent>
              </Card>
            )}
            {prepJson["90_second_pitch"] && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">90-Second Pitch</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{prepJson["90_second_pitch"]}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Focus areas */}
        {((prepJson.strengths_to_emphasize?.length ?? 0) > 0 || (prepJson.risks_to_address?.length ?? 0) > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(prepJson.strengths_to_emphasize?.length ?? 0) > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-green-700 uppercase tracking-wide">Strengths to Emphasize</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {prepJson.strengths_to_emphasize!.map((s, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {(prepJson.risks_to_address?.length ?? 0) > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Gaps to Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {prepJson.risks_to_address!.map((r, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">⚠</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Questions to ask */}
        {(prepJson.questions_to_ask_them?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Questions to Ask Them</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {prepJson.questions_to_ask_them!.map((q, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Practice questions */}
        {questions.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">
              Practice Questions
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({answeredCount}/{questions.length} answered)
              </span>
            </h2>
            <div className="space-y-2">
              {questions.map((qa) => (
                <QuestionCard key={qa.id} qa={qa} onSaved={handleAnswerSaved} />
              ))}
            </div>
          </div>
        )}

        {application && (
          <div className="pt-2 pb-8">
            <Link href={`/tracker/${application.id}`}>
              <Button variant="outline" className="w-full text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Application
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
