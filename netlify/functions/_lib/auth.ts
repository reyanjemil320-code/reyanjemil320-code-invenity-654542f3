import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import type { Client } from "@libsql/client/web";

const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s1:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [, salt, hash] = parts;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function createSession(db: Client, userId: string): Promise<{ token: string }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.execute({
    sql: "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    args: [userId, hashToken(token), expiresAt],
  });
  return { token };
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
}

export async function getSessionUser(db: Client, req: Request): Promise<SessionUser | null> {
  const token = bearerToken(req);
  if (!token) return null;
  const result = await db.execute({
    sql: `SELECT u.id, u.email, p.display_name
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          LEFT JOIN profiles p ON p.user_id = u.id
          WHERE s.token_hash = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')
          LIMIT 1`,
    args: [hashToken(token)],
  });
  const row = result.rows[0] as { id: string; email: string; display_name: string | null } | undefined;
  if (!row) return null;
  const roles = await db.execute({
    sql: "SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin' LIMIT 1",
    args: [row.id],
  });
  return { id: row.id, email: row.email, displayName: row.display_name, isAdmin: roles.rows.length > 0 };
}
