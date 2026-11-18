import { getDb } from "./_lib/db";
import { getSessionUser } from "./_lib/auth";

export default async (req: Request) => {
  try {
    const db = getDb();
    const user = await getSessionUser(db, req);
    if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
    return Response.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
