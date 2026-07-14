"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSubmissions, users, settings } from "@/lib/db/schema";
import { eq, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
      department: cvSubmissions.department,
      cgpa: cvSubmissions.cgpa,
      experienceDetails: cvSubmissions.experienceDetails,
      whyAppropriate: cvSubmissions.whyAppropriate,
      deviceInfo: cvSubmissions.deviceInfo,
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

export async function getRecruitmentDates() {
  const start = await db.select().from(settings).where(eq(settings.key, "application_start")).limit(1);
  const end = await db.select().from(settings).where(eq(settings.key, "application_end")).limit(1);
  return {
    start: start[0]?.value ?? "",
    end: end[0]?.value ?? "",
  };
}

export async function saveRecruitmentDates(start: string, end: string) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  // Upsert settings
  await db
    .insert(settings)
    .values({ key: "application_start", value: start })
    .onConflictDoUpdate({ target: settings.key, set: { value: start } });

  await db
    .insert(settings)
    .values({ key: "application_end", value: end })
    .onConflictDoUpdate({ target: settings.key, set: { value: end } });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/upload");
}

export async function resetRecruitmentData() {
  const session = await auth();
  requireAdmin(session?.user?.email);

  // 1. Delete all CV submissions
  await db.delete(cvSubmissions);

  // 2. Delete all users EXCEPT admin users
  if (ADMIN_EMAILS.length > 0) {
    await db.delete(users).where(notInArray(users.email, ADMIN_EMAILS));
  } else {
    // If no admin emails set, do not delete users to avoid locking out
    await db.delete(users);
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/upload");
}
