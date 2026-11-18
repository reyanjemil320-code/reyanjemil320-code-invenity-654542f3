import { getDb } from "./_lib/db";

export default async () => {
  try {
    const db = getDb();
    await db.execute("SELECT 1");
    return Response.json({ ok: true, db: "connected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
};
