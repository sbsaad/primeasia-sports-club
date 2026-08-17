// scratch/check-members.mjs
import pg from "pg";
import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] || "";
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[match[1]] = val;
      }
    }
  }
} catch (e) {}

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const rows = await client.query(`SELECT id, user_id, membership_number, email, full_name, student_id FROM member_registrations`);
  console.log("MEMBERS IN DB:", rows.rows);

  const users = await client.query(`SELECT id, email, name FROM users`);
  console.log("USERS IN DB:", users.rows);
  await client.end();
}

main().catch(console.error);
