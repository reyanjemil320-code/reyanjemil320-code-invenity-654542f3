import { randomUUID } from "crypto";
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
    if (!user) return Response.json({ error: "Sign in to vote" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const winner = typeof body?.invention_id === "string" ? body.invention_id : "";
    const loser = typeof body?.opponent_id === "string" ? body.opponent_id : "";
    if (!winner || !loser || winner === loser) {
      return Response.json({ error: "Invalid matchup" }, { status: 400 });
    }

    const both = await Promise.all([
      db.execute({ sql: "SELECT id FROM inventions WHERE id = ? LIMIT 1", args: [winner] }),
      db.execute({ sql: "SELECT id FROM inventions WHERE id = ? LIMIT 1", args: [loser] }),
    ]);
    if (both.some((r) => r.rows.length === 0)) {
      return Response.json({ error: "Invention not found" }, { status: 404 });
    }

    const duplicate = await db.execute({
      sql: `SELECT id FROM votes WHERE user_id = ?
            AND ((invention_id = ? AND opponent_id = ?) OR (invention_id = ? AND opponent_id = ?))
            LIMIT 1`,
      args: [user.id, winner, loser, loser, winner],
    });
    if (duplicate.rows.length > 0) {
      return Response.json({ error: "You already voted on this matchup" }, { status: 409 });
    }

    await db.execute({
      sql: "INSERT INTO votes (id, user_id, invention_id, opponent_id) VALUES (?, ?, ?, ?)",
      args: [randomUUID(), user.id, winner, loser],
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
