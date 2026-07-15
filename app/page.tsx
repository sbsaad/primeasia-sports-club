import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRecruitmentDates } from "@/actions/admin";
import CountdownTimer from "@/components/CountdownTimer";
import SportsParticles from "@/components/SportsParticles";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const dates = await getRecruitmentDates();
  const now = new Date();
  let isRecruitmentClosed = true;
  let hasDateSet = false;

  if (dates.start && dates.end) {
    hasDateSet = true;
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    isRecruitmentClosed = now < start || now > end;
  }

  const SPORTS = [
    { icon: "⚽", name: "Football", tag: "FIFA Season" },
    { icon: "🏏", name: "Cricket", tag: "National Sport" },
    { icon: "🏸", name: "Badminton", tag: "Indoor" },
    { icon: "🏓", name: "Table Tennis", tag: "Indoor" },
    { icon: "🥊", name: "Boxing", tag: "Fitness" },
    { icon: "🏃", name: "Athletics", tag: "Track" },
  ];

  const STEPS = [
    { icon: "🔑", label: "Sign In", desc: "Google account" },
    { icon: "📝", label: "Fill Form", desc: "Your details" },
    { icon: "📎", label: "Upload CV", desc: "PDF, max 5MB" },
    { icon: "✅", label: "Done!", desc: "Await shortlist" },
  ];

  const MARQUEE_TEXT = [
    "⚽ FIFA WORLD CUP SEASON",
    "🏏 CRICKET LEGENDS",
    "🏆 JOIN PAUSC 2026",
    "⚽ THE BEAUTIFUL GAME",
    "🎽 REPRESENT YOUR UNIVERSITY",
    "🏸 BADMINTON CHAMPIONS",
    "🏓 TABLE TENNIS MASTERS",
    "🥊 BOXING EXCELLENCE",
    "🏃 ATHLETICS GLORY",
    "🌟 BECOME AN EXECUTIVE",
  ];

  return (
    <main className="min-h-screen flex flex-col" style={{ position: "relative", overflow: "hidden" }}>
      {/* Sports particle background */}
      <SportsParticles />

      {/* Navigation */}
      <nav className="glass-card mx-4 mt-4 px-5 py-3 flex items-center justify-between"
           style={{ borderRadius: "14px", position: "relative", zIndex: 10 }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 44, height: 44, borderRadius: "12px",
            background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", boxShadow: "0 0 16px rgba(201,162,39,0.4)",
            flexShrink: 0,
          }}>⚽</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Primeasia University
            </div>
            <div style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700, letterSpacing: "0.05em" }}>
              GAMES AND SPORTS CLUB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <form action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}>
            <button type="submit" className="btn-outline" style={{ fontSize: "12px", padding: "7px 16px" }}>
              Sign In
            </button>
          </form>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center"
               style={{ position: "relative", zIndex: 5 }}>

        {/* Decorative pulsing rings */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px", height: "700px",
          border: "1px solid rgba(201,162,39,0.06)",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          animation: "border-shimmer 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "480px", height: "480px",
          border: "1px solid rgba(201,162,39,0.04)",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          animation: "border-shimmer 4s ease-in-out infinite reverse",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "780px", margin: "0 auto" }}>
          {/* Recruitment badge */}
          <div className="badge badge-gold animate-slide-up" style={{ marginBottom: "20px", display: "inline-flex" }}>
            <span className="animate-trophy-bounce" style={{ display: "inline-block" }}>🏆</span>
            <span>Executive Committee Recruitment 2026</span>
          </div>

          {/* Main headline */}
          <h1 className="animate-slide-up" style={{
            fontSize: "clamp(2.6rem, 6.5vw, 4.2rem)",
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: "12px",
            letterSpacing: "-0.03em",
            animationDelay: "0.05s",
          }}>
            <span className="gradient-text">Primeasia University</span>
            <br />
            <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
              Games & Sports Club
            </span>
          </h1>

          <p className="animate-slide-up" style={{
            fontSize: "clamp(0.95rem, 2.2vw, 1.15rem)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            maxWidth: "520px",
            margin: "0 auto 28px",
            animationDelay: "0.12s",
          }}>
            Be part of something great. Lead football, cricket & more — apply for the
            Executive Committee and shape the future of university sports.
          </p>

          {/* Countdown timer */}
          <div className="animate-slide-up" style={{ animationDelay: "0.18s" }}>
            <CountdownTimer startDateStr={dates.start || ""} endDateStr={dates.end || ""} />
          </div>

          {/* CTA */}
          <div className="animate-slide-up" style={{ animationDelay: "0.24s" }}>
            {isRecruitmentClosed ? (
              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div className="glass-card" style={{
                  display: "inline-block", padding: "16px 32px",
                  borderColor: "rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.06)",
                  color: "#fca5a5", fontSize: "15px", fontWeight: 600
                }}>
                  🔒 {hasDateSet ? "Applications not yet open. See countdown above." : "Recruitment window has not been set yet. Check back soon!"}
                </div>
                {/* Still allow sign in */}
                <form action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}>
                  <button type="submit" style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", fontSize: "13px", textDecoration: "underline"
                  }}>
                    Sign in to check your application status
                  </button>
                </form>
              </div>
            ) : (
              <form action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}>
                <button type="submit" className="btn-neon-gold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Apply Now — Sign in with Google
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===== MARQUEE STRIP ===== */}
      <div style={{
        width: "100%", position: "relative", zIndex: 5,
        borderTop: "1px solid rgba(201,162,39,0.1)",
        borderBottom: "1px solid rgba(201,162,39,0.1)",
        background: "rgba(201,162,39,0.03)",
        padding: "12px 0",
        overflow: "hidden",
      }}>
        <div className="marquee-wrapper">
          <div className="marquee-inner" style={{ gap: "48px" }}>
            {[...MARQUEE_TEXT, ...MARQUEE_TEXT].map((text, i) => (
              <span key={i} style={{
                fontSize: "12px", fontWeight: 700, color: "var(--gold)",
                letterSpacing: "0.12em", textTransform: "uppercase",
                marginRight: "48px", flexShrink: 0,
              }}>
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== STATS SECTION ===== */}
      <section style={{ padding: "70px 16px 20px", maxWidth: "960px", margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
          fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)"
        }}>
          PaUSC by the <span className="gradient-text">Numbers</span>
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "14px", marginBottom: "40px" }}>
          A proud legacy of sports excellence at Primeasia University
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
          {[
            { num: "10+", label: "Sports Disciplines", icon: "🎽" },
            { num: "5", label: "Executive Positions", icon: "🏆" },
            { num: "2026", label: "Recruitment Season", icon: "📅" },
            { num: "500+", label: "University Athletes", icon: "⚽" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
              <div style={{
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900,
                color: "var(--gold)", lineHeight: 1, marginBottom: "6px",
              }}>{s.num}</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SPORTS WE COVER ===== */}
      <section style={{ padding: "60px 16px 20px", maxWidth: "960px", margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{
            fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 800,
            color: "var(--text-primary)", marginBottom: "8px"
          }}>
            Sports We <span className="gradient-text">Champion</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Football, cricket & more — representing Primeasia with pride
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px" }}>
          {SPORTS.map((sport) => (
            <div key={sport.name} className="sport-card">
              <div style={{ fontSize: "42px", marginBottom: "10px", display: "block" }}
                   className={sport.name === "Football" ? "animate-float-bob" : ""}>
                {sport.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
                {sport.name}
              </div>
              <div style={{
                fontSize: "10px", color: "var(--gold)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.05em"
              }}>
                {sport.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW TO APPLY STEPS ===== */}
      <section style={{ padding: "60px 16px 20px", maxWidth: "860px", margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
          fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)"
        }}>
          How to <span className="gradient-text">Apply</span>
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "14px", marginBottom: "40px" }}>
          Four simple steps. Takes less than 10 minutes.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", position: "relative" }}>
          {STEPS.map((step, i) => (
            <div key={step.label} className="step-flow-card">
              {/* Step number */}
              <div style={{
                position: "absolute", top: "10px", right: "12px",
                fontSize: "11px", fontWeight: 800, color: "rgba(201,162,39,0.3)",
              }}>0{i + 1}</div>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>{step.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
                {step.label}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section style={{ padding: "60px 16px 80px", maxWidth: "960px", margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
          fontWeight: 800, marginBottom: "40px", color: "var(--text-primary)"
        }}>
          Why <span className="gradient-text">PaUSC?</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {[
            {
              icon: "🎯",
              title: "Five Key Positions",
              desc: "Apply for President, Vice President, General Secretary, Treasurer, or Joint Secretary — all equal opportunities.",
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
              desc: "Shortlisted candidates will be invited for an in-person assessment in front of university stakeholders.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card glow-border" style={{ padding: "24px", transition: "transform 0.3s, box-shadow 0.3s" }}
                 onMouseEnter={undefined}>
              <div style={{ fontSize: "34px", marginBottom: "14px" }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: "16px", marginBottom: "8px", color: "var(--text-primary)" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA BOTTOM BANNER ===== */}
      {!isRecruitmentClosed && (
        <section style={{
          padding: "60px 16px", position: "relative", zIndex: 5, textAlign: "center",
          background: "linear-gradient(180deg, transparent, rgba(201,162,39,0.04) 40%, transparent)",
        }}>
          <div style={{
            maxWidth: "600px", margin: "0 auto",
            background: "rgba(10,22,40,0.6)",
            border: "1px solid rgba(201,162,39,0.25)",
            borderRadius: "24px", padding: "48px 32px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 60px rgba(201,162,39,0.08)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }} className="animate-float-bob">🏆</div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)" }}>
              Ready to <span className="gradient-text">Lead?</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px", lineHeight: 1.7 }}>
              Join the Executive Committee and make your mark. The football pitches, cricket grounds,
              and sports halls of Primeasia University are waiting for your leadership.
            </p>
            <form action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}>
              <button type="submit" className="btn-neon-gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Apply Now — It&apos;s Free
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "24px 16px",
        borderTop: "1px solid var(--glass-border)",
        color: "var(--text-muted)", fontSize: "13px",
        position: "relative", zIndex: 5,
      }}>
        <div style={{ marginBottom: "6px", fontSize: "20px" }}>⚽ 🏏 🏸 🏓 🥊 🏃</div>
        © {new Date().getFullYear()} Primeasia University Games and Sports Club · All rights reserved
      </footer>
    </main>
  );
}
