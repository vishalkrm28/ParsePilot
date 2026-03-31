import { cn } from "@/lib/utils";

interface CvRendererProps {
  text: string;
  className?: string;
}

type LineKind =
  | "name"
  | "section"
  | "role"
  | "bullet"
  | "blank"
  | "text";

interface ParsedLine {
  kind: LineKind;
  raw: string;
}

const SECTION_CAPS_RE = /^[A-Z][A-Z\s&/(),\-–]{3,}$/;
const ROLE_LINE_RE = /\|/;
const BULLET_RE = /^[•·\-–*]\s/;

function classifyLine(line: string, index: number, isFirst: boolean): LineKind {
  const trimmed = line.trim();
  if (!trimmed) return "blank";
  if (isFirst) return "name";
  if (SECTION_CAPS_RE.test(trimmed)) return "section";
  if (BULLET_RE.test(trimmed)) return "bullet";
  if (ROLE_LINE_RE.test(trimmed)) return "role";
  return "text";
}

function parseLines(text: string): ParsedLine[] {
  const rawLines = text.split("\n");
  const result: ParsedLine[] = [];
  let firstNonBlankSeen = false;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    const isFirst = !firstNonBlankSeen && !!trimmed;
    if (trimmed) firstNonBlankSeen = true;
    result.push({ kind: classifyLine(trimmed, result.length, isFirst), raw: trimmed });
  }

  return result;
}

function highlightRoleBar(line: string) {
  const parts = line.split("|").map(s => s.trim());
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2 text-muted-foreground/40">|</span>}
          <span className={i === 1 ? "font-bold text-foreground" : i === 2 ? "text-primary font-medium" : ""}>{part}</span>
        </span>
      ))}
    </span>
  );
}

export function CvRenderer({ text, className }: CvRendererProps) {
  if (!text?.trim()) return null;

  const lines = parseLines(text);

  return (
    <div className={cn("cv-doc font-sans text-[13.5px] leading-relaxed text-foreground px-8 py-8 space-y-0.5", className)}>
      {lines.map((line, idx) => {
        if (line.kind === "blank") {
          return <div key={idx} className="h-2" />;
        }

        if (line.kind === "name") {
          return (
            <h1 key={idx} className="text-2xl font-bold tracking-tight text-foreground mb-1">
              {line.raw}
            </h1>
          );
        }

        if (line.kind === "section") {
          return (
            <div key={idx} className="mt-5 mb-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black tracking-widest uppercase text-primary">
                  {line.raw}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>
          );
        }

        if (line.kind === "role") {
          return (
            <p key={idx} className="text-sm mt-2 mb-0.5 text-muted-foreground">
              {highlightRoleBar(line.raw)}
            </p>
          );
        }

        if (line.kind === "bullet") {
          const content = line.raw.replace(/^[•·\-–*]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
              <span className="text-foreground/90">{content}</span>
            </div>
          );
        }

        // plain text
        return (
          <p key={idx} className="text-foreground/85">
            {line.raw}
          </p>
        );
      })}
    </div>
  );
}
