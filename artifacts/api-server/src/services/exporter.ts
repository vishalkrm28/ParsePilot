import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  AlignmentType,
  BorderStyle,
  TabStopType,
} from "docx";

// ─── Types ────────────────────────────────────────────────────────────────────

type LineKind =
  | { type: "name"; text: string }
  | { type: "title"; text: string }
  | { type: "contact"; text: string }
  | { type: "heading"; text: string; compact: boolean }   // compact = render children inline
  | { type: "bullet"; text: string; compact: boolean }    // compact = part of skills/certs list
  | { type: "job"; company: string; jobTitle: string; dates: string }
  | { type: "body"; text: string }
  | { type: "blank" };

// ─── Patterns ─────────────────────────────────────────────────────────────────

const HEADING_RE = /^[A-Z][A-Z\s&\/\-]{2,}$/;
const BULLET_RE  = /^[•\-\*]\s+(.+)$/;
const JOB_RE     = /^([A-Z0-9].{0,70}?)\s*\|\s*(.{2,})$/;
const CONTACT_RE = /@|linkedin\.com|github\.com|\+\d{2}|\b\d{10}\b|http/i;

// Sections where bullets should be rendered as comma-separated inline tags
const COMPACT_SECTIONS = new Set([
  "SKILLS", "TECHNICAL SKILLS", "KEY SKILLS", "CORE SKILLS",
  "CORE COMPETENCIES", "COMPETENCIES", "AREAS OF EXPERTISE",
  "CERTIFICATIONS", "LICENCES", "LICENSES", "CERTIFICATES",
  "LANGUAGES", "INTERESTS", "AWARDS",
]);

// Sections where job-line detection is suppressed
const NON_JOB_SECTIONS = new Set([
  "PROFESSIONAL SUMMARY", "SUMMARY", "PROFILE",
  "OBJECTIVE", "CAREER OBJECTIVE", "ABOUT",
]);

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseLines(text: string): LineKind[] {
  const raw = text.split("\n").map((l) => l.trim());
  const result: LineKind[] = [];

  // Find first ALL-CAPS section heading (skip line 0 = always the name)
  let firstHeadingIdx = -1;
  for (let i = 1; i < raw.length; i++) {
    const l = raw[i];
    if (l.length >= 4 && l.length <= 60 && HEADING_RE.test(l)) {
      firstHeadingIdx = i;
      break;
    }
  }
  const headerEnd = firstHeadingIdx === -1 ? raw.length : firstHeadingIdx;

  // Header block: name, optional subtitle, contact
  const headerLines = raw.slice(0, headerEnd).filter((l) => l.length > 0);
  if (headerLines.length > 0) result.push({ type: "name", text: headerLines[0] });
  if (headerLines.length > 1) {
    const line1 = headerLines[1];
    if (CONTACT_RE.test(line1)) {
      result.push({ type: "contact", text: headerLines.slice(1).join("   ·   ") });
    } else {
      result.push({ type: "title", text: line1 });
      if (headerLines.length > 2)
        result.push({ type: "contact", text: headerLines.slice(2).join("   ·   ") });
    }
  }

  // Body: from first heading onwards
  let currentSection = "";
  let isCompact = false;
  let isJobSection = true;

  for (let i = headerEnd; i < raw.length; i++) {
    const trimmed = raw[i];

    if (!trimmed) {
      result.push({ type: "blank" });
      continue;
    }

    // Section heading
    if (trimmed.length >= 4 && trimmed.length <= 60 && HEADING_RE.test(trimmed)) {
      currentSection = trimmed;
      isCompact    = COMPACT_SECTIONS.has(trimmed);
      isJobSection = !NON_JOB_SECTIONS.has(trimmed);
      result.push({ type: "heading", text: trimmed, compact: isCompact });
      continue;
    }

    // Bullet
    const bm = BULLET_RE.exec(trimmed);
    if (bm) {
      result.push({ type: "bullet", text: bm[1], compact: isCompact });
      continue;
    }

    // Job line (only outside summary-type sections)
    if (isJobSection && trimmed.length <= 150) {
      const jm = JOB_RE.exec(trimmed);
      if (jm) {
        const parts = jm[2].split(/\s*\|\s*/);
        result.push({
          type: "job",
          company: jm[1].trim(),
          jobTitle: parts[0].trim(),
          dates: parts.slice(1).join(" – ").trim(),
        });
        continue;
      }
    }

    result.push({ type: "body", text: trimmed });
  }

  return result;
}

// ─── Style tokens ─────────────────────────────────────────────────────────────

const NAVY     = "1e3a5f";
const NAVY_MID = "2d5a8e";
const RULE     = "c8d4e0";
const MUTED    = "666666";

// ─── DOCX Builder ─────────────────────────────────────────────────────────────

export async function buildDocxBuffer(
  cvText: string,
  _jobTitle: string,
  _company: string,
): Promise<Buffer> {
  const lines = parseLines(cvText);
  const children: Paragraph[] = [];

  // Collect consecutive compact bullets then flush as a single paragraph
  let compactBuf: string[] = [];
  let regularBuf: string[] = [];

  const flushCompact = () => {
    if (!compactBuf.length) return;
    children.push(new Paragraph({
      children: [new TextRun({
        text: compactBuf.join("  ·  "),
        size: 20, font: "Calibri", color: "222222",
      })],
      spacing: { after: 60 },
    }));
    compactBuf = [];
  };

  const flushRegular = () => {
    if (!regularBuf.length) return;
    for (const b of regularBuf) {
      children.push(new Paragraph({
        children: [new TextRun({ text: b, size: 20, font: "Calibri" })],
        bullet: { level: 0 },
        spacing: { after: 30 },
        indent: { left: 360, hanging: 180 },
      }));
    }
    regularBuf = [];
  };

  for (const line of lines) {
    if (line.type !== "bullet") { flushCompact(); flushRegular(); }

    switch (line.type) {
      case "name":
        children.push(new Paragraph({
          children: [new TextRun({ text: line.text, bold: true, size: 52, color: NAVY, font: "Calibri" })],
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
        }));
        break;

      case "title":
        children.push(new Paragraph({
          children: [new TextRun({ text: line.text, size: 26, color: NAVY_MID, font: "Calibri", italics: true })],
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
        }));
        break;

      case "contact":
        children.push(new Paragraph({
          children: [new TextRun({ text: line.text, size: 18, color: MUTED, font: "Calibri" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: { bottom: { color: RULE, size: 4, style: BorderStyle.SINGLE, space: 8 } },
        }));
        break;

      case "heading":
        children.push(new Paragraph({
          children: [new TextRun({ text: line.text, bold: true, size: 22, color: NAVY, font: "Calibri", allCaps: true })],
          spacing: { before: 260, after: 80 },
          border: { bottom: { color: NAVY_MID, size: 8, style: BorderStyle.SINGLE, space: 4 } },
        }));
        break;

      case "job":
        children.push(new Paragraph({
          children: [
            new TextRun({ text: line.company, bold: true, size: 22, color: "111111", font: "Calibri" }),
            new TextRun({ text: "\t", size: 22 }),
            new TextRun({ text: line.dates, size: 20, color: MUTED, italics: true, font: "Calibri" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
          spacing: { before: 120, after: 20 },
        }));
        if (line.jobTitle) {
          children.push(new Paragraph({
            children: [new TextRun({ text: line.jobTitle, size: 20, color: NAVY_MID, font: "Calibri", italics: true })],
            spacing: { after: 50 },
          }));
        }
        break;

      case "bullet":
        if (line.compact) compactBuf.push(line.text);
        else regularBuf.push(line.text);
        break;

      case "body":
        children.push(new Paragraph({
          children: [new TextRun({ text: line.text, size: 20, font: "Calibri" })],
          spacing: { after: 60 },
        }));
        break;

      case "blank":
        children.push(new Paragraph({ spacing: { after: 30 } }));
        break;
    }
  }
  flushCompact();
  flushRegular();

  const doc = new Document({
    creator: "ParsePilot AI",
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } },
      children,
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

// ─── HTML / PDF Builder ───────────────────────────────────────────────────────

export function buildPrintHtml(
  text: string,
  jobTitleParam: string,
  companyParam: string,
  docType: "cv" | "cover",
): string {
  const lines = parseLines(text);
  const pageTitle =
    docType === "cover"
      ? `Cover Letter — ${companyParam}`
      : `CV — ${jobTitleParam} at ${companyParam}`;

  const body = docType === "cover" ? renderCover(lines) : renderCv(lines);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(pageTitle)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

body{font-family:'Calibri','Arial',sans-serif;font-size:11pt;line-height:1.55;
     color:#1a1a1a;background:#e8ecf0}

/* Banner */
.banner{background:#1e3a5f;color:#fff;padding:10px 28px;
        display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.banner strong{font-size:13px}
.banner p{font-size:11px;opacity:.65;margin-top:1px}
.btn{background:#2d5a8e;color:#fff;border:none;padding:7px 20px;
     border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.btn:hover{background:#3a72b5}

/* Page */
.doc{max-width:800px;margin:24px auto 52px;background:#fff;
     padding:44px 56px 50px;border-radius:4px;box-shadow:0 4px 28px rgba(0,0,0,.13)}

/* Header */
.cv-name{font-size:26pt;font-weight:700;color:#1e3a5f;
         text-align:center;letter-spacing:.015em;line-height:1.15;margin-bottom:3px}
.cv-sub-title{font-size:11.5pt;color:#2d5a8e;text-align:center;
              font-style:italic;margin-bottom:5px}
.cv-contact{font-size:8.5pt;color:#666;text-align:center;
            padding-bottom:11px;margin-bottom:16px;
            border-bottom:1.5px solid #c8d4e0}

/* Section heading */
.cv-section{margin-top:16px;margin-bottom:6px;padding-bottom:3px;
            border-bottom:2px solid #2d5a8e}
.cv-section span{font-size:9pt;font-weight:700;color:#1e3a5f;
                 letter-spacing:.12em;text-transform:uppercase}

/* Job entry */
.cv-job-header{display:flex;justify-content:space-between;
               align-items:baseline;margin-top:10px;margin-bottom:1px;gap:12px}
.cv-company{font-weight:700;font-size:10pt;color:#111}
.cv-dates{font-size:8.5pt;color:#666;white-space:nowrap;font-style:italic;flex-shrink:0}
.cv-role{font-size:9.5pt;color:#2d5a8e;font-style:italic;margin-bottom:4px}

/* Regular bullets */
.cv-bullets{margin:3px 0 4px 18px}
.cv-bullets li{font-size:9.5pt;margin-bottom:2px;line-height:1.45;list-style-type:disc}

/* Compact inline skills/certs */
.cv-tags{font-size:9.5pt;color:#222;line-height:1.6;margin-bottom:2px}
.cv-tag-sep{color:#999;margin:0 3px}

/* Body paragraph (summary etc.) */
.cv-body{font-size:9.5pt;margin-bottom:4px;line-height:1.6;color:#1a1a1a}

/* Cover */
.cover-p{font-size:11pt;line-height:1.75;margin-bottom:.9em}

/* Print */
@media print{
  body{background:#fff}
  .banner{display:none!important}
  .doc{margin:0;padding:0;box-shadow:none;border-radius:0;max-width:100%}
  .cv-section{break-after:avoid}
  .cv-job-header{break-after:avoid}
}
@page{size:A4;margin:14mm 13mm}
</style>
</head>
<body>
<div class="banner">
  <div>
    <strong>ParsePilot AI — ${esc(pageTitle)}</strong>
    <p>Ctrl+P (Cmd+P on Mac) → Save as PDF · Set margins to "None" or "Minimum"</p>
  </div>
  <button class="btn" onclick="window.print()">⬇ Save as PDF</button>
</div>
<div class="doc">${body}</div>
<script>
if(!window.location.search.includes('noprint')){
  window.addEventListener('load',()=>setTimeout(()=>window.print(),700));
}
</script>
</body>
</html>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCv(lines: LineKind[]): string {
  const out: string[] = [];
  let regularBullets: string[] = [];
  let compactBullets: string[] = [];

  const flushBullets = () => {
    if (regularBullets.length) {
      out.push(
        `<ul class="cv-bullets">${regularBullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`,
      );
      regularBullets = [];
    }
    if (compactBullets.length) {
      // Render as inline dot-separated tags on one or two wrapped lines
      const inner = compactBullets
        .map((b, i) =>
          i < compactBullets.length - 1
            ? `${esc(b)}<span class="cv-tag-sep">·</span>`
            : esc(b),
        )
        .join(" ");
      out.push(`<p class="cv-tags">${inner}</p>`);
      compactBullets = [];
    }
  };

  for (const line of lines) {
    if (line.type !== "bullet") flushBullets();

    switch (line.type) {
      case "name":
        out.push(`<div class="cv-name">${esc(line.text)}</div>`);
        break;
      case "title":
        out.push(`<div class="cv-sub-title">${esc(line.text)}</div>`);
        break;
      case "contact":
        out.push(`<div class="cv-contact">${esc(line.text)}</div>`);
        break;
      case "heading":
        out.push(`<div class="cv-section"><span>${esc(line.text)}</span></div>`);
        break;
      case "job":
        out.push(
          `<div class="cv-job-header">` +
          `<span class="cv-company">${esc(line.company)}</span>` +
          `<span class="cv-dates">${esc(line.dates)}</span>` +
          `</div>` +
          (line.jobTitle ? `<div class="cv-role">${esc(line.jobTitle)}</div>` : ""),
        );
        break;
      case "bullet":
        if (line.compact) compactBullets.push(line.text);
        else regularBullets.push(line.text);
        break;
      case "body":
        out.push(`<p class="cv-body">${esc(line.text)}</p>`);
        break;
      case "blank":
        break;
    }
  }

  flushBullets();
  return out.join("\n");
}

function renderCover(lines: LineKind[]): string {
  return lines.map((line) => {
    if (line.type === "blank") return `<div style="margin-bottom:.5em"></div>`;
    const txt = "text" in line ? (line as any).text : ("company" in line ? `${(line as any).company} | ${(line as any).jobTitle}` : "");
    return `<p class="cover-p">${esc(txt)}</p>`;
  }).join("\n");
}
