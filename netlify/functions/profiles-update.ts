import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";
import { getSessionUser } from "./_lib/auth";

const MAX_DATA_URL = 200_000; // ~200KB compressed avatar

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

export default async (req: Request) => {
  if (req.method !== "PUT" && req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const db = getDb();
    await ensureTables(db);

    const user = await getSessionUser(db, req);
    if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

    const displayName = str(body.display_name, 60);
    if (displayName !== null && displayName.length < 2) {
      return Response.json({ error: "Display name must be at least 2 characters" }, { status: 400 });
    }

    const avatar =
      typeof body.avatar_url === "string" &&
      body.avatar_url.startsWith("data:image/") &&
      body.avatar_url.length <= MAX_DATA_URL
        ? body.avatar_url
        : null;

    const existing = await db.execute({
      sql: "SELECT user_id FROM profiles WHERE user_id = ? LIMIT 1",
      args: [user.id],
    });
    if (existing.rows.length === 0) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    await db.execute({
      sql: `UPDATE profiles SET
        display_name = COALESCE(?, display_name),
        bio = ?, location = ?, website = ?, twitter = ?, whatsapp = ?,
        avatar_url = COALESCE(?, avatar_url)
        WHERE user_id = ?`,
      args: [
        displayName,
        str(body.bio, 500),
        str(body.location, 120),
        str(body.website, 200),
        str(body.twitter, 100),
        str(body.whatsapp, 40),
        avatar,
        user.id,
      ],
    });

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
