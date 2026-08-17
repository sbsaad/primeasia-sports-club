"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { donations, memberRegistrations, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DONATION_CATEGORIES } from "@/lib/validations";

export type DonationInput = {
  category: string;
  amount: string;
  transactionId: string;
  paymentSlipUrl?: string;
  donorNote?: string;
  donorPhone?: string;
};

export type UserDonationRecord = {
  id: string;
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

export type DonationSummary = {
  totalVerifiedAmount: number;
  totalPendingAmount: number;
  donationsCount: number;
  categoryBreakdown: { [category: string]: number };
  donations: UserDonationRecord[];
};

export async function submitDonation(input: DonationInput): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Please sign in to donate." };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return { success: false, error: "User profile not found." };
    }

    // Check if user is registered member to link memberRegistrationId
    const [member] = await db
      .select()
      .from(memberRegistrations)
      .where(eq(memberRegistrations.userId, user.id))
      .limit(1);

    const cleanTrxId = input.transactionId.trim().toUpperCase();
    if (!cleanTrxId || cleanTrxId.length < 5) {
      return { success: false, error: "Please enter a valid bKash Transaction ID." };
    }

    const numAmount = parseFloat(input.amount);
    if (isNaN(numAmount) || numAmount < 10) {
      return { success: false, error: "Please enter a valid donation amount (minimum 10 BDT)." };
    }

    await db.insert(donations).values({
      userId: user.id,
      memberRegistrationId: member ? member.id : null,
      donorName: member ? member.fullName : session.user.name || "Club Supporter",
      donorStudentId: member ? member.studentId : "Supporter",
      donorEmail: session.user.email,
      donorPhone: input.donorPhone || (member ? member.phone : "N/A"),
      category: input.category || "General Club Expansion",
      amount: String(numAmount),
      transactionId: cleanTrxId,
      paymentSlipUrl: input.paymentSlipUrl || "",
      donorNote: input.donorNote || "",
      status: "pending",
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Donation submission error:", err);
    return { success: false, error: "Failed to record contribution. Please try again." };
  }
}

export async function getMyDonationSummary(): Promise<DonationSummary> {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      totalVerifiedAmount: 0,
      totalPendingAmount: 0,
      donationsCount: 0,
      categoryBreakdown: {},
      donations: [],
    };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return {
      totalVerifiedAmount: 0,
      totalPendingAmount: 0,
      donationsCount: 0,
      categoryBreakdown: {},
      donations: [],
    };
  }

  const rows = await db
    .select()
    .from(donations)
    .where(eq(donations.userId, user.id))
    .orderBy(desc(donations.donatedAt));

  let totalVerified = 0;
  let totalPending = 0;
  const breakdown: { [category: string]: number } = {};

  for (const d of rows) {
    const amt = parseFloat(d.amount) || 0;
    if (d.status === "verified") {
      totalVerified += amt;
      breakdown[d.category] = (breakdown[d.category] || 0) + amt;
    } else if (d.status === "pending") {
      totalPending += amt;
    }
  }

  return {
    totalVerifiedAmount: totalVerified,
    totalPendingAmount: totalPending,
    donationsCount: rows.length,
    categoryBreakdown: breakdown,
    donations: rows.map((r) => ({
      id: r.id,
      category: r.category,
      amount: r.amount,
      transactionId: r.transactionId,
      paymentSlipUrl: r.paymentSlipUrl,
      donorNote: r.donorNote,
      status: r.status,
      adminNotes: r.adminNotes,
      donatedAt: r.donatedAt,
      verifiedAt: r.verifiedAt,
    })),
  };
}
