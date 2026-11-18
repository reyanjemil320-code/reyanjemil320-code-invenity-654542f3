import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    if (!url || !token) {
      throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars");
    }
    client = createClient({ url, authToken: token });
  }
  return client;
}
