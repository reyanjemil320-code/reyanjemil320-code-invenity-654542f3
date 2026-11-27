import { randomUUID } from "crypto";
import { getDb } from "./_lib/db";
import { ensureTables } from "./_lib/tables";
import { getSessionUser } from "./_lib/auth";

const CATEGORIES = new Set([
  "clean_energy", "biotech", "infrastructure", "consumer_goods",
  "agriculture", "health_tech", "ai_software", "transportation", "other",
]);
const STATUSES = new Set(["patent_pending", "available", "prototype_ready", "licensed", "concept"]);

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function dataUrlOk(v: unknown, maxBytes: number): boolean {
  return typeof v === "string" && v.startsWith("data:image/") && v.length <= maxBytes;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const db = getDb();
    await ensureTables(db);

    const user = await getSessionUser(db, req);
    if (!user) return Response.json({ error: "Sign in to post an invention" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

    const title = str(body.title);
    const description = str(body.description);
    const category = str(body.category);
    const status = str(body.status);

    if (title.length < 5 || title.length > 120) {
      return Response.json({ error: "Title must be 5-120 characters" }, { status: 400 });
    }
    if (description.length < 30 || description.length > 3000) {
      return Response.json({ error: "Description must be 30-3000 characters" }, { status: 400 });
    }
    if (!CATEGORIES.has(category)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!STATUSES.has(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    // Images arrive as compressed data URLs (client-side compression in media.ts)
    const MAX_DATA_URL = 200_000; // ~200KB per image
    const cover = dataUrlOk(body.cover_image_url, MAX_DATA_URL) ? String(body.cover_image_url) : null;
    const gallery = Array.isArray(body.gallery_urls)
      ? (body.gallery_urls as unknown[]).filter((u) => dataUrlOk(u, MAX_DATA_URL)).map(String).slice(0, 6)
      : [];
    const videoUrl = typeof body.video_url === "string" && /^https:\/\//.test(body.video_url) ? body.video_url : null;

    const id = randomUUID();
    await db.execute({
      sql: `INSERT INTO inventions
        (id, user_id, title, description, category, status, location, technical_details, use_case,
         industrial_application, patent_status, current_milestone, cover_image_url, video_url, gallery_urls)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        user.id,
        title,
        description,
        category,
        status,
        str(body.location).slice(0, 120) || null,
        str(body.technical_details).slice(0, 3000) || null,
        str(body.use_case).slice(0, 200) || null,
        str(body.industrial_application).slice(0, 200) || null,
        str(body.patent_status).slice(0, 120) || null,
        str(body.current_milestone).slice(0, 200) || null,
        cover,
        videoUrl,
        gallery.length ? JSON.stringify(gallery) : null,
      ],
    });

    return Response.json({ id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
