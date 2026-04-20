export interface AdzunaSearchParams {
  country?: string;
  page?: number;
  what: string;
  where?: string;
  resultsPerPage?: number;
}

export async function fetchAdzunaJobs({
  country = "gb",
  page = 1,
  what,
  where,
  resultsPerPage = 20,
}: AdzunaSearchParams): Promise<any[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("Adzuna API credentials not configured (ADZUNA_APP_ID / ADZUNA_APP_KEY)");
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what,
    results_per_page: String(resultsPerPage),
  });

  if (where) params.set("where", where);

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Adzuna API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data.results ?? []) as any[];
}
