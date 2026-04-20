export interface MuseSearchParams {
  page?: number;
  category?: string;
  location?: string;
  level?: string;
}

export async function fetchMuseJobs({
  page = 1,
  category,
  location,
  level,
}: MuseSearchParams): Promise<any[]> {
  const apiKey = process.env.THE_MUSE_API_KEY;

  const params = new URLSearchParams({ page: String(page) });
  if (apiKey) params.set("api_key", apiKey);
  if (category) params.set("category", category);
  if (location) params.set("location", location);
  if (level) params.set("level", level);

  const url = `https://www.themuse.com/api/public/jobs?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`The Muse API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data.results ?? []) as any[];
}
