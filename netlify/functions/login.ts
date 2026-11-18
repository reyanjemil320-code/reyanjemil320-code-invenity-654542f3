import { getDb } from "./_lib/db";
import { verifyPassword, createSession } from "./_lib/auth";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const db = getDb();
    const found = await db.execute({
      sql: "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
      args: [email],
    });
    const row = found.rows[0] as { id: string; email: string; password_hash: string } | undefined;
    if (!row || !verifyPassword(password, row.password_hash)) {
      return Response.json({ error: "Incorrect email or password. Please try again." }, { status: 401 });
    }

    const roles = await db.execute({
      sql: "SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin' LIMIT 1",
      args: [row.id],
    });
    const profile = await db.execute({
      sql: "SELECT display_name FROM profiles WHERE user_id = ? LIMIT 1",
      args: [row.id],
    });
    const displayName = (profile.rows[0] as { display_name: string | null } | undefined)?.display_name ?? null;

    const { token } = await createSession(db, row.id);
    return Response.json({
      token,
      user: { id: row.id, email: row.email, displayName, isAdmin: roles.rows.length > 0 },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
