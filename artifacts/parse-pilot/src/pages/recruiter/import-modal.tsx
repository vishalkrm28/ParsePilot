import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getImportSources, importFromAnalyses } from "@/lib/recruiter-api";
import { X, Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";

interface Props { onClose: () => void; onImported: (count: number) => void; }

export function ImportFromAnalysesModal({ onClose, onImported }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({ queryKey: ["import-sources"], queryFn: getImportSources });
  const sources: any[] = data?.sources ?? [];
  const available = sources.filter(s => !s.alreadyImported);

  const mutation = useMutation({
    mutationFn: () => importFromAnalyses(Array.from(selected)),
    onSuccess: (data) => onImported(data.imported ?? selected.size),
  });

  const toggle = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleAll = () => {
    setSelected(prev => prev.size === available.length ? new Set() : new Set(available.map((s: any) => s.id)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-base">Import from CV Analyses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select analyses to import as recruiter candidates</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No completed CV analyses found.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Analyze a CV first to import it here.</p>
            </div>
          ) : (
            <>
              {/* Select all */}
              {available.length > 0 && (
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/30">
                  <input type="checkbox"
                    checked={selected.size === available.length && available.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary" />
                  <span className="text-sm text-muted-foreground">
                    Select all available ({available.length})
                    {selected.size > 0 && ` · ${selected.size} selected`}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {sources.map((s: any) => (
                  <label key={s.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      s.alreadyImported
                        ? "border-border/20 opacity-50 cursor-not-allowed"
                        : selected.has(s.id)
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/40 hover:border-primary/25 hover:bg-muted/10"
                    }`}>
                    <input type="checkbox"
                      disabled={s.alreadyImported}
                      checked={selected.has(s.id)}
                      onChange={() => !s.alreadyImported && toggle(s.id)}
                      className="rounded border-border accent-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{s.name || "Unknown"}</span>
                        {s.email && <span className="text-xs text-muted-foreground">{s.email}</span>}
                        {s.alreadyImported && (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3" /> Imported
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.jobTitle}{s.company ? ` · ${s.company}` : ""}
                        {s.score != null ? ` · ${Math.round(s.score)}% match` : ""}
                      </p>
                      {(s.skills ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(s.skills as string[]).slice(0, 4).map((skill: string) => (
                            <span key={skill} className="text-xs bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-full">{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/60 shrink-0">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/40 shrink-0">
          <span className="text-xs text-muted-foreground">
            {selected.size === 0 ? "No analyses selected" : `${selected.size} selected`}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors">
              Cancel
            </button>
            <button onClick={() => mutation.mutate()}
              disabled={selected.size === 0 || mutation.isPending}
              className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Import {selected.size > 0 ? `(${selected.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
