// lib/db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your Neon Postgres connection string."
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

// Singleton with lazy init
let _db: ReturnType<typeof getDb> | null = null;

export function getDatabase() {
  if (!_db) _db = getDb();
  return _db;
}

// Convenience export — call getDatabase() in server code instead
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getDatabase() as unknown as Record<string | symbol, any>)[prop];
  },
});
