"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, cvSubmissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { studentFormSchema } from "@/lib/validations";
import { calculateSemester } from "@/lib/semester";
import { revalidatePath } from "next/cache";

export type SubmitResult =
  | { success: true; filename: string; blobUrl: string; semester: number }
  | { success: false; error: string };

export async function submitCV(formData: FormData): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Not authenticated." };
  }

  // Validate form fields
  const raw = {
    fullName: formData.get("fullName") as string,
    studentId: formData.get("studentId") as string,
    phone: formData.get("phone") as string,
    position: formData.get("position") as string,
  };

  const parsed = studentFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const { fullName, studentId, phone, position } = parsed.data;

  // Calculate semester
  const semResult = calculateSemester(studentId);
  if (!semResult.isValid) {
    return { success: false, error: semResult.error ?? "Invalid student ID." };
  }

  // Validate CV file
  const file = formData.get("cv") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Please upload your CV." };
  }
  if (file.type !== "application/pdf") {
    return { success: false, error: "Only PDF files are accepted." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File size must not exceed 5MB." };
  }

  // Find user in DB by email
  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (dbUsers.length === 0) {
    return { success: false, error: "User not found. Please sign in again." };
  }

  const dbUser = dbUsers[0];

  // Upload to Vercel Blob
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobPath = `cvs/${dbUser.id}/${Date.now()}-${safeName}`;

  let blobUrl: string;
  try {
    const blob = await put(blobPath, file, {
      access: "private",
      contentType: "application/pdf",
    });
    blobUrl = blob.url;
  } catch (err) {
    console.error("Blob upload error:", err);
    return { success: false, error: "Failed to upload file. Please try again." };
  }

  // Upsert submission (one per user — delete old, insert new)
  try {
    await db
      .delete(cvSubmissions)
      .where(eq(cvSubmissions.userId, dbUser.id));

    await db.insert(cvSubmissions).values({
      userId: dbUser.id,
      fullName,
      studentId,
      phone,
      position,
      semester: semResult.semester,
      blobUrl,
      filename: file.name,
    });
  } catch (err) {
    console.error("DB error:", err);
    return { success: false, error: "Failed to save submission. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return {
    success: true,
    filename: file.name,
    blobUrl,
    semester: semResult.semester,
  };
}

export async function getMySubmission() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!dbUsers[0]) return null;

  const subs = await db
    .select()
    .from(cvSubmissions)
    .where(eq(cvSubmissions.userId, dbUsers[0].id))
    .limit(1);

  return subs[0] ?? null;
}
