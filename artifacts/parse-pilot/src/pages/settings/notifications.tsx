import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Bell, Save, Loader2, CheckCircle2 } from "lucide-react";
import { getNotificationPreferences, updateNotificationPreferences, type NotificationPreferences } from "@/lib/notifications-api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [reminderLeadHours, setReminderLeadHours] = useState(24);
  const [interviewLeadHours, setInterviewLeadHours] = useState(24);
  const [followUpDefaultDays, setFollowUpDefaultDays] = useState(5);

  useEffect(() => {
    getNotificationPreferences()
      .then((p) => {
        setPrefs(p);
        setEmailEnabled(p.emailEnabled);
        setInAppEnabled(p.inAppEnabled);
        setReminderLeadHours(p.reminderLeadHours);
        setInterviewLeadHours(p.interviewLeadHours);
        setFollowUpDefaultDays(p.followUpDefaultDays);
      })
      .catch(() => toast({ title: "Failed to load preferences", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateNotificationPreferences({
        emailEnabled,
        inAppEnabled,
        reminderLeadHours,
        interviewLeadHours,
        followUpDefaultDays,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Preferences saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/settings">
            <button className="text-sm text-muted-foreground hover:text-foreground">Settings</button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Notifications</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notification Settings</h1>
            <p className="text-sm text-muted-foreground">Control when and how Resuone reminds you</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Channels */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Notification Channels</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">In-app notifications</p>
                  <p className="text-xs text-muted-foreground">Show notifications in the notification center</p>
                </div>
                <button
                  role="switch"
                  aria-checked={inAppEnabled}
                  onClick={() => setInAppEnabled(!inAppEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${inAppEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${inAppEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </label>

              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Email notifications</p>
                  <p className="text-xs text-muted-foreground">Receive reminders and summaries by email (coming soon)</p>
                </div>
                <button
                  role="switch"
                  aria-checked={emailEnabled}
                  onClick={() => setEmailEnabled(!emailEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </label>
            </div>
          </div>

          {/* Timing */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Reminder Timing</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Interview reminder lead time
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  How many hours before an interview to send a reminder
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={72}
                    value={interviewLeadHours}
                    onChange={(e) => setInterviewLeadHours(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 text-sm font-medium text-center bg-muted rounded-lg px-2 py-1">
                    {interviewLeadHours}h
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  General reminder lead time
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  How many hours before a reminder is due to notify you
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={72}
                    value={reminderLeadHours}
                    onChange={(e) => setReminderLeadHours(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 text-sm font-medium text-center bg-muted rounded-lg px-2 py-1">
                    {reminderLeadHours}h
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Follow-up reminder (days after applying)
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Remind you to follow up this many days after applying
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={21}
                    value={followUpDefaultDays}
                    onChange={(e) => setFollowUpDefaultDays(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 text-sm font-medium text-center bg-muted rounded-lg px-2 py-1">
                    {followUpDefaultDays}d
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved!" : "Save Preferences"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
