// scripts/migrate.mjs
// Run with: node scripts/migrate.mjs
import pg from "pg";
import fs from "fs";
import path from "path";

// Load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.warn("Failed to load .env.local:", e);
}

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS "cv_submissions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;

CREATE TABLE "users" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "google_id"  TEXT UNIQUE NOT NULL,
  "name"       TEXT NOT NULL,
  "email"      TEXT UNIQUE NOT NULL,
  "avatar"     TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "cv_submissions" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"            UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "full_name"          TEXT NOT NULL,
  "student_id"         TEXT NOT NULL,
  "phone"              TEXT NOT NULL,
  "position"           TEXT NOT NULL,
  "semester"           INTEGER NOT NULL,
  "department"         TEXT NOT NULL DEFAULT '',
  "cgpa"               TEXT NOT NULL DEFAULT '',
  "experience_details" TEXT NOT NULL DEFAULT '',
  "why_appropriate"    TEXT NOT NULL DEFAULT '',
  "device_info"        TEXT NOT NULL DEFAULT '',
  "blob_url"           TEXT NOT NULL,
  "filename"           TEXT NOT NULL,
  "uploaded_at"        TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE "settings" (
  "key"   TEXT PRIMARY KEY,
  "value" TEXT NOT NULL
);
`;

async function main() {
  console.log("Connecting to Neon...");
  await client.connect();
  console.log("Connected. Running migrations...");
  await client.query(SQL);
  console.log("✅ Tables created: users, cv_submissions, settings");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
