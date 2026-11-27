import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";

const MAX_LIMIT = 100;

function parseGallery(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rowToInvention(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    category: String(row.category ?? "other"),
    status: String(row.status ?? "concept"),
    location: row.location ? String(row.location) : null,
    technical_details: row.technical_details ? String(row.technical_details) : null,
    use_case: row.use_case ? String(row.use_case) : null,
    industrial_application: row.industrial_application ? String(row.industrial_application) : null,
    patent_status: row.patent_status ? String(row.patent_status) : null,
    current_milestone: row.current_milestone ? String(row.current_milestone) : null,
    cover_image_url: row.cover_image_url ? String(row.cover_image_url) : null,
    video_url: row.video_url ? String(row.video_url) : null,
    gallery_urls: parseGallery(row.gallery_urls),
    views: Number(row.views ?? 0),
    created_at: String(row.created_at ?? ""),
    author: {
      display_name: row.author_name ? String(row.author_name) : null,
      username: row.author_username ? String(row.author_username) : null,
    },
  };
}

export default async (req: Request) => {
  try {
    const db = getDb();
    await ensureTables(db);

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const author = url.searchParams.get("author"); // user_id
    const sort = url.searchParams.get("sort") === "views" ? "views" : "created_at";
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "24", 10) || 24, 1), MAX_LIMIT);

    const where: string[] = [];
    const args: (string | number)[] = [];
    if (category && category !== "all") {
      where.push("i.category = ?");
      args.push(category);
    }
    if (author) {
      where.push("i.user_id = ?");
      args.push(author);
    }

    const sql = `
      SELECT i.*, p.display_name AS author_name, p.username AS author_username
      FROM inventions i
      LEFT JOIN profiles p ON p.user_id = i.user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY i.${sort} DESC
      LIMIT ?
    `;
    args.push(limit);

    const result = await db.execute({ sql, args });
    const inventions = result.rows.map(rowToInvention);
    return Response.json({ inventions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
