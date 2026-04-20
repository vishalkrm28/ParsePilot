import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Bell, CheckCircle2, Clock, AlertTriangle, ChevronRight,
  XCircle, Loader2, RefreshCw, BellOff, Calendar,
} from "lucide-react";
import {
  listNotifications,
  updateNotificationStatus,
  snoozeNotification,
  deleteNotification,
  groupByBucket,
  PRIORITY_COLORS,
  NOTIFICATION_TYPE_LABELS,
  type NotificationItem,
} from "@/lib/notifications-api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatDue(dueAt: string | null | undefined): string {
  if (!dueAt) return "";
  const d = new Date(dueAt);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const hours = Math.floor(absDiff / 3_600_000);
  const days = Math.floor(absDiff / 86_400_000);
  if (diff < 0) {
    if (hours < 24) return `${hours}h overdue`;
    return `${days}d overdue`;
  }
  if (hours < 1) return "Due soon";
  if (hours < 24) return `In ${hours}h`;
  return `In ${days}d`;
}

function NotificationCard({
  item,
  onComplete,
  onDismiss,
  onSnooze,
}: {
  item: NotificationItem;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, until: string) => void;
}) {
  const [snoozing, setSnoozing] = useState(false);
  const overdue = item.dueAt ? new Date(item.dueAt) < new Date() : false;

  const handleSnooze1h = () => {
    const until = new Date(Date.now() + 3_600_000).toISOString();
    onSnooze(item.id, until);
  };
  const handleSnooze1d = () => {
    const until = new Date(Date.now() + 86_400_000).toISOString();
    onSnooze(item.id, until);
  };

  return (
    <div className={cn(
      "rounded-xl border bg-card p-4 flex gap-3 transition-all",
      overdue && item.status === "pending" ? "border-red-200 bg-red-50/40" : "",
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {item.priority === "urgent" ? (
          <AlertTriangle className="w-5 h-5 text-red-500" />
        ) : item.priority === "high" ? (
          <Bell className="w-5 h-5 text-orange-500" />
        ) : (
          <Bell className="w-5 h-5 text-blue-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full border font-medium",
              PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.low,
            )}>
              {item.priority}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
              {NOTIFICATION_TYPE_LABELS[item.type] ?? item.type}
            </span>
          </div>
        </div>

        {item.body && (
          <p className="text-sm text-muted-foreground mt-1">{item.body}</p>
        )}

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {item.dueAt && (
            <span className={cn(
              "flex items-center gap-1 text-xs",
              overdue ? "text-red-600 font-medium" : "text-muted-foreground",
            )}>
              <Clock className="w-3.5 h-3.5" />
              {formatDue(item.dueAt)}
            </span>
          )}

          {item.actionLabel && item.actionUrl && (
            <Link href={item.actionUrl}>
              <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                {item.actionLabel}
                <ChevronRight className="w-3 h-3" />
              </button>
            </Link>
          )}

          {item.status === "pending" && (
            <>
              <button
                onClick={() => onComplete(item.id)}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Done
              </button>

              <div className="relative">
                <button
                  onClick={() => setSnoozing(!snoozing)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Snooze
                </button>
                {snoozing && (
                  <div className="absolute top-6 left-0 z-10 bg-popover border rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-[120px]">
                    <button onClick={() => { handleSnooze1h(); setSnoozing(false); }} className="text-xs px-3 py-1.5 hover:bg-muted rounded text-left">1 hour</button>
                    <button onClick={() => { handleSnooze1d(); setSnoozing(false); }} className="text-xs px-3 py-1.5 hover:bg-muted rounded text-left">1 day</button>
                  </div>
                )}
              </div>

              <button
                onClick={() => onDismiss(item.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 font-medium"
              >
                <XCircle className="w-3.5 h-3.5" />
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BucketSection({
  title,
  items,
  icon: Icon,
  iconClass,
  emptyText,
  onComplete,
  onDismiss,
  onSnooze,
}: {
  title: string;
  items: NotificationItem[];
  icon: React.ElementType;
  iconClass: string;
  emptyText?: string;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, until: string) => void;
}) {
  if (items.length === 0 && !emptyText) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("w-4 h-4", iconClass)} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {items.length > 0 && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{items.length}</span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic pl-6">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onComplete={onComplete}
              onDismiss={onDismiss}
              onSnooze={onSnooze}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listNotifications({ limit: 100 });
      setNotifications(items);
    } catch {
      toast({ title: "Failed to load notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id: string) => {
    try {
      const updated = await updateNotificationStatus(id, "completed");
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      toast({ title: "Marked as complete" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const updated = await updateNotificationStatus(id, "dismissed");
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {
      toast({ title: "Failed to dismiss", variant: "destructive" });
    }
  };

  const handleSnooze = async (id: string, until: string) => {
    try {
      const updated = await snoozeNotification(id, until);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      toast({ title: "Snoozed" });
    } catch {
      toast({ title: "Failed to snooze", variant: "destructive" });
    }
  };

  const active = notifications.filter((n) => n.status !== "completed" && n.status !== "dismissed");
  const buckets = groupByBucket(active);
  const completed = notifications.filter((n) => n.status === "completed" || n.status === "dismissed");

  const totalActive = active.length;
  const overdueCount = buckets.overdue.length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalActive === 0
                ? "You're all caught up"
                : `${totalActive} active${overdueCount > 0 ? `, ${overdueCount} overdue` : ""}`}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : totalActive === 0 && completed.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BellOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">Notifications appear as you track applications and schedule interviews.</p>
            <Link href="/tracker">
              <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                Open Pipeline
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <BucketSection
              title="Overdue"
              items={buckets.overdue}
              icon={AlertTriangle}
              iconClass="text-red-500"
              onComplete={handleComplete}
              onDismiss={handleDismiss}
              onSnooze={handleSnooze}
            />
            <BucketSection
              title="Today"
              items={buckets.today}
              icon={Clock}
              iconClass="text-orange-500"
              emptyText="Nothing due today"
              onComplete={handleComplete}
              onDismiss={handleDismiss}
              onSnooze={handleSnooze}
            />
            <BucketSection
              title="Upcoming"
              items={buckets.upcoming}
              icon={Calendar}
              iconClass="text-blue-500"
              onComplete={handleComplete}
              onDismiss={handleDismiss}
              onSnooze={handleSnooze}
            />

            {/* Completed toggle */}
            {completed.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {showCompleted ? "Hide" : "Show"} completed &amp; dismissed ({completed.length})
                </button>
                {showCompleted && (
                  <div className="space-y-2 opacity-60">
                    {completed.slice(0, 10).map((item) => (
                      <NotificationCard
                        key={item.id}
                        item={item}
                        onComplete={handleComplete}
                        onDismiss={handleDismiss}
                        onSnooze={handleSnooze}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
