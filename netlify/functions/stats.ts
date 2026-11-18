import { getDb } from "./_lib/db";

async function countRows(db: ReturnType<typeof getDb>, table: string): Promise<number> {
  const result = await db.execute(`SELECT COUNT(*) AS c FROM ${table}`);
  const row = result.rows[0] as { c: number | string } | undefined;
  return Number(row?.c ?? 0);
}

export default async () => {
  try {
    const db = getDb();
    const [inventors, ideas, collabs] = await Promise.all([
      countRows(db, "profiles"),
      countRows(db, "inventions"),
      countRows(db, "follows"),
    ]);
    return Response.json({ inventors, ideas, collabs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
