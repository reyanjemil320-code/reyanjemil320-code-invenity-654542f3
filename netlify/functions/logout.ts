import { getDb } from "./_lib/db";
import { bearerToken, hashToken } from "./_lib/auth";

export default async (req: Request) => {
  try {
    const token = bearerToken(req);
    if (token) {
      const db = getDb();
      await db.execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [hashToken(token)] });
    }
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
