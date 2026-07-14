// scripts/migrate.mjs
// Run with: node scripts/migrate.mjs
import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS "cv_submissions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "google_id"  TEXT UNIQUE NOT NULL,
  "name"       TEXT NOT NULL,
  "email"      TEXT UNIQUE NOT NULL,
  "avatar"     TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "cv_submissions" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "full_name"   TEXT NOT NULL,
  "student_id"  TEXT NOT NULL,
  "phone"       TEXT NOT NULL,
  "position"    TEXT NOT NULL,
  "semester"    INTEGER NOT NULL,
  "blob_url"    TEXT NOT NULL,
  "filename"    TEXT NOT NULL,
  "uploaded_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
`;

async function main() {
  console.log("Connecting to Neon...");
  await client.connect();
  console.log("Connected. Running migrations...");
  await client.query(SQL);
  console.log("✅ Tables created: users, cv_submissions");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
