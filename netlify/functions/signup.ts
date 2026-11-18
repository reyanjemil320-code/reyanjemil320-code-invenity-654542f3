import { getDb } from "./_lib/db";
import { hashPassword, createSession } from "./_lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const displayName = String(body.displayName ?? "").trim();
    const companyName = String(body.companyName ?? "").trim();

    if (!EMAIL_RE.test(email) || email.length > 255) {
      return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return Response.json({ error: "Password must be at least 8 characters with letters and numbers" }, { status: 400 });
    }
    if (displayName.length < 2 || displayName.length > 60) {
      return Response.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }

    const db = getDb();

    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
      args: [email],
    });
    if (existing.rows.length > 0) {
      return Response.json({ error: "This email is already registered. Try signing in instead." }, { status: 409 });
    }

    const inserted = await db.execute({
      sql: "INSERT INTO users (email, password_hash, email_verified) VALUES (?, ?, 1) RETURNING id",
      args: [email, hashPassword(password)],
    });
    const userId = String((inserted.rows[0] as { id: string }).id);

    const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, "") || "inventor";
    let username = base;
    for (let i = 0; i < 5; i++) {
      const taken = await db.execute({
        sql: "SELECT id FROM profiles WHERE username = ? LIMIT 1",
        args: [username],
      });
      if (taken.rows.length === 0) break;
      username = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    await db.execute({
      sql: "INSERT INTO profiles (id, user_id, username, display_name, company) VALUES (?, ?, ?, ?, ?)",
      args: [userId, userId, username, displayName, companyName || null],
    });

    const { token } = await createSession(db, userId);

    return Response.json({
      token,
      user: { id: userId, email, displayName, isAdmin: false },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
