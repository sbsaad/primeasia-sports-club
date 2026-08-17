// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyRegistration, getMemberRegistrationDates } from "@/actions/member";
import Navbar from "@/components/Navbar";
import HolographicMemberCard from "@/components/HolographicMemberCard";
import ThreeSportsBackground from "@/components/ThreeSportsBackground";
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
} from "lucide-react";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const member = await getMyRegistration();
  const isAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "");
  const firstName = session.user.name?.split(" ")[0] ?? "Student";

  const dates = await getMemberRegistrationDates();
  const now = new Date();
  let isRegistrationClosed = false;
  let windowLabel = "Active Season 2026";

  if (dates.start && dates.end) {
    const start = new Date(dates.start);
    const end = new Date(dates.end);
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
          className="animate-fade-in-up"
        >
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={68}
              height={68}
              style={{ borderRadius: "50%", border: "3px solid var(--gold)", flexShrink: 0, boxShadow: "0 0 20px rgba(201,162,39,0.3)" }}
            />
          ) : (
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "var(--navy-mid)",
                border: "3px solid var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                fontWeight: 900,
                color: "var(--gold)",
                flexShrink: 0,
              }}
            >
              {firstName[0]}
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Welcome to PaUGSC,</span>
              <span className="badge badge-gold" style={{ fontSize: "11px", padding: "2px 8px" }}>
                Member Portal
              </span>
            </div>
            <h1 style={{ fontWeight: 900, fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", lineHeight: 1.15, color: "var(--text-primary)" }}>
              {session.user.name || "Student Athlete"}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {session.user.email}
            </p>
          </div>
        </div>

        {/* Status Card & 3D Holographic Card Display */}
        {member ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in-up">
            {/* Status Alert Banner */}
            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderColor:
                  member.paymentStatus === "verified"
                    ? "rgba(34, 197, 94, 0.35)"
                    : member.paymentStatus === "rejected"
                    ? "rgba(239, 68, 68, 0.35)"
                    : "rgba(245, 158, 11, 0.35)",
                background:
                  member.paymentStatus === "verified"
                    ? "rgba(34, 197, 94, 0.06)"
                    : member.paymentStatus === "rejected"
                    ? "rgba(239, 68, 68, 0.06)"
                    : "rgba(245, 158, 11, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {member.paymentStatus === "verified" ? (
                  <ShieldCheck size={24} color="#4ade80" />
                ) : member.paymentStatus === "rejected" ? (
                  <AlertCircle size={24} color="#f87171" />
                ) : (
                  <Clock size={24} color="#fbbf24" className="animate-spin-slow" />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14.5px", color: member.paymentStatus === "verified" ? "#4ade80" : member.paymentStatus === "rejected" ? "#f87171" : "#fbbf24" }}>
                    {member.paymentStatus === "verified"
                      ? "✓ Official Member Verified"
                      : member.paymentStatus === "rejected"
                      ? "Payment Verification Rejected"
                      : "bKash Payment Verification in Progress"}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {member.paymentStatus === "verified"
                      ? "Your membership is active! Download your official pass slip below."
                      : member.paymentStatus === "rejected"
                      ? `Reason: ${member.adminNotes || "TrxID mismatch. Please update details."}`
                      : `TrxID: ${member.transactionId} · Under verification by club administrators.`}
                  </div>
                </div>
              </div>

              <Link href="/register" className="btn-outline" style={{ fontSize: "12.5px", padding: "6px 14px" }}>
                ✏️ Update Details
              </Link>
            </div>

            {/* 3D Holographic Card View */}
            <div className="glass-card" style={{ padding: "36px 20px", textAlign: "center" }}>
              <div style={{ marginBottom: "20px" }}>
                <span className="badge badge-gold" style={{ marginBottom: "8px", display: "inline-block" }}>
                  Official Digital Pass
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  Primeasia Games & Sports Club ID
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Move your mouse/finger to experience the 3D holographic tilt
                </p>
              </div>

              <HolographicMemberCard
                member={{
                  membershipNumber: member.membershipNumber,
                  fullName: member.fullName,
                  studentId: member.studentId,
                  email: member.email,
                  phone: member.phone,
                  department: member.department,
                  semester: member.semester,
                  gender: member.gender,
                  bloodGroup: member.bloodGroup,
                  sportsInterests: sportsList,
                  jerseySize: member.jerseySize,
                  emergencyContact: member.emergencyContact,
                  bkashNumber: member.bkashNumber,
                  transactionId: member.transactionId,
                  paymentAmount: member.paymentAmount,
                  paymentStatus: member.paymentStatus,
                  registeredAt: member.registeredAt,
                  userAvatar: session.user.image,
                }}
              />
            </div>

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Student ID
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                  {member.studentId}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--gold)", marginTop: "2px" }}>
                  {getSemesterLabel(member.semester)}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Department
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                  {member.department}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  bKash Payment
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#f472b6", fontFamily: "monospace", marginTop: "4px" }}>
                  {member.transactionId}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Amount: ৳{member.paymentAmount || "200"}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Sports Selected
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold-light)", marginTop: "4px" }}>
                  {sportsList.join(", ")}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Not registered prompt */
          <div
            className="glass-card glow-border animate-fade-in-up"
            style={{ padding: "48px 24px", textAlign: "center", marginBottom: "28px" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }} className="animate-float-bob">
              🏆
            </div>
            <h2 style={{ fontWeight: 900, fontSize: "24px", marginBottom: "10px", color: "var(--text-primary)" }}>
              You Haven&apos;t Registered as a Member Yet
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "520px", margin: "0 auto 28px", lineHeight: 1.6 }}>
              Join the official Primeasia University Games and Sports Club for 2026. Get your digital pass, participate in intra and inter-university tournaments, and represent Primeasia with pride!
            </p>
            <Link
              href="/register"
              className="btn-gold"
              style={{ padding: "14px 36px", fontSize: "15px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              Complete Registration (200 BDT) <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Quick Action Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "28px" }}>
          <Link href="/register" style={{ textDecoration: "none" }}>
            <div className="glass-card glow-border" style={{ padding: "20px", cursor: "pointer" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎽</div>
              <h3 style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginBottom: "4px" }}>
                {member ? "View Digital Pass" : "Register as Member"}
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0 }}>
                {member ? "Review and download your PDF membership pass." : "Fill details, provide TrxID, and get your pass."}
              </p>
            </div>
          </Link>

          {isAdmin && (
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <div className="glass-card glow-border" style={{ padding: "20px", cursor: "pointer", borderColor: "rgba(201, 162, 39, 0.4)" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>⚙️</div>
                <h3 style={{ fontWeight: 700, fontSize: "15px", color: "var(--gold)", marginBottom: "4px" }}>
                  Admin Command Center
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0 }}>
                  Verify member payments, download Excel (.xlsx) and PDF roster.
                </p>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
