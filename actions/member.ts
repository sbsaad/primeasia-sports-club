"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, memberRegistrations, settings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { memberRegistrationSchema, type MemberRegistrationFormValues } from "@/lib/validations";
import { calculateSemester } from "@/lib/semester";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type MemberRegistrationResult =
  | { success: true; membershipNumber: string; registrationId: string; semester: number }
  | { success: false; error: string };

export type MemberRegistrationPayload = MemberRegistrationFormValues & {
  deviceInfo?: string;
};

export async function registerMember(
  payload: MemberRegistrationPayload
): Promise<MemberRegistrationResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Authentication required. Please sign in with your email." };
  }

  // 1. Check active registration dates if configured
  const now = new Date();
  try {
    const startSetting = await db.select().from(settings).where(eq(settings.key, "member_reg_start")).limit(1);
    const endSetting = await db.select().from(settings).where(eq(settings.key, "member_reg_end")).limit(1);
    
    if (startSetting[0]?.value && endSetting[0]?.value) {
      const startDate = new Date(startSetting[0].value);
      const endDate = new Date(endSetting[0].value);
      if (now < startDate || now > endDate) {
        return { success: false, error: "Member registration is currently closed. Please check the registration window." };
      }
    }
  } catch (err) {
    console.error("Failed to check registration settings:", err);
  }

  // 2. Validate payload
  const parsed = memberRegistrationSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const data = parsed.data;

  // 3. Compute Semester from Student ID
  const semResult = calculateSemester(data.studentId);
  if (!semResult.isValid) {
    return { success: false, error: semResult.error ?? "Invalid Primeasia Student ID." };
  }

  // 4. Capture Client IP & Device Telemetry
  const reqHeaders = await headers();
  const ip =
    reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() ||
    reqHeaders.get("x-real-ip") ||
    "127.0.0.1";

  let deviceInfoObj = {};
  try {
    if (payload.deviceInfo) {
      deviceInfoObj = JSON.parse(payload.deviceInfo);
    }
  } catch (e) {}

  const updatedDeviceInfo = JSON.stringify({
    ...deviceInfoObj,
    ip,
    userAgent: reqHeaders.get("user-agent") || "",
  });

  // 5. Look up user
  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (dbUsers.length === 0) {
    return { success: false, error: "User account not found. Please sign in again." };
  }

  const dbUser = dbUsers[0];

  // 6. Check existing registration to preserve membership number or generate a new one
  const existingReg = await db
    .select()
    .from(memberRegistrations)
    .where(eq(memberRegistrations.userId, dbUser.id))
    .limit(1);

  let membershipNumber = existingReg[0]?.membershipNumber;

  if (!membershipNumber) {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(memberRegistrations);
    const currentCount = Number(countResult[0]?.count || 0) + 1;
    membershipNumber = `PAUSC-2026-${String(currentCount).padStart(4, "0")}`;
  }

  let registrationId = "";

  try {
    // Delete existing registration if updating
    if (existingReg.length > 0) {
      await db
        .delete(memberRegistrations)
        .where(eq(memberRegistrations.userId, dbUser.id));
    }

    const inserted = await db
      .insert(memberRegistrations)
      .values({
        userId: dbUser.id,
        membershipNumber,
        fullName: data.fullName.trim(),
        studentId: data.studentId.trim(),
        phone: data.phone.trim(),
        email: session.user.email,
        department: data.department,
        semester: semResult.semester,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        sportsInterests: JSON.stringify(data.sportsInterests),
        jerseySize: data.jerseySize,
        emergencyContact: (data.emergencyContact || "").trim(),
        bkashNumber: (data.bkashNumber || "").trim(),
        transactionId: data.transactionId.trim().toUpperCase(),
        paymentAmount: "200",
        paymentStatus: "pending",
        deviceInfo: updatedDeviceInfo,
      })
      .returning({ id: memberRegistrations.id });

    registrationId = inserted[0]?.id || "";
  } catch (err) {
    console.error("Database registration error:", err);
    return { success: false, error: "Failed to record member registration. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/register");
  revalidatePath("/admin");
  revalidatePath("/");

  return {
    success: true,
    membershipNumber,
    registrationId,
    semester: semResult.semester,
  };
}

export async function getMyRegistration() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!dbUsers[0]) return null;

  const regs = await db
    .select()
    .from(memberRegistrations)
    .where(eq(memberRegistrations.userId, dbUsers[0].id))
    .limit(1);

  return regs[0] ?? null;
}

export async function getMemberRegistrationDates() {
  try {
    const start = await db.select().from(settings).where(eq(settings.key, "member_reg_start")).limit(1);
    const end = await db.select().from(settings).where(eq(settings.key, "member_reg_end")).limit(1);
    return {
      start: start[0]?.value ?? "",
      end: end[0]?.value ?? "",
    };
  } catch (err) {
    return { start: "", end: "" };
  }
}
