"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberRegistrations, users, settings, cvSubmissions } from "@/lib/db/schema";
import { eq, notInArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function requireAdmin(email: string | null | undefined) {
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    throw new Error("Unauthorized: Admin privileges required.");
  }
}

export type AdminMemberRow = {
  id: string;
  userId: string;
  membershipNumber: string;
  fullName: string;
  studentId: string;
  phone: string;
  email: string;
  department: string;
  semester: number;
  gender: string;
  bloodGroup: string;
  sportsInterests: string;
  jerseySize: string;
  emergencyContact: string;
  bkashNumber: string;
  transactionId: string;
  paymentAmount: string;
  paymentStatus: string;
  adminNotes: string;
  deviceInfo: string;
  registeredAt: Date;
  updatedAt: Date;
  userAvatar: string | null;
};

export async function getAllMembers(): Promise<AdminMemberRow[]> {
  const session = await auth();
  requireAdmin(session?.user?.email);

  const rows = await db
    .select({
      id: memberRegistrations.id,
      userId: memberRegistrations.userId,
      membershipNumber: memberRegistrations.membershipNumber,
      fullName: memberRegistrations.fullName,
      studentId: memberRegistrations.studentId,
      phone: memberRegistrations.phone,
      email: memberRegistrations.email,
      department: memberRegistrations.department,
      semester: memberRegistrations.semester,
      gender: memberRegistrations.gender,
      bloodGroup: memberRegistrations.bloodGroup,
      sportsInterests: memberRegistrations.sportsInterests,
      jerseySize: memberRegistrations.jerseySize,
      emergencyContact: memberRegistrations.emergencyContact,
      bkashNumber: memberRegistrations.bkashNumber,
      transactionId: memberRegistrations.transactionId,
      paymentAmount: memberRegistrations.paymentAmount,
      paymentStatus: memberRegistrations.paymentStatus,
      adminNotes: memberRegistrations.adminNotes,
      deviceInfo: memberRegistrations.deviceInfo,
      registeredAt: memberRegistrations.registeredAt,
      updatedAt: memberRegistrations.updatedAt,
      userAvatar: users.avatar,
    })
    .from(memberRegistrations)
    .innerJoin(users, eq(memberRegistrations.userId, users.id))
    .orderBy(desc(memberRegistrations.registeredAt));

  return rows;
}

export async function updateMemberPaymentStatus(
  id: string,
  paymentStatus: "pending" | "verified" | "rejected",
  adminNotes?: string
) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  await db
    .update(memberRegistrations)
    .set({
      paymentStatus,
      adminNotes: adminNotes ?? "",
      updatedAt: new Date(),
    })
    .where(eq(memberRegistrations.id, id));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/register");
}

export async function deleteMember(id: string) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  await db.delete(memberRegistrations).where(eq(memberRegistrations.id, id));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/register");
}

export async function getRegistrationSettings() {
  const start = await db.select().from(settings).where(eq(settings.key, "member_reg_start")).limit(1);
  const end = await db.select().from(settings).where(eq(settings.key, "member_reg_end")).limit(1);
  const fee = await db.select().from(settings).where(eq(settings.key, "membership_fee")).limit(1);
  const instructions = await db.select().from(settings).where(eq(settings.key, "bkash_instructions")).limit(1);

  return {
    start: start[0]?.value ?? "",
    end: end[0]?.value ?? "",
    fee: fee[0]?.value ?? "200",
    instructions: instructions[0]?.value ?? "",
  };
}

export async function saveRegistrationSettings(config: {
  start: string;
  end: string;
  fee?: string;
  instructions?: string;
}) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  await db
    .insert(settings)
    .values({ key: "member_reg_start", value: config.start })
    .onConflictDoUpdate({ target: settings.key, set: { value: config.start } });

  await db
    .insert(settings)
    .values({ key: "member_reg_end", value: config.end })
    .onConflictDoUpdate({ target: settings.key, set: { value: config.end } });

  if (config.fee) {
    await db
      .insert(settings)
      .values({ key: "membership_fee", value: config.fee })
      .onConflictDoUpdate({ target: settings.key, set: { value: config.fee } });
  }

  if (config.instructions) {
    await db
      .insert(settings)
      .values({ key: "bkash_instructions", value: config.instructions })
      .onConflictDoUpdate({ target: settings.key, set: { value: config.instructions } });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/register");
  revalidatePath("/admin");
}

export async function resetAllMemberData() {
  const session = await auth();
  requireAdmin(session?.user?.email);

  // 1. Delete all member registrations
  await db.delete(memberRegistrations);

  // 2. Delete non-admin users if configured
  if (ADMIN_EMAILS.length > 0) {
    await db.delete(users).where(notInArray(users.email, ADMIN_EMAILS));
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/register");
  revalidatePath("/admin");
}

// Retain legacy functions to prevent breaking any existing references
export async function getRecruitmentDates() {
  return getRegistrationSettings();
}

export async function saveRecruitmentDates(start: string, end: string) {
  return saveRegistrationSettings({ start, end });
}

export async function resetRecruitmentData() {
  return resetAllMemberData();
}

export async function getAllSubmissions() {
  const session = await auth();
  requireAdmin(session?.user?.email);

  return db
    .select()
    .from(cvSubmissions)
    .orderBy(cvSubmissions.uploadedAt);
}

export async function deleteSubmission(id: string) {
  const session = await auth();
  requireAdmin(session?.user?.email);
  await db.delete(cvSubmissions).where(eq(cvSubmissions.id, id));
}
