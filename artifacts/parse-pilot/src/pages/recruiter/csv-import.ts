export interface ParsedCsvCandidate {
  name: string;
  email: string;
  score?: number;
  skills?: string[];
  experience?: string;
  jobTitle?: string;
  company?: string;
  notes?: string;
  _row: number;
  _error?: string;
}

export function parseCsvText(text: string): ParsedCsvCandidate[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, ""));

  const colIndex = (aliases: string[]): number => {
    for (const alias of aliases) {
      const idx = headers.findIndex(h => h.includes(alias));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const nameIdx = colIndex(["name", "full_name", "candidate"]);
  const emailIdx = colIndex(["email", "e_mail", "mail"]);
  const scoreIdx = colIndex(["score", "match", "pct", "percent"]);
  const skillsIdx = colIndex(["skills", "skill", "competencies"]);
  const expIdx = colIndex(["experience", "exp", "background"]);
  const titleIdx = colIndex(["job_title", "title", "position", "role"]);
  const companyIdx = colIndex(["company", "employer", "org", "organisation", "organization"]);
  const notesIdx = colIndex(["notes", "note", "comment"]);

  const results: ParsedCsvCandidate[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV split (handles quoted fields)
    const cols = splitCsvLine(line);

    const get = (idx: number) => idx >= 0 && idx < cols.length ? cols[idx].trim() : "";

    const name = get(nameIdx);
    const email = get(emailIdx);

    if (!name && !email) continue;

    const scoreRaw = get(scoreIdx);
    const score = scoreRaw ? parseFloat(scoreRaw.replace("%", "")) : undefined;
    const skillsRaw = get(skillsIdx);
    const skills = skillsRaw ? skillsRaw.split(/[;|]/).map(s => s.trim()).filter(Boolean) : undefined;

    const candidate: ParsedCsvCandidate = {
      name: name || "Unknown",
      email,
      score: !isNaN(score as number) ? score : undefined,
      skills,
      experience: get(expIdx) || undefined,
      jobTitle: get(titleIdx) || undefined,
      company: get(companyIdx) || undefined,
      notes: get(notesIdx) || undefined,
      _row: i + 1,
    };

    if (!email || !email.includes("@")) {
      candidate._error = "Missing or invalid email";
    }

    results.push(candidate);
  }

  return results;
}

function splitCsvLine(line: string): string[] {
  const cols: string[] = [];
  let inQuote = false;
  let cur = "";

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      cols.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

export const CSV_TEMPLATE = `Name,Email,Score,Skills,Experience,Job Title,Company,Notes
Alex Johnson,alex@example.com,78,React;TypeScript;Node.js,5 years in software development,Senior Developer,Acme Corp,Strong portfolio
Sarah Smith,sarah@example.com,82,Python;SQL;Machine Learning,3 years data science,Data Scientist,Tech Inc,
`;
