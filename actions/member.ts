"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, memberRegistrations, settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
  } catch {}

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

  // 6. Check existing registration
  const existingReg = await db
    .select()
    .from(memberRegistrations)
    .where(eq(memberRegistrations.userId, dbUser.id))
    .limit(1);

  // RESTRICTION: If already verified and approved by admin, edit is locked
  if (existingReg.length > 0 && existingReg[0].paymentStatus === "verified") {
    return {
      success: false,
      error: "Your membership application has already been verified and approved by the club authority. Profile modifications are locked.",
    };
  }

  let membershipNumber = existingReg[0]?.membershipNumber;

  if (!membershipNumber) {
    const currentYear = new Date().getFullYear();
    const allMembers = await db
      .select({ membershipNumber: memberRegistrations.membershipNumber })
      .from(memberRegistrations);

    const usedNumbers = new Set(allMembers.map((m) => m.membershipNumber));
    let seq = 1;
    while (usedNumbers.has(`PAUSC-${currentYear}-${String(seq).padStart(4, "0")}`)) {
      seq++;
    }
    membershipNumber = `PAUSC-${currentYear}-${String(seq).padStart(4, "0")}`;
  }

  let registrationId = "";

  try {
    const feeSetting = await db.select().from(settings).where(eq(settings.key, "membership_fee_bdt")).limit(1);
    const activeMembershipFee = feeSetting[0]?.value || "200";

    const isFlaggedCalculated = Boolean(
      data.isFlagged ||
        (data.receiptStudentId && data.receiptStudentId.trim() !== data.studentId.trim())
    );

    const flaggedReasonCalculated =
      data.receiptStudentId && data.receiptStudentId.trim() !== data.studentId.trim()
        ? `Receipt Student ID (${data.receiptStudentId.trim()}) does not match entered Student ID (${data.studentId.trim()})`
        : data.flaggedReason || "";

    if (existingReg.length > 0) {
      // In-place UPDATE for unverified registration edit
      const updated = await db
        .update(memberRegistrations)
        .set({
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
          paymentSlipUrl: (data.paymentSlipUrl || "").trim(),
          paymentAmount: activeMembershipFee,
          paymentStatus: "pending", // Reset status to pending so admin re-verifies updated info
          adminNotes: "", // Clear previous rejection reason
          isFlagged: isFlaggedCalculated,
          flaggedReason: flaggedReasonCalculated,
          receiptStudentId: (data.receiptStudentId || "").trim(),
          deviceInfo: updatedDeviceInfo,
          updatedAt: new Date(),
        })
        .where(eq(memberRegistrations.id, existingReg[0].id))
        .returning({ id: memberRegistrations.id });

      registrationId = updated[0]?.id || existingReg[0].id;
    } else {
      // INSERT new member registration
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
          paymentSlipUrl: (data.paymentSlipUrl || "").trim(),
          paymentAmount: activeMembershipFee,
          paymentStatus: "pending",
          isFlagged: isFlaggedCalculated,
          flaggedReason: flaggedReasonCalculated,
          receiptStudentId: (data.receiptStudentId || "").trim(),
          deviceInfo: updatedDeviceInfo,
          registeredAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: memberRegistrations.id });

      registrationId = inserted[0]?.id || "";
    }
  } catch (err: unknown) {
    console.error("Database registration error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to record member registration. Please try again.";
    return { success: false, error: errorMessage };
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

interface MemberRenewalRecord {
  renewalDate: Date | string;
  trxId: string;
  amount: string;
  slipUrl: string;
  status: string;
  verifiedAt?: Date | string;
  validUntil?: Date | string;
}

export async function renewMembership(payload: {
  transactionId: string;
  bkashNumber?: string;
  paymentSlipUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Please sign in to renew your membership." };
  }

  const cleanTrxId = payload.transactionId.trim().toUpperCase();
  if (!cleanTrxId || cleanTrxId.length < 5) {
    return { success: false, error: "Please enter a valid bKash Transaction ID." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return { success: false, error: "User account not found." };
  }

  const [member] = await db
    .select()
    .from(memberRegistrations)
    .where(eq(memberRegistrations.userId, user.id))
    .limit(1);

  if (!member) {
    return { success: false, error: "No existing membership record found to renew." };
  }

  let history: MemberRenewalRecord[] = [];
  try {
    history = JSON.parse(member.renewalHistory || "[]");
  } catch {
    history = [];
  }

  history.push({
    renewalDate: new Date(),
    trxId: cleanTrxId,
    amount: "200",
    slipUrl: payload.paymentSlipUrl || "",
    status: "pending_renewal",
  });

  await db
    .update(memberRegistrations)
    .set({
      transactionId: cleanTrxId,
      bkashNumber: payload.bkashNumber?.trim() || member.bkashNumber,
      paymentSlipUrl: payload.paymentSlipUrl || member.paymentSlipUrl,
      paymentStatus: "pending_renewal",
      renewalHistory: JSON.stringify(history),
      updatedAt: new Date(),
    })
    .where(eq(memberRegistrations.id, member.id));

  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return { success: true };
}

export async function getClubSettings() {
  try {
    const allSettings = await db.select().from(settings);
    const map = new Map(allSettings.map((s) => [s.key, s.value]));
    return {
      regStart: map.get("member_reg_start") || null,
      regEnd: map.get("member_reg_end") || null,
      validityLabel: map.get("membership_validity_label") || "SEASON 2026-2027",
      durationMonths: parseInt(map.get("membership_duration_months") || "12", 10),
      membershipFee: map.get("membership_fee_bdt") || "200",
    };
  } catch (err) {
    console.error("Failed to read club settings:", err);
    return {
      regStart: null,
      regEnd: null,
      validityLabel: "SEASON 2026-2027",
      durationMonths: 12,
      membershipFee: "200",
    };
  }
}

export async function getMemberRegistrationDates() {
  const s = await getClubSettings();
  return { start: s.regStart, end: s.regEnd };
}

