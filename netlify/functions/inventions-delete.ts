import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";
import { getSessionUser } from "./_lib/auth";

export default async (req: Request) => {
  if (req.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const db = getDb();
    await ensureTables(db);

    const user = await getSessionUser(db, req);
    if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "Missing invention id" }, { status: 400 });

    const found = await db.execute({
      sql: "SELECT user_id FROM inventions WHERE id = ? LIMIT 1",
      args: [id],
    });
    const row = found.rows[0] as { user_id: string } | undefined;
    if (!row) return Response.json({ error: "Invention not found" }, { status: 404 });

    if (row.user_id !== user.id && !user.isAdmin) {
      return Response.json({ error: "Only the inventor or an admin can delete this" }, { status: 403 });
    }

    await db.execute({ sql: "DELETE FROM inventions WHERE id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM votes WHERE invention_id = ? OR opponent_id = ?", args: [id, id] });

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
