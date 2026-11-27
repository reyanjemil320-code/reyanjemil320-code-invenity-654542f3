import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";
import { getSessionUser } from "./_lib/auth";

export default async (req: Request) => {
  try {
    const db = getDb();
    await ensureTables(db);

    const user = await getSessionUser(db, req);
    if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
    if (!user.isAdmin) return Response.json({ error: "Admins only" }, { status: 403 });

    const [profilesRes, rolesRes, inventionsRes] = await Promise.all([
      db.execute(`
        SELECT p.user_id, p.username, p.display_name, p.avatar_url,
               u.email, u.created_at,
               (SELECT COUNT(*) FROM inventions i WHERE i.user_id = p.user_id) AS invention_count
        FROM profiles p
        LEFT JOIN users u ON u.id = p.user_id
        ORDER BY u.created_at DESC
        LIMIT 500
      `),
      db.execute("SELECT user_id FROM user_roles WHERE role = 'admin'"),
      db.execute(`
        SELECT id, user_id, title, category, created_at
        FROM inventions ORDER BY created_at DESC LIMIT 200
      `),
    ]);

    const adminIds = new Set(rolesRes.rows.map((r) => String(r.user_id)));
    const members = profilesRes.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        user_id: String(row.user_id),
        username: row.username ? String(row.username) : null,
        display_name: row.display_name ? String(row.display_name) : null,
        avatar_url: row.avatar_url ? String(row.avatar_url) : null,
        email: row.email ? String(row.email) : null,
        created_at: String(row.created_at ?? ""),
        invention_count: Number(row.invention_count ?? 0),
        isAdmin: adminIds.has(String(row.user_id)),
      };
    });

    const inventions = inventionsRes.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        user_id: String(row.user_id),
        title: String(row.title ?? ""),
        category: String(row.category ?? "other"),
        created_at: String(row.created_at ?? ""),
      };
    });

    return Response.json({
      members,
      inventions,
      totals: {
        members: members.length,
        inventions: inventions.length,
        admins: adminIds.size,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
