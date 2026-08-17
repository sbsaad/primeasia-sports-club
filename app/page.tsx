// app/page.tsx
import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMemberRegistrationDates } from "@/actions/member";
import CountdownTimer from "@/components/CountdownTimer";
import ThreeSportsBackground from "@/components/ThreeSportsBackground";
import Link from "next/link";
import {
  Trophy,
  Sparkles,
  Shield,
  ArrowRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  Users,
  Target,
  Medal,
  Award,
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const dates = await getMemberRegistrationDates();
  const now = new Date();
  let isRegistrationClosed = false;
  let hasDateSet = false;

  if (dates.start && dates.end) {
    hasDateSet = true;
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    isRegistrationClosed = now < start || now > end;
  }

  const SPORTS = [
    { icon: "⚽", name: "Football", tag: "Premier Season" },
    { icon: "🏏", name: "Cricket", tag: "National Glory" },
    { icon: "🏸", name: "Badminton", tag: "Indoor Racquet" },
    { icon: "🏓", name: "Table Tennis", tag: "Fast Pace" },
    { icon: "♟️", name: "Chess", tag: "Mind Sports" },
    { icon: "🏀", name: "Basketball", tag: "Court Action" },
    { icon: "🏐", name: "Volleyball", tag: "Team Play" },
    { icon: "🎮", name: "E-Sports", tag: "FIFA & Valorant" },
    { icon: "🏃", name: "Athletics", tag: "Track & Field" },
    { icon: "🎯", name: "Carrom", tag: "Precision" },
  ];

  const STEPS = [
    { icon: "🔑", label: "Sign In", desc: "Login with Google email" },
    { icon: "📝", label: "Student Details", desc: "ID, Dept & Sports picks" },
    { icon: "📱", label: "bKash 200 Tk", desc: "Education fee -> Primeasia" },
    { icon: "🎟️", label: "Get Pass", desc: "Instant 3D digital pass" },
  ];

  return (
    <main className="min-h-screen flex flex-col" style={{ position: "relative", overflowX: "hidden" }}>
      {/* 3D WebGL Sports Universe with Streaming Starfield and World Motion */}
      <ThreeSportsBackground />

      {/* Navigation Header */}
      <nav
        className="glass-card mx-3 sm:mx-4 mt-3 sm:mt-4 px-4 sm:px-6 py-3.5 flex items-center justify-between"
        style={{ borderRadius: "16px", position: "relative", zIndex: 10 }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 0 20px rgba(245,158,11,0.6)",
              flexShrink: 0,
            }}
          >
            ⚽
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: "14px", color: "#ffffff", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              Primeasia University
            </div>
            <div style={{ fontSize: "10.5px", color: "#fbbf24", fontWeight: 800, letterSpacing: "0.06em" }}>
              GAMES AND SPORTS CLUB (PaUGSC)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button type="submit" className="btn-outline" style={{ fontSize: "12.5px", padding: "9px 18px" }}>
              Sign In with Google
            </button>
          </form>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="flex-1 flex flex-col items-center justify-center px-4 py-14 sm:py-20 text-center"
        style={{ position: "relative", zIndex: 5 }}
      >
        {/* Luminous Pulsing Arena Halo Rings */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "740px",
            height: "740px",
            border: "1.5px solid rgba(251,191,36,0.2)",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 0,
            animation: "border-shimmer 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "520px",
            height: "520px",
            border: "1.5px solid rgba(56,189,248,0.25)",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 0,
            animation: "border-shimmer 4s ease-in-out infinite reverse",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>
          {/* Announcement Badge */}
          <div
            className="badge badge-gold animate-slide-up"
            style={{ marginBottom: "20px", display: "inline-flex", alignItems: "center", gap: "7px" }}
          >
            <Sparkles size={15} className="animate-trophy-bounce" />
            <span style={{ fontWeight: 800 }}>General Member Recruitment 2026 · All Departments Welcome</span>
          </div>

          {/* Main Headline */}
          <h1
            className="animate-slide-up"
            style={{
              fontSize: "clamp(2.5rem, 6.8vw, 4.6rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: "18px",
              letterSpacing: "-0.03em",
              animationDelay: "0.05s",
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <span className="gradient-text">Primeasia University</span>
            <br />
            <span style={{ color: "#ffffff", fontWeight: 900 }}>Games & Sports Club</span>
          </h1>

          <p
            className="animate-slide-up"
            style={{
              fontSize: "clamp(1rem, 2.3vw, 1.2rem)",
              color: "#e2e8f0",
              lineHeight: 1.7,
              maxWidth: "600px",
              margin: "0 auto 30px",
              animationDelay: "0.12s",
              textShadow: "0 2px 10px rgba(0,0,0,0.6)",
            }}
          >
            Register as an official club member for 2026. Represent Primeasia in football, cricket, badminton, esports & athletics. Get your 3D digital pass & downloadable membership slip!
          </p>

          {/* Countdown timer if dates set */}
          {hasDateSet && (
            <div className="animate-slide-up" style={{ animationDelay: "0.18s", marginBottom: "26px" }}>
              <CountdownTimer startDateStr={dates.start || ""} endDateStr={dates.end || ""} />
            </div>
          )}

          {/* CTA Action */}
          <div className="animate-slide-up" style={{ animationDelay: "0.24s", maxWidth: "440px", margin: "0 auto" }}>
            {isRegistrationClosed ? (
              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%" }}>
                <div
                  className="glass-card"
                  style={{
                    display: "inline-block",
                    padding: "16px 28px",
                    borderColor: "rgba(239,68,68,0.5)",
                    background: "rgba(239,68,68,0.15)",
                    color: "#fca5a5",
                    fontSize: "14.5px",
                    fontWeight: 700,
                    width: "100%",
                  }}
                >
                  🔒 Member registration window is currently closed.
                </div>
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/dashboard" });
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      fontSize: "13.5px",
                      textDecoration: "underline",
                      fontWeight: 600,
                    }}
                  >
                    Sign in to view your existing membership pass
                  </button>
                </form>
              </div>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
                style={{ width: "100%" }}
              >
                <button type="submit" className="btn-neon-gold" style={{ fontSize: "16px", padding: "16px 32px", width: "100%" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Register Now — Sign In with Email
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: "50px 16px 20px", maxWidth: "980px", margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
            fontWeight: 900,
            marginBottom: "8px",
            color: "#ffffff",
          }}
        >
          PaUGSC by the <span className="gradient-text">Numbers</span>
        </h2>
        <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: "14px", marginBottom: "32px" }}>
          Uniting athletes, passionate supporters, and sports leaders across Primeasia
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px" }}>
          {[
            { num: "10+", label: "Sports Disciplines", icon: "🎽" },
            { num: "200 ৳", label: "Membership Fee", icon: "📱" },
            { num: "2026", label: "Active Season", icon: "📅" },
            { num: "500+", label: "Student Athletes", icon: "⚽" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: "30px", marginBottom: "6px" }}>{s.icon}</div>
              <div
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                  fontWeight: 900,
                  color: "#fbbf24",
                  lineHeight: 1,
                  marginBottom: "6px",
                  textShadow: "0 0 12px rgba(245,158,11,0.3)",
                }}
              >
                {s.num}
              </div>
              <div style={{ fontSize: "11.5px", color: "#cbd5e1", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sports We Champion */}
      <section style={{ padding: "50px 16px 20px", maxWidth: "980px", margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 900, color: "#ffffff", marginBottom: "8px" }}>
            Sports We <span className="gradient-text">Champion</span>
          </h2>
          <p style={{ color: "#cbd5e1", fontSize: "14px" }}>
            From outdoor grounds to indoor arenas — compete in your favorite discipline
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
          {SPORTS.map((sport) => (
            <div key={sport.name} className="sport-card">
              <div style={{ fontSize: "36px", marginBottom: "6px", display: "block" }}>{sport.icon}</div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#ffffff", marginBottom: "2px" }}>
                {sport.name}
              </div>
              <div style={{ fontSize: "10px", color: "#fbbf24", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {sport.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to Register Steps */}
      <section style={{ padding: "50px 16px 20px", maxWidth: "880px", margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
            fontWeight: 900,
            marginBottom: "8px",
            color: "#ffffff",
          }}
        >
          How to <span className="gradient-text">Register</span>
        </h2>
        <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: "14px", marginBottom: "32px" }}>
          Four simple steps to claim your 2026 digital membership pass
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
          {STEPS.map((step, i) => (
            <div key={step.label} className="step-flow-card">
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "12px",
                  fontSize: "11px",
                  fontWeight: 900,
                  color: "#fbbf24",
                }}
              >
                0{i + 1}
              </div>
              <div style={{ fontSize: "34px", marginBottom: "8px" }}>{step.icon}</div>
              <div style={{ fontWeight: 800, fontSize: "14.5px", color: "#ffffff", marginBottom: "4px" }}>
                {step.label}
              </div>
              <div style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 500 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Member Benefits Grid */}
      <section style={{ padding: "50px 16px 70px", maxWidth: "980px", margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
            fontWeight: 900,
            marginBottom: "32px",
            color: "#ffffff",
          }}
        >
          Exclusive <span className="gradient-text">Member Benefits</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {[
            {
              icon: "🎟️",
              title: "Digital Holographic Pass",
              desc: "Get an interactive 3D digital member card and official downloadable PDF slip with your verified details.",
            },
            {
              icon: "⚽",
              title: "Tournament Eligibility",
              desc: "Direct eligibility to try out and represent Primeasia University in inter-university and departmental leagues.",
            },
            {
              icon: "🎽",
              title: "Club Jersey Allocation",
              desc: "Priority allocation for club sports kits and jerseys during official tournaments (recorded for later use).",
            },
            {
              icon: "🏅",
              title: "Certificates & Training",
              desc: "Access sports training sessions, coaching workshops, and official participation certificates.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card glow-border" style={{ padding: "22px" }}>
              <div style={{ fontSize: "34px", marginBottom: "10px" }}>{f.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: "16px", marginBottom: "6px", color: "#ffffff" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      {!isRegistrationClosed && (
        <section
          style={{
            padding: "20px 16px 70px",
            position: "relative",
            zIndex: 5,
            textAlign: "center",
          }}
        >
          <div
            className="glass-card-bright glow-border"
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              borderRadius: "24px",
              padding: "40px 24px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }} className="animate-float-bob">
              🏆
            </div>
            <h2 style={{ fontSize: "1.9rem", fontWeight: 900, marginBottom: "10px", color: "#ffffff" }}>
              Ready to Join the <span className="gradient-text">Squad?</span>
            </h2>
            <p style={{ color: "#e2e8f0", fontSize: "14px", marginBottom: "24px", lineHeight: 1.7 }}>
              Pay 200 BDT via bKash Education Fee (Primeasia University ➔ Others) and enter your Transaction ID to get your official PaUGSC member pass today!
            </p>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
              style={{ maxWidth: "380px", margin: "0 auto" }}
            >
              <button type="submit" className="btn-neon-gold" style={{ fontSize: "15px", padding: "14px 28px", width: "100%" }}>
                Register as Member Now
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px 16px",
          borderTop: "1px solid var(--glass-border)",
          color: "#94a3b8",
          fontSize: "13px",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div style={{ marginBottom: "6px", fontSize: "20px" }}>⚽ 🏏 🏸 🏓 ♟️ 🏀 🏐 🎮 🏃</div>
        © {new Date().getFullYear()} Primeasia University Games and Sports Club · All rights reserved
      </footer>
    </main>
  );
}
