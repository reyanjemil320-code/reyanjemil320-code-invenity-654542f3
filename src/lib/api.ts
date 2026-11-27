const TOKEN_KEY = "invenity_session";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function fetchAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetchJson<T>(url, { ...options, headers });
}

export interface SiteStats {
  inventors: number;
  ideas: number;
  collabs: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
}

/* ---------- Turso data types ---------- */

export interface Invention {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: string | null;
  technical_details: string | null;
  use_case: string | null;
  industrial_application: string | null;
  patent_status: string | null;
  current_milestone: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  gallery_urls: string[];
  views: number;
  created_at: string;
  author?: { display_name: string | null; username: string | null };
}

export interface InventionDetail {
  invention: Invention;
  author: {
    display_name: string | null;
    username: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    whatsapp: string | null;
  } | null;
  related: Invention[];
}

export interface ProfileData {
  user_id: string;
  username: string | null;
  display_name: string | null;
  company: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface AdminMember {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  invention_count: number;
  isAdmin: boolean;
}

export interface AdminOverview {
  members: AdminMember[];
  inventions: { id: string; user_id: string; title: string; category: string; created_at: string }[];
  totals: { members: number; inventions: number; admins: number };
}

/* ---------- Typed endpoint helpers ---------- */

export async function fetchInventions(params: {
  category?: string;
  author?: string;
  sort?: "created_at" | "views";
  limit?: number;
}): Promise<Invention[]> {
  const qs = new URLSearchParams();
  if (params.category && params.category !== "all") qs.set("category", params.category);
  if (params.author) qs.set("author", params.author);
  if (params.sort) qs.set("sort", params.sort);
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetchJson<{ inventions: Invention[] }>(`/api/inventions-list${qs.size ? `?${qs}` : ""}`);
  return res.inventions;
}

export async function fetchInvention(id: string): Promise<InventionDetail> {
  return fetchJson<InventionDetail>(`/api/inventions-get?id=${encodeURIComponent(id)}`);
}

export async function fetchVotesTally(): Promise<Record<string, number>> {
  const res = await fetchJson<{ tally: Record<string, number> }>("/api/votes-list");
  return res.tally;
}

export async function fetchProfile(): Promise<{ profile: ProfileData | null; counts: { inventions: number; votesCast: number }; email: string }> {
  return fetchAuth("/api/profiles-get");
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  return fetchAuth("/api/admin-overview");
}
