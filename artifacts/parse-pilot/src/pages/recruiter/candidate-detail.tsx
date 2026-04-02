import { useState, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCandidate, updateCandidateStatus,
  getCandidateNotes, addCandidateNote, deleteCandidateNote,
} from "@/lib/recruiter-api";
import {
  Loader2, ArrowLeft, Mail, CheckCircle2, XCircle, Star, Clock,
  BarChart3, Briefcase, MessageSquare, Trash2, Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InviteModal } from "./invite-modal";
import { StatusBadge } from "./status-badge";

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["candidate", id],
    queryFn: () => getCandidate(id),
  });

  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ["candidate-notes", id],
    queryFn: () => getCandidateNotes(id),
  });
  const notes: any[] = notesData?.notes ?? [];

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateCandidateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      qc.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const addNoteMutation = useMutation({
    mutationFn: (text: string) => addCandidateNote(id, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate-notes", id] });
      setNoteText("");
    },
    onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deleteCandidateNote(id, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate-notes", id] }),
    onError: () => toast({ title: "Failed to delete note", variant: "destructive" }),
  });

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate(noteText.trim());
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (error || !data?.candidate) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Candidate not found.</p>
        <Link href="/recruiter/dashboard" className="text-primary hover:underline text-sm">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const { candidate, invites = [] } = data;
  const skills: string[] = candidate.skills ?? [];
  const parsedCv = candidate.parsedCvJson as any;
  const missingKeywords: string[] = parsedCv?.missing_keywords ?? [];
  const workExp = parsedCv?.work_experience ?? [];
  const scoreBreakdown = candidate.scoringBreakdownJson as any ?? null;

  const actionButtons = [
    {
      label: "Invite to Interview",
      icon: Mail,
      color: "bg-primary text-primary-foreground hover:bg-primary/90",
      onClick: () => setInviteOpen(true),
    },
    {
      label: "Shortlist",
      icon: Star,
      color: "border border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-900/20",
      onClick: () => statusMutation.mutate("invited"),
    },
    {
      label: "Reject",
      icon: XCircle,
      color: "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20",
      onClick: () => { if (confirm("Reject this candidate?")) statusMutation.mutate("rejected"); },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate("/recruiter/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-border/60">|</span>
          <span className="font-semibold text-foreground text-sm">{candidate.name}</span>
          <div className="ml-auto"><StatusBadge status={candidate.status} /></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* LEFT: main content */}
          <div className="space-y-6">
            {/* Header card */}
            <div className="border border-border/40 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-foreground mb-1">{candidate.name}</h1>
                  <p className="text-muted-foreground text-sm">{candidate.email}</p>
                  {candidate.jobTitle && (
                    <p className="text-muted-foreground text-sm mt-0.5">
                      {candidate.jobTitle}{candidate.company ? ` · ${candidate.company}` : ""}
                    </p>
                  )}
                </div>
                {candidate.score != null && (
                  <div className="text-center shrink-0">
                    <div className="text-5xl font-extrabold text-primary leading-none">{Math.round(candidate.score)}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Match Score</div>
                  </div>
                )}
              </div>

              {candidate.score != null && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Overall match</span><span>{Math.round(candidate.score)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${candidate.score}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Score breakdown */}
            {scoreBreakdown && (
              <div className="border border-border/40 rounded-2xl p-6">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Match Breakdown
                </h2>
                <div className="space-y-3">
                  {Object.entries(scoreBreakdown).map(([key, val]: [string, any]) => {
                    if (typeof val !== "number") return null;
                    const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground capitalize">{label}</span>
                          <span className="font-semibold text-foreground">{Math.round(val)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${val}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="border border-border/40 rounded-2xl p-6">
                <h2 className="font-bold text-foreground mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="bg-primary/8 border border-primary/15 text-primary text-xs font-medium px-3 py-1.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing keywords */}
            {missingKeywords.length > 0 && (
              <div className="border border-border/40 rounded-2xl p-6">
                <h2 className="font-bold text-foreground mb-4 text-red-600 dark:text-red-400">Missing Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {missingKeywords.map(k => (
                    <span key={k} className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 text-xs font-medium px-3 py-1.5 rounded-full">✕ {k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {candidate.experience && (
              <div className="border border-border/40 rounded-2xl p-6">
                <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Experience Summary
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{candidate.experience}</p>
              </div>
            )}

            {/* Work history from parsed CV */}
            {workExp.length > 0 && (
              <div className="border border-border/40 rounded-2xl p-6">
                <h2 className="font-bold text-foreground mb-4">Work History</h2>
                <div className="space-y-5">
                  {workExp.map((job: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary/20 pl-4">
                      <p className="font-semibold text-foreground text-sm">{job.title}</p>
                      <p className="text-muted-foreground text-xs mb-2">{job.company} · {job.start_date} – {job.end_date ?? "Present"}</p>
                      {job.bullets?.slice(0, 2).map((b: string, j: number) => (
                        <p key={j} className="text-muted-foreground text-xs leading-relaxed">• {b}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite history */}
            {invites.length > 0 && (
              <div className="border border-border/40 rounded-2xl p-6">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Invite History
                </h2>
                <div className="space-y-3">
                  {invites.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-foreground capitalize">{inv.type}</span>
                        <span className="text-xs text-muted-foreground ml-2">{new Date(inv.createdAt).toLocaleDateString()}</span>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Notes Timeline ─────────────────────────────────────────── */}
            <div className="border border-border/40 rounded-2xl p-6">
              <h2 className="font-bold text-foreground mb-5 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Notes
                {notes.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground">{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
                )}
              </h2>

              {/* Add note input */}
              <div className="mb-5">
                <textarea
                  ref={noteInputRef}
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
                  placeholder="Add a private note about this candidate… (Cmd+Enter to save)"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || addNoteMutation.isPending}
                    className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {addNoteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Add Note
                  </button>
                </div>
              </div>

              {/* Timeline */}
              {notesLoading ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading notes…
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No notes yet. Add one above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <div key={note.id} className="group flex items-start gap-3 p-3.5 rounded-xl bg-muted/15 hover:bg-muted/25 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1.5">
                          {new Date(note.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium", timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => { if (confirm("Delete this note?")) deleteNoteMutation.mutate(note.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-red-500 p-1 rounded-md"
                        title="Delete note">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: sticky action panel */}
          <div className="lg:sticky lg:top-20 h-fit">
            <div className="border border-border/40 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Actions</p>
              {actionButtons.map(btn => (
                <button key={btn.label} onClick={btn.onClick}
                  disabled={statusMutation.isPending}
                  className={`w-full flex items-center gap-2.5 justify-center py-2.5 rounded-xl text-sm font-semibold transition-all ${btn.color}`}>
                  <btn.icon className="w-4 h-4" />
                  {btn.label}
                </button>
              ))}

              <hr className="border-border/40 my-2" />

              <div>
                <p className="text-xs text-muted-foreground mb-2">Override status</p>
                <select value={candidate.status} onChange={e => statusMutation.mutate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="new">New</option>
                  <option value="invited">Invited</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </main>

      {inviteOpen && (
        <InviteModal
          candidate={{ id: candidate.id, name: candidate.name, email: candidate.email }}
          onClose={() => setInviteOpen(false)}
          onSent={() => {
            qc.invalidateQueries({ queryKey: ["candidate", id] });
            qc.invalidateQueries({ queryKey: ["candidates"] });
            toast({ title: "Invite sent", description: `Email sent to ${candidate.email}` });
            setInviteOpen(false);
          }}
        />
      )}
    </div>
  );
}
