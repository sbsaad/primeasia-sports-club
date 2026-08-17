// scratch/test-insert.mjs
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

  // Test next sequence logic
  const allMembers = await client.query(`SELECT membership_number FROM member_registrations`);
  const usedNumbers = new Set(allMembers.rows.map((m) => m.membership_number));
  let seq = 1;
  while (usedNumbers.has(`PAUSC-2026-${String(seq).padStart(4, "0")}`)) {
    seq++;
  }
  const nextNumber = `PAUSC-2026-${String(seq).padStart(4, "0")}`;
  console.log("Existing numbers:", Array.from(usedNumbers));
  console.log("Calculated next unique membership number:", nextNumber);

  await client.end();
}

main().catch(console.error);
