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

CREATE TABLE IF NOT EXISTS "users" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "google_id"  TEXT UNIQUE NOT NULL,
  "name"       TEXT NOT NULL,
  "email"      TEXT UNIQUE NOT NULL,
  "avatar"     TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "member_registrations" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"            UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "membership_number"  TEXT UNIQUE NOT NULL,
  "full_name"          TEXT NOT NULL,
  "student_id"         TEXT NOT NULL,
  "phone"              TEXT NOT NULL,
  "email"              TEXT NOT NULL,
  "department"         TEXT NOT NULL,
  "semester"           INTEGER NOT NULL,
  "gender"             TEXT NOT NULL DEFAULT 'Male',
  "blood_group"        TEXT NOT NULL DEFAULT 'Unknown',
  "sports_interests"   TEXT NOT NULL DEFAULT '[]',
  "jersey_size"        TEXT NOT NULL DEFAULT 'M',
  "emergency_contact"  TEXT NOT NULL DEFAULT '',
  "bkash_number"       TEXT NOT NULL DEFAULT '',
  "transaction_id"     TEXT NOT NULL,
  "payment_slip_url"   TEXT NOT NULL DEFAULT '',
  "payment_amount"     TEXT NOT NULL DEFAULT '200',
  "payment_status"     TEXT NOT NULL DEFAULT 'pending',
  "admin_notes"        TEXT NOT NULL DEFAULT '',
  "device_info"        TEXT NOT NULL DEFAULT '{}',
  "registered_at"      TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at"         TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE "member_registrations" ADD COLUMN IF NOT EXISTS "payment_slip_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "member_registrations" ADD COLUMN IF NOT EXISTS "is_flagged" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "member_registrations" ADD COLUMN IF NOT EXISTS "flagged_reason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "member_registrations" ADD COLUMN IF NOT EXISTS "receipt_student_id" TEXT NOT NULL DEFAULT '';


CREATE TABLE IF NOT EXISTS "cv_submissions" (
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

CREATE TABLE IF NOT EXISTS "settings" (
  "key"   TEXT PRIMARY KEY,
  "value" TEXT NOT NULL
);
`;

async function main() {
  console.log("Connecting to Neon Postgres...");
  await client.connect();
  console.log("Connected. Running migrations...");
  await client.query(SQL);
  console.log("✅ Tables verified/created: users, member_registrations, cv_submissions, settings");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

