import { useAuth } from "@workspace/replit-auth-web";
import { useListApplications, useDeleteApplication } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Link } from "wouter";
import {
  Plus,
  FileText,
  ArrowRight,
  Loader2,
  Sparkles,
  Trash2,
  Building2,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const statusConfig = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-muted-foreground/20" },
  analyzed: { label: "Analyzed", className: "bg-primary/10 text-primary border-primary/20" },
  exported: { label: "Exported", className: "bg-green-500/10 text-green-600 border-green-500/20" },
} as const;

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: applications, isLoading } = useListApplications(
    { userId: user?.id ?? "" },
    { query: { enabled: !!user?.id } },
  );

  const deleteMutation = useDeleteApplication({
    mutation: {
      onSuccess: () => toast({ title: "Application deleted" }),
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    },
  });

  const analyzed = applications?.filter((a) => a.status !== "draft").length ?? 0;
  const avgScore =
    applications && applications.length > 0
      ? Math.round(
          applications
            .filter((a) => a.keywordMatchScore != null)
            .reduce((sum, a) => sum + (a.keywordMatchScore ?? 0), 0) /
            Math.max(1, applications.filter((a) => a.keywordMatchScore != null).length),
        )
      : null;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Applications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage and optimize your tailored CVs.
          </p>
        </div>
        <Link href="/new">
          <Button size="lg" className="gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {applications && applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold">{applications.length}</p>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Analyzed</p>
            <p className="text-2xl font-bold text-primary">{analyzed}</p>
          </div>
          {avgScore !== null && (
            <div className="bg-card border border-card-border rounded-xl p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Match</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">{avgScore}</p>
                <p className="text-sm text-muted-foreground">%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applications list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : !applications || applications.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
            Create your first application by uploading your CV and pasting a job description.
          </p>
          <Link href="/new">
            <Button size="lg" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Optimize a CV
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {applications.map((app, i) => {
              const status = statusConfig[app.status as keyof typeof statusConfig] ?? statusConfig.draft;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="group hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base truncate">{app.jobTitle}</h3>
                            <Badge className={`text-xs border ${status.className}`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              {app.company}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(app.createdAt), "MMM d, yyyy")}
                            </span>
                            {app.keywordMatchScore != null && (
                              <span className="flex items-center gap-1.5 text-primary font-medium">
                                <TrendingUp className="w-3.5 h-3.5" />
                                {Math.round(app.keywordMatchScore)}% match
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              deleteMutation.mutate({ id: app.id });
                            }}
                            className="p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link href={`/applications/${app.id}`}>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                              View
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </AppLayout>
  );
}
