// actions/admin.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberRegistrations, users, settings, cvSubmissions, donations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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
  paymentSlipUrl: string;
  paymentAmount: string;
  paymentStatus: string;
  isFlagged: boolean;
  flaggedReason: string;
  receiptStudentId: string;
  validUntil: Date | null;
  renewalCount: number;
  renewalHistory: string;
  adminNotes: string;
  deviceInfo: string;
  registeredAt: Date;
  updatedAt: Date;
  userAvatar: string | null;
};

export type AdminDonationRow = {
  id: string;
  userId: string;
  memberRegistrationId: string | null;
  donorName: string;
  donorStudentId: string;
  donorEmail: string;
  donorPhone: string;
  category: string;
  amount: string;
  transactionId: string;
  paymentSlipUrl: string;
  donorNote: string;
  status: string;
  adminNotes: string;
  donatedAt: Date;
  verifiedAt: Date | null;
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
      paymentSlipUrl: memberRegistrations.paymentSlipUrl,
      paymentAmount: memberRegistrations.paymentAmount,
      paymentStatus: memberRegistrations.paymentStatus,
      isFlagged: memberRegistrations.isFlagged,
      flaggedReason: memberRegistrations.flaggedReason,
      receiptStudentId: memberRegistrations.receiptStudentId,
      validUntil: memberRegistrations.validUntil,
      renewalCount: memberRegistrations.renewalCount,
      renewalHistory: memberRegistrations.renewalHistory,
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

export async function getAllDonations(): Promise<AdminDonationRow[]> {
  const session = await auth();
  requireAdmin(session?.user?.email);

  const rows = await db
    .select()
    .from(donations)
    .orderBy(desc(donations.donatedAt));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    memberRegistrationId: r.memberRegistrationId,
    donorName: r.donorName,
    donorStudentId: r.donorStudentId,
    donorEmail: r.donorEmail,
    donorPhone: r.donorPhone,
    category: r.category,
    amount: r.amount,
    transactionId: r.transactionId,
    paymentSlipUrl: r.paymentSlipUrl,
    donorNote: r.donorNote,
    status: r.status,
    adminNotes: r.adminNotes,
    donatedAt: r.donatedAt,
    verifiedAt: r.verifiedAt,
  }));
}

export async function updateDonationStatus(
  donationId: string,
  status: "verified" | "rejected" | "pending",
  adminNotes?: string
) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  await db
    .update(donations)
    .set({
      status,
      adminNotes: adminNotes ?? "",
      verifiedAt: status === "verified" ? new Date() : null,
    })
    .where(eq(donations.id, donationId));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function updateMemberPaymentStatus(
  id: string,
  paymentStatus: "pending" | "verified" | "rejected" | "expired" | "pending_renewal",
  adminNotes?: string
) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  // Compute validUntil if verified
  let validUntil: Date | null = null;
  if (paymentStatus === "verified") {
    const durationSetting = await db.select().from(settings).where(eq(settings.key, "membership_duration_months")).limit(1);
    const months = parseInt(durationSetting[0]?.value || "12", 10);
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    validUntil = d;
  }

  interface MemberPaymentUpdate {
    paymentStatus: "pending" | "verified" | "rejected" | "expired" | "pending_renewal";
    adminNotes: string;
    updatedAt: Date;
    validUntil?: Date;
  }

  const updatePayload: MemberPaymentUpdate = {
    paymentStatus,
    adminNotes: adminNotes ?? "",
    updatedAt: new Date(),
  };

  if (validUntil) {
    updatePayload.validUntil = validUntil;
  }

  await db
    .update(memberRegistrations)
    .set(updatePayload)
    .where(eq(memberRegistrations.id, id));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

interface RenewalItem {
  status?: string;
  verifiedAt?: Date | string;
  validUntil?: Date | string;
  renewalDate?: Date | string;
  trxId?: string;
  amount?: string;
  slipUrl?: string;
}

export async function verifyMemberRenewal(id: string) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  const [member] = await db
    .select()
    .from(memberRegistrations)
    .where(eq(memberRegistrations.id, id))
    .limit(1);

  if (!member) return;

  const durationSetting = await db.select().from(settings).where(eq(settings.key, "membership_duration_months")).limit(1);
  const months = parseInt(durationSetting[0]?.value || "12", 10);
  const newValidUntil = new Date();
  newValidUntil.setMonth(newValidUntil.getMonth() + months);

  let history: RenewalItem[] = [];
  try {
    history = JSON.parse(member.renewalHistory || "[]");
  } catch {
    history = [];
  }

  if (history.length > 0) {
    const last = history[history.length - 1];
    last.status = "verified";
    last.verifiedAt = new Date();
    last.validUntil = newValidUntil;
  }

  await db
    .update(memberRegistrations)
    .set({
      paymentStatus: "verified",
      validUntil: newValidUntil,
      renewalCount: (member.renewalCount || 0) + 1,
      renewalHistory: JSON.stringify(history),
      updatedAt: new Date(),
    })
    .where(eq(memberRegistrations.id, id));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function deleteMember(id: string) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  await db.delete(memberRegistrations).where(eq(memberRegistrations.id, id));

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function saveClubFullSettings(settingsObj: {
  regStart?: string | null;
  regEnd?: string | null;
  validityLabel?: string | null;
  durationMonths?: number | null;
  membershipFee?: string | null;
}) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  const entries: [string, string][] = [
    ["member_reg_start", settingsObj.regStart || ""],
    ["member_reg_end", settingsObj.regEnd || ""],
    ["membership_validity_label", settingsObj.validityLabel || "SEASON 2026-2027"],
    ["membership_duration_months", String(settingsObj.durationMonths || 12)],
    ["membership_fee_bdt", settingsObj.membershipFee || "200"],
  ];

  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/register");
  revalidatePath("/");
}

// Retain legacy settings helper for backward compatibility
export async function saveRegistrationSettings(start: string | null, end: string | null) {
  return saveClubFullSettings({ regStart: start, regEnd: end });
}

export async function getRegistrationSettings() {
  try {
    const allSettings = await db.select().from(settings);
    const map = new Map(allSettings.map((s) => [s.key, s.value]));
    return {
      start: map.get("member_reg_start") || "",
      end: map.get("member_reg_end") || "",
      validityLabel: map.get("membership_validity_label") || "SEASON 2026-2027",
      durationMonths: parseInt(map.get("membership_duration_months") || "12", 10),
      membershipFee: map.get("membership_fee_bdt") || "200",
      fee: map.get("membership_fee_bdt") || "200",
      instructions: "",
    };
  } catch (err) {
    console.error("Failed to read registration settings:", err);
    return {
      start: "",
      end: "",
      validityLabel: "SEASON 2026-2027",
      durationMonths: 12,
      membershipFee: "200",
      fee: "200",
      instructions: "",
    };
  }
}

export async function revokeAllMemberships(options?: {
  newMembershipFee?: string;
  newValidityLabel?: string;
}) {
  const session = await auth();
  requireAdmin(session?.user?.email);

  // Set all member registrations to pending
  await db
    .update(memberRegistrations)
    .set({
      paymentStatus: "pending",
      updatedAt: new Date(),
    });

  // Optionally update fee and validity label in settings
  if (options?.newMembershipFee) {
    await db
      .insert(settings)
      .values({ key: "membership_fee_bdt", value: options.newMembershipFee.trim() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: options.newMembershipFee.trim() },
      });
  }

  if (options?.newValidityLabel) {
    await db
      .insert(settings)
      .values({ key: "membership_validity_label", value: options.newValidityLabel.trim() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: options.newValidityLabel.trim() },
      });
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/register");
  revalidatePath("/");

  return { success: true };
}

export async function resetAllMemberData() {
  const session = await auth();
  requireAdmin(session?.user?.email);

  await db.delete(memberRegistrations);
  await db.delete(donations);
  await db.delete(cvSubmissions);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/register");
  revalidatePath("/");
}

// Legacy recruitment exports for backward compatibility
export async function saveRecruitmentDates(start: string | null, end: string | null) {
  return saveRegistrationSettings(start, end);
}

export async function resetRecruitmentData() {
  return resetAllMemberData();
}

export async function deleteSubmission(id: string) {
  const session = await auth();
  requireAdmin(session?.user?.email);
  await db.delete(cvSubmissions).where(eq(cvSubmissions.id, id));
  revalidatePath("/admin");
}
