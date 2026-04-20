import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getTrackedApp,
  updateStage,
  updateNotes,
  linkAssets,
  updateAppStatus,
  createReminder,
  completeReminder,
  type TrackedApp,
  type TimelineEvent,
  type Reminder,
  type ApplicationStage,
  STAGE_LABELS,
  PIPELINE_STAGES,
  TERMINAL_STAGES,
} from "@/lib/tracker-api";
import {
  ArrowLeft,
  Loader2,
  FileText,
  MailOpen,
  ExternalLink,
  Clock,
  Bell,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Save,
  Archive,
  Building2,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

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

const EVENT_ICONS: Record<string, React.ReactNode> = {
  application_created: <Briefcase className="w-4 h-4" />,
  stage_changed: <ChevronRight className="w-4 h-4" />,
  assets_linked: <FileText className="w-4 h-4" />,
  interview_prep_generated: <Sparkles className="w-4 h-4" />,
};

const REMINDER_LABELS: Record<string, string> = {
  follow_up: "Follow-up",
  interview: "Interview",
  deadline: "Deadline",
  personal_note: "Personal note",
};

export default function AppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [app, setApp] = useState<TrackedApp | null>(null);
  const [tailoredCv, setTailoredCv] = useState<{ id: string; versionName: string | null } | null>(null);
  const [coverLetter, setCoverLetter] = useState<{ id: string; jobTitle: string | null; tone: string } | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [changingStage, setChangingStage] = useState(false);

  const [reminderType, setReminderType] = useState<"follow_up" | "interview" | "deadline" | "personal_note">("follow_up");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [addingReminder, setAddingReminder] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTrackedApp(id!);
      setApp(data.app);
      setTailoredCv(data.tailoredCv);
      setCoverLetter(data.coverLetter);
      setTimeline(data.timeline);
      setReminders(data.reminders);
      setNotes(data.app.notes ?? "");
    } catch {
      toast({ variant: "destructive", title: "Failed to load application" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleStageChange(stage: ApplicationStage) {
    if (!app) return;
    setChangingStage(true);
    try {
      await updateStage(app.id, stage);
      setApp((prev) => prev ? { ...prev, stage, updatedAt: new Date().toISOString() } : prev);
      toast({ title: `Stage: ${STAGE_LABELS[stage]}` });
      load();
    } catch {
      toast({ variant: "destructive", title: "Failed to update stage" });
    } finally {
      setChangingStage(false);
    }
  }

  async function handleSaveNotes() {
    if (!app) return;
    setSavingNotes(true);
    try {
      await updateNotes(app.id, notes);
      setNotesDirty(false);
      toast({ title: "Notes saved" });
    } catch {
      toast({ variant: "destructive", title: "Failed to save notes" });
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleAddReminder() {
    if (!app || !reminderDate) return;
    setAddingReminder(true);
    try {
      const { reminder } = await createReminder(app.id, {
        reminderType,
        reminderAt: new Date(reminderDate).toISOString(),
        reminderNote: reminderNote || null,
      });
      setReminders((prev) => [...prev, reminder]);
      setReminderDate("");
      setReminderNote("");
      toast({ title: "Reminder set" });
    } catch {
      toast({ variant: "destructive", title: "Failed to add reminder" });
    } finally {
      setAddingReminder(false);
    }
  }

  async function handleCompleteReminder(reminderId: string) {
    try {
      await completeReminder(reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      toast({ title: "Reminder completed" });
    } catch {
      toast({ variant: "destructive", title: "Failed to complete reminder" });
    }
  }

  async function handleArchive() {
    if (!app) return;
    try {
      await updateAppStatus(app.id, "archived");
      toast({ title: "Application archived" });
      navigate("/tracker");
    } catch {
      toast({ variant: "destructive", title: "Failed to archive" });
    }
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

  if (!app) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Application not found</h2>
          <Link href="/tracker">
            <Button className="mt-4" variant="outline">Back to pipeline</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const allStages: ApplicationStage[] = [...PIPELINE_STAGES, ...TERMINAL_STAGES];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <Link href="/tracker">
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to pipeline
            </button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">{app.applicationTitle}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                {app.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {app.company}
                  </span>
                )}
                {app.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {app.location}
                  </span>
                )}
                {app.appliedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Applied {new Date(app.appliedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-sm px-3 py-1", STAGE_COLORS[app.stage])}>
                {STAGE_LABELS[app.stage]}
              </Badge>
              {app.applyUrl && (
                <a href={app.applyUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Apply
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Stage control */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allStages.map((s) => (
                    <button
                      key={s}
                      disabled={changingStage}
                      onClick={() => handleStageChange(s)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                        s === app.stage
                          ? STAGE_COLORS[s] + " ring-2 ring-offset-1 ring-current"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Linked assets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Linked Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tailoredCv ? (
                  <Link href={`/application/tailored-cvs/${tailoredCv.id}`}>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        {tailoredCv.versionName ?? "Tailored CV"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-blue-400 ml-auto" />
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                    <FileText className="w-4 h-4" />
                    No tailored CV linked
                    <Link href="/application/tailored-cvs" className="ml-auto text-xs text-primary hover:underline">
                      Create one
                    </Link>
                  </div>
                )}
                {coverLetter ? (
                  <Link href={`/application/cover-letters`}>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                      <MailOpen className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">
                        {coverLetter.jobTitle ?? "Cover Letter"} · {coverLetter.tone}
                      </span>
                      <ChevronRight className="w-4 h-4 text-purple-400 ml-auto" />
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                    <MailOpen className="w-4 h-4" />
                    No cover letter linked
                    <Link href="/application/cover-letters" className="ml-auto text-xs text-primary hover:underline">
                      Create one
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interview Prep */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Interview Prep
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/tracker/interview-prep/generate?appId=${app.id}`}>
                  <Button variant="outline" className="w-full text-sm">
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Generate Interview Prep
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Costs 1 credit · AI-grounded in your CV and this role
                </p>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                  placeholder="Add notes about this application, company research, contact names…"
                  rows={5}
                  className="text-sm resize-none"
                />
                {notesDirty && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                  >
                    {savingNotes ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Save notes
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No events yet</p>
                ) : (
                  <div className="space-y-3">
                    {timeline.map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          {EVENT_ICONS[event.eventType] ?? <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{event.title}</p>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(event.eventAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side column */}
          <div className="space-y-5">
            {/* Reminders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reminders.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No upcoming reminders</p>
                ) : (
                  <div className="space-y-2">
                    {reminders.map((r) => (
                      <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{REMINDER_LABELS[r.reminderType]}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(r.reminderAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                          {r.reminderNote && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{r.reminderNote}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleCompleteReminder(r.id)}
                          className="text-green-600 hover:text-green-700 shrink-0"
                          title="Mark done"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add reminder form */}
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-medium">Add reminder</p>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value as typeof reminderType)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-transparent px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="follow_up">Follow-up</option>
                    <option value="interview">Interview</option>
                    <option value="deadline">Deadline</option>
                    <option value="personal_note">Personal note</option>
                  </select>
                  <Input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Optional note…"
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={handleAddReminder}
                    disabled={!reminderDate || addingReminder}
                  >
                    {addingReminder ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Set Reminder
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {app.stage !== "applied" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-8 justify-start"
                    onClick={() => handleStageChange("applied")}
                    disabled={changingStage}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-purple-500" />
                    Mark as Applied
                  </Button>
                )}
                {app.stage !== "interview" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-8 justify-start"
                    onClick={() => handleStageChange("interview")}
                    disabled={changingStage}
                  >
                    <Briefcase className="w-3.5 h-3.5 mr-2 text-orange-500" />
                    Move to Interview
                  </Button>
                )}
                {app.stage !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-8 justify-start text-red-600 hover:text-red-700"
                    onClick={() => handleStageChange("rejected")}
                    disabled={changingStage}
                  >
                    <AlertCircle className="w-3.5 h-3.5 mr-2" />
                    Mark Rejected
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs h-8 justify-start text-muted-foreground"
                  onClick={handleArchive}
                >
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  Archive Application
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
