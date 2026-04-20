import type { ParsedCv } from "@workspace/db";

interface BuildInterviewPrepPromptOpts {
  parsedCvJson: ParsedCv | null;
  tailoredCvText: string | null;
  coverLetterText: string | null;
  jobInfo: string;
  applicationNotes: string | null;
  companyName: string | null;
  roleTitle: string | null;
}

export function buildInterviewPrepPrompt(opts: BuildInterviewPrepPromptOpts): string {
  const {
    parsedCvJson,
    tailoredCvText,
    coverLetterText,
    jobInfo,
    applicationNotes,
    companyName,
    roleTitle,
  } = opts;

  const cvSection = parsedCvJson
    ? `
CANDIDATE PROFILE (from parsed CV):
Name: ${parsedCvJson.name ?? "Not provided"}
Location: ${parsedCvJson.location ?? "Not provided"}
Summary: ${parsedCvJson.summary ?? "None"}
Total Experience: ${parsedCvJson.total_years_experience ?? "Unknown"} years
Skills: ${parsedCvJson.skills.join(", ")}
Tools: ${(parsedCvJson.tools ?? []).join(", ")}
Languages: ${parsedCvJson.languages.join(", ")}
Certifications: ${parsedCvJson.certifications.join(", ")}

Work Experience:
${parsedCvJson.work_experience.map((w) => `- ${w.title} @ ${w.company} (${w.start_date} – ${w.end_date ?? "Present"})\n${w.bullets.map((b) => `    • ${b}`).join("\n")}`).join("\n\n")}

Education:
${parsedCvJson.education.map((e) => `- ${e.degree}${e.field ? ` in ${e.field}` : ""} @ ${e.institution} (${e.start_date ?? ""} – ${e.end_date ?? ""})`).join("\n")}
`.trim()
    : "CANDIDATE PROFILE: Not available";

  const tailoredSection = tailoredCvText
    ? `\nTAILORED CV FOR THIS ROLE:\n${tailoredCvText.slice(0, 3000)}`
    : "";

  const coverLetterSection = coverLetterText
    ? `\nCOVER LETTER:\n${coverLetterText.slice(0, 1500)}`
    : "";

  const notesSection = applicationNotes?.trim()
    ? `\nAPPLICATION NOTES FROM CANDIDATE:\n${applicationNotes}`
    : "";

  return `You are an expert interview coach helping a candidate prepare for a job interview.

${cvSection}
${tailoredSection}
${coverLetterSection}
${notesSection}

JOB BEING APPLIED TO:
${jobInfo.slice(0, 4000)}

YOUR TASK:
Generate a comprehensive, grounded interview preparation pack for this specific candidate and this specific role.

RULES:
- Base all answers strictly on the candidate's actual experience shown in their CV
- Do not invent achievements, titles, or skills not present in the CV
- Likely questions must reflect the real requirements of this job
- Answer strategies must be practical and reference actual candidate experience where relevant
- The 30-second pitch should be a confident, concise self-intro for this specific role
- The 90-second pitch is a fuller narrative with career arc relevant to this role
- questions_to_ask_them should be thoughtful questions the candidate could ask the interviewer
- risks_to_address are real gaps between the candidate profile and the job requirements — be honest

Respond with ONLY valid JSON matching this exact schema:
{
  "prep_summary": "2-3 sentence overview of the candidate's fit and key prep focus areas",
  "likely_questions": [
    {
      "question": "Tell me about a time you led a cross-functional project",
      "why_it_matters": "This role requires strong cross-functional coordination",
      "answer_strategy": "Reference the [project X] from [company Y] — highlight stakeholder management and outcomes",
      "answer_type": "behavioral"
    }
  ],
  "company_focus_areas": ["string"],
  "role_focus_areas": ["string"],
  "strengths_to_emphasize": ["string"],
  "risks_to_address": ["string"],
  "questions_to_ask_them": ["string"],
  "30_second_pitch": "I am a [role] with X years of experience in [domain]...",
  "90_second_pitch": "My career has been focused on..."
}

Generate 8-12 likely_questions. Use these answer_type values: behavioral, technical, role_fit, motivation, culture, leadership, experience, general.
Return ONLY the JSON object. No markdown, no explanation.`.trim();
}
