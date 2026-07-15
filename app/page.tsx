import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getRecruitmentDates } from "@/actions/admin";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const dates = await getRecruitmentDates();
  const now = new Date();
  let recruitmentPeriodLabel = "Recruitment Period Not Set";
  let isRecruitmentClosed = true;
  if (dates.start && dates.end) {
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    isRecruitmentClosed = now < start || now > end;
    recruitmentPeriodLabel = `Recruitment Window: ${start.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} to ${end.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between"
           style={{ borderRadius: "14px" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: "10px",
            background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", fontWeight: "800", color: "var(--navy)"
          }}>P</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Primeasia University
            </div>
            <div style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 600 }}>
              Games and Sports Club
            </div>
          </div>
        </div>
        <form action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/dashboard" });
        }}>
          <button type="submit" className="btn-outline" style={{ fontSize: "13px", padding: "8px 18px" }}>
            Sign In
          </button>
        </form>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* Decorative ring */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px", height: "600px",
          border: "1px solid rgba(201,162,39,0.07)",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "400px", height: "400px",
          border: "1px solid rgba(201,162,39,0.05)",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "720px", margin: "0 auto" }}
             className="animate-fade-in-up">
          {/* Badge */}
          <div className="badge badge-gold" style={{ marginBottom: "24px", display: "inline-flex" }}>
            <span>🏆</span>
            <span>Executive Committee Recruitment 2026</span>
          </div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "20px",
            letterSpacing: "-0.02em"
          }}>
            <span className="gold-text">Primeasia University</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>Games and Sports Club</span>
          </h1>

          {/* Recruitment Date Range Label */}
          <div className="glass-card" style={{
            display: "inline-block", padding: "8px 16px", marginBottom: "24px",
            borderColor: isRecruitmentClosed ? "rgba(239,68,68,0.2)" : "rgba(201,162,39,0.2)",
            background: isRecruitmentClosed ? "rgba(239,68,68,0.04)" : "rgba(201,162,39,0.04)",
            color: isRecruitmentClosed ? "#fca5a5" : "var(--gold)",
            fontSize: "13.5px", fontWeight: 600
          }}>
            <span>📅 {recruitmentPeriodLabel}</span>
          </div>

          <p style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "540px",
            margin: "0 auto 40px"
          }}>
            Be part of something great. Apply for the Executive Committee and
            lead the future of sports at Primeasia University.
          </p>

          {/* CTA */}
          {isRecruitmentClosed ? (
            <div className="glass-card" style={{
              display: "inline-block", padding: "16px 32px",
              borderColor: "rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.06)",
              color: "#fca5a5", fontSize: "15px", fontWeight: 600
            }}>
              🔒 Applications are currently closed. Please check back during the active recruitment window.
            </div>
          ) : (
            <form action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}>
              <button type="submit" className="btn-gold animate-pulse-glow"
                      style={{ fontSize: "17px", padding: "16px 36px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 16px 80px", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {[
            {
              icon: "🎯",
              title: "Four Key Positions",
              desc: "Apply for President, Vice President, General Secretary, or Treasurer — all with equal opportunities.",
            },
            {
              icon: "⭐",
              title: "Priority for Seniors",
              desc: "Students from 7th to 12th semester receive priority consideration for executive roles.",
            },
            {
              icon: "📄",
              title: "Simple Application",
              desc: "Fill in your details and upload your CV (PDF, max 5MB). You can replace it anytime before the deadline.",
            },
            {
              icon: "🏅",
              title: "Physical Interview",
              desc: "Shortlisted candidates will be invited for an assessment in front of all university stakeholders.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card glow-border" style={{ padding: "24px" }}>
              <div style={{ fontSize: "32px", marginBottom: "14px" }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: "16px", marginBottom: "8px", color: "var(--text-primary)" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "24px 16px",
        borderTop: "1px solid var(--glass-border)",
        color: "var(--text-muted)", fontSize: "13px"
      }}>
        © {new Date().getFullYear()} Primeasia University Games and Sports Club. All rights reserved.
      </footer>
    </main>
  );
}
