import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";
import { getSessionUser } from "./_lib/auth";

export default async (req: Request) => {
  try {
    const db = getDb();
    await ensureTables(db);

    const user = await getSessionUser(db, req);
    if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

    const [profileRes, invCount, postTotal] = await Promise.all([
      db.execute({
        sql: `SELECT user_id, username, display_name, company, bio, location, website,
              twitter, whatsapp, avatar_url, created_at
              FROM profiles WHERE user_id = ? LIMIT 1`,
        args: [user.id],
      }),
      db.execute({ sql: "SELECT COUNT(*) AS c FROM inventions WHERE user_id = ?", args: [user.id] }),
      db.execute({ sql: "SELECT COUNT(*) AS c FROM votes WHERE user_id = ?", args: [user.id] }),
    ]);

    const row = profileRes.rows[0] as Record<string, unknown> | undefined;
    const profile = row
      ? {
          user_id: String(row.user_id),
          username: row.username ? String(row.username) : null,
          display_name: row.display_name ? String(row.display_name) : null,
          company: row.company ? String(row.company) : null,
          bio: row.bio ? String(row.bio) : null,
          location: row.location ? String(row.location) : null,
          website: row.website ? String(row.website) : null,
          twitter: row.twitter ? String(row.twitter) : null,
          whatsapp: row.whatsapp ? String(row.whatsapp) : null,
          avatar_url: row.avatar_url ? String(row.avatar_url) : null,
          created_at: String(row.created_at ?? ""),
        }
      : null;

    const counts = {
      inventions: Number((invCount.rows[0] as { c: number | string } | undefined)?.c ?? 0),
      votesCast: Number((postTotal.rows[0] as { c: number | string } | undefined)?.c ?? 0),
    };

    return Response.json({ profile, counts, email: user.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
