import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";
import { getSessionUser } from "./_lib/auth";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const db = getDb();
    await ensureTables(db);

    const user = await getSessionUser(db, req);
    if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
    if (!user.isAdmin) return Response.json({ error: "Admins only" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const targetId = typeof body?.user_id === "string" ? body.user_id : "";
    const makeAdmin = body?.make_admin !== false; // default: promote
    if (!targetId) return Response.json({ error: "Missing user_id" }, { status: 400 });

    if (makeAdmin) {
      const existing = await db.execute({
        sql: "SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin' LIMIT 1",
        args: [targetId],
      });
      if (existing.rows.length === 0) {
        await db.execute({
          sql: "INSERT INTO user_roles (user_id, role) VALUES (?, 'admin')",
          args: [targetId],
        });
      }
    } else {
      if (targetId === user.id) {
        return Response.json({ error: "You cannot remove your own admin access" }, { status: 400 });
      }
      await db.execute({
        sql: "DELETE FROM user_roles WHERE user_id = ? AND role = 'admin'",
        args: [targetId],
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
