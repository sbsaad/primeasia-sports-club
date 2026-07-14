"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSubmissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function requireAdmin(email: string | null | undefined) {
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    throw new Error("Unauthorized");
  }
}

export async function getAllSubmissions() {
  const session = await auth();
  requireAdmin(session?.user?.email);

  const rows = await db
    .select({
      id: cvSubmissions.id,
      fullName: cvSubmissions.fullName,
      studentId: cvSubmissions.studentId,
      phone: cvSubmissions.phone,
      position: cvSubmissions.position,
      semester: cvSubmissions.semester,
      blobUrl: cvSubmissions.blobUrl,
      filename: cvSubmissions.filename,
      uploadedAt: cvSubmissions.uploadedAt,
      userEmail: users.email,
      userAvatar: users.avatar,
    })
    .from(cvSubmissions)
    .innerJoin(users, eq(cvSubmissions.userId, users.id))
    .orderBy(cvSubmissions.uploadedAt);

  return rows;
}
