export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface SiteStats {
  inventors: number;
  ideas: number;
  collabs: number;
}
