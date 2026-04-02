import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCandidate } from "@/lib/recruiter-api";
import { parseCsvText, CSV_TEMPLATE, type ParsedCsvCandidate } from "./csv-import";
import { X, Upload, FileText, Loader2, AlertCircle, CheckCircle2, Download } from "lucide-react";

interface Props { onClose: () => void; onImported: (count: number) => void; }

export function CsvImportModal({ onClose, onImported }: Props) {
  const [candidates, setCandidates] = useState<ParsedCsvCandidate[]>([]);
  const [phase, setPhase] = useState<"upload" | "preview" | "done">("upload");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsvText(text);
      setCandidates(parsed);
      setPhase("preview");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    const valid = candidates.filter(c => !c._error);
    setImporting(true);
    let success = 0, errors = 0;
    for (const c of valid) {
      try {
        await createCandidate({
          name: c.name, email: c.email, score: c.score, skills: c.skills,
          experience: c.experience, jobTitle: c.jobTitle, company: c.company, notes: c.notes,
        });
        success++;
      } catch { errors++; }
    }
    setResults({ success, errors });
    setPhase("done");
    setImporting(false);
    qc.invalidateQueries({ queryKey: ["candidates"] });
    qc.invalidateQueries({ queryKey: ["recruiter-analytics"] });
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "parsepilot-candidates-template.csv";
    a.click(); URL.revokeObjectURL(url);
  };

  const valid = candidates.filter(c => !c._error);
  const invalid = candidates.filter(c => !!c._error);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div>
            <h2 className="font-bold text-foreground text-base">Import from CSV</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Bulk-add candidates from a spreadsheet</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/40">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {phase === "upload" && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border/40 rounded-xl p-10 text-center hover:border-primary/30 hover:bg-muted/10 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Drop a CSV file or click to browse</p>
                <p className="text-xs text-muted-foreground">CSV with columns: Name, Email, Score, Skills, Experience, Job Title, Company</p>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Not sure about the format?</span>
                <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                  <Download className="w-3 h-3" /> Download template
                </button>
              </div>
            </div>
          )}

          {phase === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {valid.length} valid
                </span>
                {invalid.length > 0 && (
                  <span className="flex items-center gap-1.5 text-red-500 font-medium">
                    <AlertCircle className="w-4 h-4" /> {invalid.length} will be skipped
                  </span>
                )}
              </div>

              <div className="border border-border/40 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/20 border-b border-border/30">
                      <th className="px-3 py-2 text-left font-semibold text-foreground">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-foreground">Email</th>
                      <th className="px-3 py-2 text-left font-semibold text-foreground">Score</th>
                      <th className="px-3 py-2 text-left font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {candidates.map(c => (
                      <tr key={c._row} className={c._error ? "bg-red-50/50 dark:bg-red-900/10" : ""}>
                        <td className="px-3 py-2 text-foreground">{c.name}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[140px]">{c.email || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.score != null ? `${c.score}%` : "—"}</td>
                        <td className="px-3 py-2">
                          {c._error
                            ? <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{c._error}</span>
                            : <span className="text-green-600 dark:text-green-400">✓ Ready</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="font-bold text-foreground text-lg mb-1">{results.success} candidates imported</p>
              {results.errors > 0 && <p className="text-sm text-muted-foreground">{results.errors} rows skipped due to errors</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/40">
          <button onClick={phase === "done" ? () => onImported(results.success) : onClose}
            className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors">
            {phase === "done" ? "Close" : "Cancel"}
          </button>
          {phase === "preview" && (
            <button onClick={handleImport} disabled={valid.length === 0 || importing}
              className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Import {valid.length} candidates
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
