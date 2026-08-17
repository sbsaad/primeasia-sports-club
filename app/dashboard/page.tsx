// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyRegistration, getClubSettings } from "@/actions/member";
import { getMyDonationSummary } from "@/actions/donation";
import Navbar from "@/components/Navbar";
import HolographicMemberCard from "@/components/HolographicMemberCard";
import ThreeSportsBackground from "@/components/ThreeSportsBackground";
import DashboardDonationSection from "@/components/DashboardDonationSection";
import Link from "next/link";
import Image from "next/image";
import { getSemesterLabel } from "@/lib/semester";
import {
  Sparkles,
  ShieldCheck,
  Clock,
  AlertCircle,
  Trophy,
  ArrowRight,
  Shield,
  FileText,
  CreditCard,
  Lock,
} from "lucide-react";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const member = await getMyRegistration();
  const donationSummary = await getMyDonationSummary();
  const clubSettings = await getClubSettings();

  const isAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "");
  const firstName = session.user.name?.split(" ")[0] ?? "Student";

  const now = new Date();
  let isRegistrationClosed = false;
  let windowLabel = "Active Season 2026";

  if (clubSettings.regStart && clubSettings.regEnd) {
    const start = new Date(clubSettings.regStart);
    const end = new Date(clubSettings.regEnd);
    isRegistrationClosed = now < start || now > end;
    windowLabel = `Registration Window: ${start.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dhaka",
    })} to ${end.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dhaka",
    })}`;
  }

  let sportsList: string[] = [];
  if (member?.sportsInterests) {
    try {
      const parsed = JSON.parse(member.sportsInterests);
      sportsList = Array.isArray(parsed) ? parsed : [member.sportsInterests];
    } catch {
      sportsList = [member.sportsInterests];
    }
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* 3D WebGL Sports Canvas */}
      <ThreeSportsBackground />

      <Navbar isAdmin={isAdmin} />

      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 20px 80px", position: "relative", zIndex: 10 }}>
        {/* Welcome Header */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}
          className="animate-slide-up"
        >
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={68}
              height={68}
              style={{ borderRadius: "50%", border: "3px solid #fbbf24", flexShrink: 0, boxShadow: "0 0 20px rgba(245,158,11,0.4)" }}
            />
          ) : (
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "rgba(22, 44, 91, 0.9)",
                border: "3px solid #fbbf24",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 900,
                color: "#fef08a",
                flexShrink: 0,
              }}
            >
              {firstName[0]}
            </div>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.1rem)", fontWeight: 900, color: "#ffffff", margin: 0 }}>
                Welcome, <span className="gradient-text">{firstName}</span>! 👋
              </h1>
              {isAdmin && (
                <span className="badge badge-gold">
                  <Shield size={12} /> Admin
                </span>
              )}
            </div>
            <p style={{ color: "#cbd5e1", fontSize: "14px", marginTop: "4px" }}>
              Primeasia University Games & Sports Club · {windowLabel}
            </p>
          </div>
        </div>

        {/* Member Status Card */}
        {member ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-slide-up">
            {/* Status Alert Banner */}
            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderColor:
                  member.paymentStatus === "verified"
                    ? "rgba(34, 197, 94, 0.5)"
                    : member.paymentStatus === "rejected"
                    ? "rgba(239, 68, 68, 0.5)"
                    : member.paymentStatus === "expired"
                    ? "rgba(239, 68, 68, 0.6)"
                    : "rgba(245, 158, 11, 0.5)",
                background:
                  member.paymentStatus === "verified"
                    ? "rgba(34, 197, 94, 0.15)"
                    : member.paymentStatus === "rejected"
                    ? "rgba(239, 68, 68, 0.15)"
                    : member.paymentStatus === "expired"
                    ? "rgba(239, 68, 68, 0.18)"
                    : "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {member.paymentStatus === "verified" ? (
                  <ShieldCheck size={26} color="#4ade80" />
                ) : member.paymentStatus === "rejected" || member.paymentStatus === "expired" ? (
                  <AlertCircle size={26} color="#f87171" />
                ) : (
                  <Clock size={26} color="#fbbf24" className="animate-spin-slow" />
                )}
                <div>
                  <div style={{ fontWeight: 900, fontSize: "15px", color: member.paymentStatus === "verified" ? "#86efac" : member.paymentStatus === "rejected" || member.paymentStatus === "expired" ? "#fca5a5" : "#fef08a" }}>
                    {member.paymentStatus === "verified"
                      ? "✓ Official Member Verified & Certified"
                      : member.paymentStatus === "rejected"
                      ? "Payment Verification Rejected"
                      : member.paymentStatus === "expired"
                      ? "⚠️ Member Pass Expired"
                      : member.paymentStatus === "pending_renewal"
                      ? "⏳ Renewal Verification in Progress"
                      : "bKash Payment Verification in Progress"}
                  </div>
                  <div style={{ fontSize: "13px", color: "#e2e8f0", marginTop: "2px" }}>
                    {member.paymentStatus === "verified"
                      ? `Your membership is certified and locked. Valid for: ${clubSettings.validityLabel}. Download your official pass slip below.`
                      : member.paymentStatus === "rejected"
                      ? `Reason: ${member.adminNotes || "TrxID mismatch. Please update details."}`
                      : member.paymentStatus === "expired"
                      ? "Your membership pass has ended. Please renew to continue club tournament access."
                      : member.paymentStatus === "pending_renewal"
                      ? `Renewal TrxID: ${member.transactionId} · Under verification by club administration.`
                      : `TrxID: ${member.transactionId} · Under verification by club administrators.`}
                  </div>
                </div>
              </div>

              {member.paymentStatus === "verified" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12.5px",
                    padding: "7px 16px",
                    background: "rgba(34,197,94,0.25)",
                    border: "1.5px solid #22c55e",
                    color: "#86efac",
                    borderRadius: "10px",
                    fontWeight: 800,
                  }}
                >
                  <Lock size={14} /> Profile Locked
                </span>
              ) : (
                <Link href="/register" className="btn-outline" style={{ fontSize: "12.5px", padding: "8px 16px" }}>
                  ✏️ Update Details
                </Link>
              )}
            </div>

            {/* 3D Holographic Card View */}
            <div className="glass-card" style={{ padding: "36px 20px", textAlign: "center" }}>
              <div style={{ marginBottom: "20px" }}>
                <span className="badge badge-gold" style={{ marginBottom: "8px", display: "inline-block" }}>
                  <Sparkles size={12} /> Official PaUGSC Smart ID Card
                </span>
                <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", margin: 0 }}>
                  Your 3D Holographic Sports Pass
                </h2>
                <p style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px" }}>
                  Move your cursor or touch &amp; flip to inspect your 3D biometric card details.
                </p>
              </div>

              <HolographicMemberCard
                member={{
                  fullName: member.fullName,
                  studentId: member.studentId,
                  department: member.department,
                  sportsList,
                  membershipNumber: member.membershipNumber,
                  transactionId: member.transactionId,
                  phone: member.phone,
                  gender: member.gender,
                  bloodGroup: member.bloodGroup,
                  jerseySize: member.jerseySize,
                  emergencyContact: member.emergencyContact,
                  paymentStatus: member.paymentStatus,
                  registeredAt: member.registeredAt,
                  userAvatar: session.user.image,
                  validityLabel: clubSettings.validityLabel,
                }}
              />
            </div>

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  Student ID
                </div>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                  {member.studentId}
                </div>
                <div style={{ fontSize: "11.5px", color: "#fbbf24", marginTop: "2px", fontWeight: 700 }}>
                  {getSemesterLabel(member.semester)}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  Department
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                  {member.department}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  Pass Validity
                </div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#38bdf8", marginTop: "4px" }}>
                  {clubSettings.validityLabel}
                </div>
                <div style={{ fontSize: "11.5px", color: member.paymentStatus === "verified" ? "#4ade80" : "#fef08a", marginTop: "2px", fontWeight: 700 }}>
                  {member.paymentStatus === "verified" ? "ACTIVE" : member.paymentStatus.toUpperCase()}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  Blood & Jersey
                </div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                  {member.bloodGroup} · Size {member.jerseySize}
                </div>
                <div style={{ fontSize: "11px", color: "#fbbf24", marginTop: "2px" }}>
                  (Jersey for later use)
                </div>
              </div>
            </div>

            {/* Club Donation Hub & Personal Impact Ledger */}
            <DashboardDonationSection
              donationSummary={donationSummary}
              memberData={{
                membershipNumber: member.membershipNumber,
                fullName: member.fullName,
                studentId: member.studentId,
                phone: member.phone,
                paymentStatus: member.paymentStatus,
                validUntil: member.validUntil,
              }}
              validityLabel={clubSettings.validityLabel}
              renewalFee={clubSettings.membershipFee}
            />
          </div>
        ) : (
          /* Not registered yet */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-card-bright glow-border animate-slide-up" style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "52px", marginBottom: "14px" }} className="animate-trophy-bounce">
                🎟️
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", marginBottom: "8px" }}>
                You have not registered for 2026 Membership yet!
              </h2>
              <p style={{ color: "#cbd5e1", fontSize: "14.5px", maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
                Complete the registration form with your student ID, sports preferences, and 200 BDT bKash transaction ID to receive your official PaUGSC 3D member pass.
              </p>

              {isRegistrationClosed ? (
                <div style={{ color: "#fca5a5", fontWeight: 700, fontSize: "14px" }}>
                  🔒 Registration window is currently closed.
                </div>
              ) : (
                <Link href="/register" className="btn-neon-gold" style={{ fontSize: "15px", padding: "14px 32px" }}>
                  Register as Member Now <ArrowRight size={18} />
                </Link>
              )}
            </div>

            {/* Club Donation Hub for Supporters */}
            <DashboardDonationSection
              donationSummary={donationSummary}
              memberData={null}
              validityLabel={clubSettings.validityLabel}
              renewalFee={clubSettings.membershipFee}
            />
          </div>
        )}
      </main>
    </div>
  );
}
