import type { NormalizedJob } from "./normalize.js";

export interface ScoredJob extends NormalizedJob {
  pre_score: number;
}

export function prefilterJobs(candidateProfile: any, jobs: NormalizedJob[]): ScoredJob[] {
  return jobs
    .map((job) => {
      const text =
        `${job.title} ${job.description} ${job.company} ${job.location}`.toLowerCase();

      const roleScore = (candidateProfile.target_roles ?? []).reduce(
        (acc: number, role: string) => acc + (text.includes(role.toLowerCase()) ? 8 : 0),
        0,
      );

      const skillScore = (candidateProfile.core_skills ?? []).reduce(
        (acc: number, skill: string) => acc + (text.includes(skill.toLowerCase()) ? 3 : 0),
        0,
      );

      const toolScore = (candidateProfile.tools ?? []).reduce(
        (acc: number, tool: string) => acc + (text.includes(tool.toLowerCase()) ? 2 : 0),
        0,
      );

      const locationScore =
        (candidateProfile.preferred_locations ?? []).some((loc: string) =>
          text.includes(loc.toLowerCase()),
        )
          ? 6
          : 0;

      const remoteScore =
        candidateProfile.remote_preference === "remote" && job.remote_type === "remote" ? 5 : 0;

      return {
        ...job,
        pre_score: roleScore + skillScore + toolScore + locationScore + remoteScore,
      };
    })
    .sort((a, b) => b.pre_score - a.pre_score);
}
