// app/register/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import MemberRegistrationForm from "@/components/MemberRegistrationForm";
import { getMyRegistration, getMemberRegistrationDates, getClubSettings } from "@/actions/member";
import ThreeSportsBackground from "@/components/ThreeSportsBackground";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function RegisterPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const isAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "");

  // Settings & Date Check
  const dates = await getMemberRegistrationDates();
  const clubSettings = await getClubSettings();
  const now = new Date();
  let isRegistrationClosed = false;

  if (dates.start && dates.end) {
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    isRegistrationClosed = now < start || now > end;
  }

  const existingMember = await getMyRegistration();

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Interactive 3D Background */}
      <ThreeSportsBackground />

      <Navbar isAdmin={isAdmin} />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px 80px", position: "relative", zIndex: 10 }}>
        {isRegistrationClosed && !existingMember ? (
          <div
            className="glass-card animate-fade-in-up"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              borderColor: "rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.05)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <h1 style={{ fontWeight: 800, fontSize: "24px", marginBottom: "12px", color: "#fca5a5" }}>
              Member Registration is Currently Closed
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "28px", maxWidth: "480px", margin: "0 auto 28px" }}>
              The official member recruitment window is not currently open. Please check back during the announced registration dates.
            </p>
            <Link href="/dashboard" className="btn-gold">
              ← Return to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Header Title */}
            <div style={{ marginBottom: "36px", textAlign: "center" }}>
              <div
                className="badge badge-gold"
                style={{ marginBottom: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Sparkles size={14} />
                <span>Primeasia University Games & Sports Club · Season 2026</span>
              </div>
              <h1 style={{ fontWeight: 900, fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)", marginBottom: "10px", lineHeight: 1.15 }}>
                {existingMember ? (
                  <>
                    Your <span className="gradient-text">Membership Pass</span> & Profile
                  </>
                ) : (
                  <>
                    General <span className="gradient-text">Member Registration</span>
                  </>
                )}
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "540px", margin: "0 auto", lineHeight: 1.6 }}>
                {existingMember
                  ? "View and download your digital membership pass, or update your registered details below."
                  : "Join PaUGSC to participate in inter-university tournaments, training workshops, and official sports events."}
              </p>
            </div>

            {/* Registration Multi-Step Form */}
            <MemberRegistrationForm
              existingMember={existingMember}
              userEmail={session.user.email ?? ""}
              userName={session.user.name ?? ""}
              userAvatar={session.user.image}
              membershipFee={clubSettings.membershipFee}
              validityLabel={clubSettings.validityLabel}
            />
          </>
        )}
      </main>
    </div>
  );
}
