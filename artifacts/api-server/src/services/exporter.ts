import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  AlignmentType,
  BorderStyle,
} from "docx";

// ─── CV Text Parser ───────────────────────────────────────────────────────────

type LineKind =
  | { type: "name"; text: string }
  | { type: "contact"; text: string }
  | { type: "heading"; text: string }
  | { type: "job"; company: string; titleAndDate: string }
  | { type: "bullet"; text: string }
  | { type: "body"; text: string }
  | { type: "blank" };

// All-caps headings like "PROFESSIONAL SUMMARY", "WORK EXPERIENCE", "SKILLS" etc.
const HEADING_RE = /^[A-Z][A-Z\s&\/\-]{2,}$/;

// Bullet lines starting with common markers
const BULLET_RE = /^[•\-\*]\s+(.+)$/;

// Job/role lines: "Company | Title | Date" — only using pipe, max 120 chars, starts with capital
// We require a pipe separator (not / or \ which appear in regular sentences)
const JOB_RE = /^([A-Z].{0,60}?)\s*\|\s*(.{2,80})$/;

// Sections where job-line detection is inappropriate (summary, education intro, etc.)
const NON_JOB_SECTIONS = new Set([
  "PROFESSIONAL SUMMARY",
  "SUMMARY",
  "PROFILE",
  "OBJECTIVE",
  "CAREER OBJECTIVE",
  "ABOUT",
]);

function parseLines(text: string): LineKind[] {
  const raw = text.split("\n").map((l) => l.trim());
  const result: LineKind[] = [];

  // ── Step 1: find the first section heading ─────────────────────────────────
  // Everything BEFORE the first heading is treated as the document header
  // (candidate name + contact info). This avoids mis-classifying contact lines
  // as job entries when they contain pipe-separated items like "City | LinkedIn".
  const firstHeadingIdx = raw.findIndex(
    (l) => l.length >= 3 && l.length <= 60 && HEADING_RE.test(l),
  );
  const headerEnd = firstHeadingIdx === -1 ? raw.length : firstHeadingIdx;

  // ── Step 2: emit header block ──────────────────────────────────────────────
  const headerLines = raw.slice(0, headerEnd).filter((l) => l.length > 0);
  if (headerLines.length > 0) {
    result.push({ type: "name", text: headerLines[0] });
    if (headerLines.length > 1) {
      // Combine any additional header lines into a single contact row
      result.push({ type: "contact", text: headerLines.slice(1).join("   ·   ") });
    }
  }

  // ── Step 3: parse from first heading onwards ───────────────────────────────
  let currentSection: string | null = null;

  for (let i = headerEnd; i < raw.length; i++) {
    const trimmed = raw[i];

    if (!trimmed) {
      result.push({ type: "blank" });
      continue;
    }

    // Section heading
    if (trimmed.length >= 3 && trimmed.length <= 60 && HEADING_RE.test(trimmed)) {
      currentSection = trimmed;
      result.push({ type: "heading", text: trimmed });
      continue;
    }

    // Bullet point (applies in all sections)
    const bulletMatch = BULLET_RE.exec(trimmed);
    if (bulletMatch) {
      result.push({ type: "bullet", text: bulletMatch[1] });
      continue;
    }

    // Job/role line — only outside summary-type sections and only when short enough
    const isJobSection = !NON_JOB_SECTIONS.has(currentSection ?? "");
    const jobMatch = isJobSection ? JOB_RE.exec(trimmed) : null;
    if (jobMatch) {
      const company = jobMatch[1].trim();
      const rest = jobMatch[2].trim();
      result.push({ type: "job", company, titleAndDate: rest });
      continue;
    }

    // Everything else → body paragraph
    result.push({ type: "body", text: trimmed });
  }

  return result;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const ACCENT = "1e3a5f";       // dark navy
const ACCENT_MID = "2d5a8e";   // mid navy (for rule)
const RULE_COLOR = "c8d4e0";   // light blue-grey divider
const TEXT_MUTED = "666666";

// ─── DOCX Builder ────────────────────────────────────────────────────────────

export async function buildDocxBuffer(
  cvText: string,
  _jobTitle: string,
  _company: string,
): Promise<Buffer> {
  const lines = parseLines(cvText);
  const children: Paragraph[] = [];

  for (const line of lines) {
    switch (line.type) {
      case "name":
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line.text, bold: true, size: 44, color: ACCENT, font: "Calibri" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
        );
        break;

      case "contact":
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line.text, size: 18, color: TEXT_MUTED, font: "Calibri" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            border: {
              bottom: { color: RULE_COLOR, size: 4, style: BorderStyle.SINGLE, space: 6 },
            },
          }),
        );
        break;

      case "heading":
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line.text, bold: true, size: 24, color: ACCENT, font: "Calibri", allCaps: true })],
            spacing: { before: 320, after: 100 },
            border: {
              bottom: { color: ACCENT_MID, size: 8, style: BorderStyle.SINGLE, space: 4 },
            },
          }),
        );
        break;

      case "job": {
        // Split titleAndDate into title vs date if possible (last pipe-separated part looks like a date)
        const restParts = line.titleAndDate.split(/\s*\|\s*/);
        const boldPart = restParts[0].trim();
        const datePart = restParts.slice(1).join("  ·  ").trim();
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: line.company, bold: true, size: 22, color: "1a1a1a", font: "Calibri" }),
              new TextRun({ text: "   ", size: 22 }),
              new TextRun({ text: boldPart, size: 20, color: TEXT_MUTED, italics: true, font: "Calibri" }),
              ...(datePart ? [new TextRun({ text: `  ·  ${datePart}`, size: 20, color: TEXT_MUTED, italics: true, font: "Calibri" })] : []),
            ],
            spacing: { before: 140, after: 60 },
          }),
        );
        break;
      }

      case "bullet":
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line.text, size: 20, font: "Calibri" })],
            bullet: { level: 0 },
            spacing: { after: 40 },
            indent: { left: 360 },
          }),
        );
        break;

      case "body":
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line.text, size: 20, font: "Calibri" })],
            spacing: { after: 80 },
          }),
        );
        break;

      case "blank":
        children.push(new Paragraph({ spacing: { after: 60 } }));
        break;
    }
  }

  const doc = new Document({
    creator: "ParsePilot AI",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

// ─── Print-optimized HTML Builder ────────────────────────────────────────────

export function buildPrintHtml(
  text: string,
  title: string,
  company: string,
  docType: "cv" | "cover",
): string {
  const lines = parseLines(text);
  const pageTitle =
    docType === "cover" ? `Cover Letter — ${company}` : `CV — ${title} at ${company}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${esc(pageTitle)}</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

    body{
      font-family:'Calibri','Arial',sans-serif;
      font-size:11pt;line-height:1.6;color:#1a1a1a;background:#edf0f4;
    }

    /* Banner */
    .banner{
      background:#1e3a5f;color:#fff;padding:11px 28px;
      display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
    }
    .banner strong{font-size:13px}
    .banner p{font-size:11px;opacity:.7;margin-top:1px}
    .btn{
      background:#2d5a8e;color:#fff;border:none;padding:7px 20px;
      border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;
    }
    .btn:hover{background:#3a72b5}

    /* Page */
    .doc{
      max-width:800px;margin:28px auto 52px;background:#fff;
      padding:48px 58px;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,.12);
    }

    /* Header */
    .cv-name{
      font-size:25pt;font-weight:700;color:#1e3a5f;
      text-align:center;letter-spacing:.02em;margin-bottom:5px;line-height:1.2;
    }
    .cv-contact{
      font-size:9pt;color:#666;text-align:center;
      padding-bottom:12px;margin-bottom:18px;
      border-bottom:1.5px solid #c8d4e0;
    }

    /* Section heading */
    .cv-heading{
      font-size:9.5pt;font-weight:700;color:#1e3a5f;
      letter-spacing:.1em;text-transform:uppercase;
      margin-top:20px;margin-bottom:7px;padding-bottom:4px;
      border-bottom:2px solid #2d5a8e;
    }

    /* Job row */
    .cv-job{
      display:flex;justify-content:space-between;align-items:baseline;
      margin-top:11px;margin-bottom:3px;gap:10px;
    }
    .cv-job-company{font-weight:700;font-size:10.5pt;color:#111}
    .cv-job-meta{font-size:9pt;color:#666;font-style:italic;white-space:nowrap;flex-shrink:0}

    /* Bullets */
    ul.cv-list{margin:4px 0 5px 20px}
    ul.cv-list li{font-size:10pt;margin-bottom:2px;line-height:1.5;list-style-type:disc}

    /* Body paragraph */
    .cv-body{font-size:10pt;margin-bottom:4px;line-height:1.6;color:#1a1a1a}

    /* Cover letter */
    .cover-p{font-size:11pt;line-height:1.75;margin-bottom:.9em}

    /* Print */
    @media print{
      body{background:#fff}
      .banner{display:none!important}
      .doc{margin:0;padding:0;box-shadow:none;border-radius:0;max-width:100%}
      .cv-heading{break-after:avoid}
      .cv-job{break-after:avoid}
    }
    @page{size:A4;margin:16mm 14mm}
  </style>
</head>
<body>
  <div class="banner">
    <div>
      <strong>ParsePilot AI — ${esc(pageTitle)}</strong>
      <p>Ctrl+P (Cmd+P on Mac) → Save as PDF. Set margins to "None" or "Minimum" in print settings.</p>
    </div>
    <button class="btn" onclick="window.print()">⬇ Save as PDF</button>
  </div>

  <div class="doc">
    ${docType === "cover" ? renderCover(lines) : renderCv(lines)}
  </div>

  <script>
    if(!window.location.search.includes('noprint')){
      window.addEventListener('load',()=>setTimeout(()=>window.print(),700));
    }
  </script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCv(lines: LineKind[]): string {
  const out: string[] = [];
  let bulletBuf: string[] = [];

  const flush = () => {
    if (!bulletBuf.length) return;
    out.push(`<ul class="cv-list">${bulletBuf.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`);
    bulletBuf = [];
  };

  for (const line of lines) {
    if (line.type !== "bullet") flush();

    switch (line.type) {
      case "name":
        out.push(`<div class="cv-name">${esc(line.text)}</div>`);
        break;
      case "contact":
        out.push(`<div class="cv-contact">${esc(line.text)}</div>`);
        break;
      case "heading":
        out.push(`<div class="cv-heading">${esc(line.text)}</div>`);
        break;
      case "job":
        out.push(
          `<div class="cv-job">` +
          `<span class="cv-job-company">${esc(line.company)}</span>` +
          `<span class="cv-job-meta">${esc(line.titleAndDate)}</span>` +
          `</div>`,
        );
        break;
      case "bullet":
        bulletBuf.push(line.text);
        break;
      case "body":
        out.push(`<p class="cv-body">${esc(line.text)}</p>`);
        break;
      case "blank":
        break; // spacing handled by CSS margins
    }
  }
  flush();
  return out.join("\n");
}

function renderCover(lines: LineKind[]): string {
  return lines
    .map((line) => {
      if (line.type === "blank") return `<div style="margin-bottom:.5em"></div>`;
      const txt = "text" in line ? line.text : "full" in line ? (line as any).full : "";
      return `<p class="cover-p">${esc(txt)}</p>`;
    })
    .join("\n");
}
