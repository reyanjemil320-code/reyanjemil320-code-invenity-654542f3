import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";

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
  };
}

export default async (req: Request) => {
  try {
    const db = getDb();
    await ensureTables(db);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "Missing invention id" }, { status: 400 });

    const result = await db.execute({
      sql: "SELECT * FROM inventions WHERE id = ? LIMIT 1",
      args: [id],
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return Response.json({ error: "Invention not found" }, { status: 404 });

    // Fire-and-forget view counter (best effort)
    void db.execute({ sql: "UPDATE inventions SET views = views + 1 WHERE id = ?", args: [id] });

    const [authorRes, relatedRes] = await Promise.all([
      db.execute({
        sql: `SELECT display_name, username, bio, location, avatar_url, whatsapp
              FROM profiles WHERE user_id = ? LIMIT 1`,
        args: [String(row.user_id)],
      }),
      db.execute({
        sql: `SELECT * FROM inventions WHERE category = ? AND id != ?
              ORDER BY created_at DESC LIMIT 3`,
        args: [String(row.category ?? "other"), id],
      }),
    ]);

    const authorRow = authorRes.rows[0] as Record<string, unknown> | undefined;
    const author = authorRow
      ? {
          display_name: authorRow.display_name ? String(authorRow.display_name) : null,
          username: authorRow.username ? String(authorRow.username) : null,
          bio: authorRow.bio ? String(authorRow.bio) : null,
          location: authorRow.location ? String(authorRow.location) : null,
          avatar_url: authorRow.avatar_url ? String(authorRow.avatar_url) : null,
          whatsapp: authorRow.whatsapp ? String(authorRow.whatsapp) : null,
        }
      : null;

    const related = relatedRes.rows.map(rowToInvention);

    return Response.json({
      invention: { ...rowToInvention(row), views: Number(row.views ?? 0) + 1 },
      author,
      related,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
