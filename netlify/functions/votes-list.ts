import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";

export default async () => {
  try {
    const db = getDb();
    await ensureTables(db);
    const result = await db.execute("SELECT invention_id, opponent_id, COUNT(*) AS votes FROM votes GROUP BY invention_id, opponent_id");
    const tally: Record<string, number> = {};
    for (const row of result.rows) {
      tally[String(row.invention_id)] = (tally[String(row.invention_id)] ?? 0) + Number(row.votes ?? 0);
    }
    return Response.json({ tally });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
