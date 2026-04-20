import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  listTailoredCvs,
  duplicateTailoredCv,
  renameTailoredCv,
  type TailoredCvSummary,
} from "@/lib/application-api";
import {
  FileText,
  Sparkles,
  Copy,
  Pencil,
  ExternalLink,
  Loader2,
  Plus,
  Tag,
  Building2,
  Calendar,
  ChevronRight,
  MailOpen,
} from "lucide-react";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <FileText className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No tailored CVs yet</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Head to <strong>Find Jobs</strong> and click <em>Tailor CV</em> on any job card to create your first tailored version.
      </p>
      <Link href="/jobs/recommendations">
        <Button>
          <Sparkles className="w-4 h-4 mr-2" />
          Go to Find Jobs
        </Button>
      </Link>
    </div>
  );
}

function RenameDialog({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(current);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="font-semibold mb-3">Rename version</h3>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave(value.trim())}
          className="mb-4"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(value.trim())} disabled={!value.trim()}>Save</Button>
        </div>
      </div>
    </div>
  );
}

export default function TailoredCvsPage() {
  const { toast } = useToast();
  const [cvs, setCvs] = useState<TailoredCvSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState<TailoredCvSummary | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    listTailoredCvs()
      .then(setCvs)
      .catch(() => toast({ variant: "destructive", title: "Failed to load tailored CVs" }))
      .finally(() => setLoading(false));
  }, []);

  async function handleDuplicate(cv: TailoredCvSummary) {
    setDuplicating(cv.id);
    try {
      const copy = await duplicateTailoredCv(cv.id);
      setCvs((prev) => [copy, ...prev]);
      toast({ title: "Duplicated", description: copy.versionName ?? "Copy created" });
    } catch {
      toast({ variant: "destructive", title: "Failed to duplicate" });
    } finally {
      setDuplicating(null);
    }
  }

  async function handleRename(cv: TailoredCvSummary, newName: string) {
    if (!newName) return;
    try {
      await renameTailoredCv(cv.id, newName);
      setCvs((prev) =>
        prev.map((c) => (c.id === cv.id ? { ...c, versionName: newName } : c)),
      );
      toast({ title: "Renamed" });
    } catch {
      toast({ variant: "destructive", title: "Failed to rename" });
    } finally {
      setRenaming(null);
    }
  }

  return (
    <AppLayout>
      {renaming && (
        <RenameDialog
          current={renaming.versionName ?? ""}
          onSave={(name) => handleRename(renaming, name)}
          onClose={() => setRenaming(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Tailored CVs
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              AI-tailored versions of your CV, optimised for specific roles
            </p>
          </div>
          <Link href="/jobs/recommendations">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Version
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : cvs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {cvs.map((cv) => (
              <Card key={cv.id} className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-semibold text-base leading-tight">
                          {cv.versionName ?? "Tailored CV"}
                        </h3>
                        {cv.atsKeywordsAdded.length > 0 && (
                          <Badge variant="outline" className="text-xs text-primary border-primary/30">
                            <Tag className="w-2.5 h-2.5 mr-1" />
                            {cv.atsKeywordsAdded.length} ATS keywords
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {cv.jobCompany && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {cv.jobCompany}
                          </span>
                        )}
                        {cv.jobTitle && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {cv.jobTitle}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(cv.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {cv.tailoringSummary && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {cv.tailoringSummary}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/application/tailored-cvs/${cv.id}`}>
                        <Button size="sm" variant="default" className="w-full">
                          Open
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRenaming(cv)}
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicate(cv)}
                          disabled={duplicating === cv.id}
                          title="Duplicate"
                        >
                          {duplicating === cv.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Link href={`/application/tailored-cvs/${cv.id}?action=cover-letter`}>
                          <Button size="sm" variant="outline" title="Generate Cover Letter">
                            <MailOpen className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
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
