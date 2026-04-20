export interface NormalizedJob {
  source: string;
  external_job_id: string;
  title: string;
  company: string;
  location: string;
  employment_type: string;
  remote_type: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  description: string;
  apply_url: string;
  source_payload: unknown;
}

export function normalizeAdzunaJob(job: any): NormalizedJob {
  const loc: string = job.location?.display_name ?? "";
  const remoteType =
    loc.toLowerCase().includes("remote") ||
    String(job.title ?? "").toLowerCase().includes("remote")
      ? "remote"
      : "";

  return {
    source: "adzuna",
    external_job_id: String(job.id),
    title: job.title ?? "",
    company: job.company?.display_name ?? "",
    location: loc,
    employment_type: job.contract_type ?? "",
    remote_type: remoteType,
    salary_min: job.salary_min != null ? Number(job.salary_min) : null,
    salary_max: job.salary_max != null ? Number(job.salary_max) : null,
    currency: job.salary_currency_code ?? "GBP",
    description: job.description ?? "",
    apply_url: job.redirect_url ?? "",
    source_payload: job,
  };
}

export function normalizeMuseJob(job: any): NormalizedJob {
  const locations: string = Array.isArray(job.locations)
    ? job.locations.map((x: any) => x.name).join(", ")
    : "";
  const remoteType = locations.toLowerCase().includes("remote") ? "remote" : "";

  return {
    source: "themuse",
    external_job_id: String(job.id),
    title: job.name ?? "",
    company: job.company?.name ?? "",
    location: locations,
    employment_type: job.type ?? "",
    remote_type: remoteType,
    salary_min: null,
    salary_max: null,
    currency: "",
    description: job.contents ?? "",
    apply_url: job.refs?.landing_page ?? "",
    source_payload: job,
  };
}
