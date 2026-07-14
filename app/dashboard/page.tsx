// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMySubmission } from "@/actions/submit-cv";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import { getSemesterLabel } from "@/lib/semester";
import { getRecruitmentDates } from "@/actions/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const submission = await getMySubmission();
  const isAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "");
  const firstName = session.user.name?.split(" ")[0] ?? "Student";

  const dates = await getRecruitmentDates();
  const now = new Date();
  let recruitmentPeriodLabel = "Recruitment Period Not Set";
  let isRecruitmentClosed = false;
  if (dates.start && dates.end) {
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    isRecruitmentClosed = now < start || now > end;
    recruitmentPeriodLabel = `Recruitment Window: ${start.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} to ${end.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar isAdmin={isAdmin} />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>

        {/* Welcome Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}
             className="animate-fade-in-up">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={64}
              height={64}
              style={{ borderRadius: "50%", border: "3px solid var(--gold)", flexShrink: 0 }}
            />
          )}
          <div>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Welcome back 👋
            </p>
            <h1 style={{ fontWeight: 800, fontSize: "28px", lineHeight: 1.2 }}>
              {firstName}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {session.user.email}
            </p>
          </div>
        </div>

        {/* Recruitment Window Notice */}
        <div className="glass-card animate-fade-in-up" style={{
          padding: "16px 20px", marginBottom: "24px",
          borderColor: isRecruitmentClosed ? "rgba(239, 68, 68, 0.2)" : "rgba(201, 162, 39, 0.2)",
          background: isRecruitmentClosed ? "rgba(239, 68, 68, 0.04)" : "rgba(201, 162, 39, 0.04)",
          color: isRecruitmentClosed ? "#fca5a5" : "var(--gold)",
          fontSize: "14px", fontWeight: 600, display: "flex", gap: "8px", alignItems: "center"
        }}>
          <span>📅</span> <span>{recruitmentPeriodLabel}</span>
          {isRecruitmentClosed && <span style={{ marginLeft: "auto", fontSize: "11px", background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "2px 8px", borderRadius: "4px" }}>Closed</span>}
        </div>

        {/* Status Card */}
        {submission ? (
          <div className="glass-card animate-fade-in-up" style={{
            padding: "28px",
            borderColor: "rgba(34, 197, 94, 0.3)",
            background: "rgba(34, 197, 94, 0.04)",
            marginBottom: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                          flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: "18px", marginBottom: "6px" }}>
                  ✅ Application Submitted
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  Your application is under review.
                </p>
              </div>
              {isRecruitmentClosed ? (
                <span className="badge badge-gold" style={{ fontSize: "12px", padding: "8px 16px" }}>
                  🔒 Updates Closed
                </span>
              ) : (
                <Link href="/upload" className="btn-outline" style={{ fontSize: "13px" }}>
                  🔄 Update Application
                </Link>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
              {[
                { label: "Position", value: submission.position, icon: "🎯" },
                { label: "Semester", value: getSemesterLabel(submission.semester), icon: "🎓" },
                { label: "CV File", value: submission.filename, icon: "📄" },
                {
                  label: "Submitted",
                  value: new Date(submission.uploadedAt).toLocaleDateString("en-GB",
                    { day: "2-digit", month: "short", year: "numeric" }),
                  icon: "📅"
                },
              ].map(item => (
                <div key={item.label} className="glass-card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "20px", marginBottom: "8px" }}>{item.icon}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600,
                                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: "14px", fontWeight: 600, color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card animate-fade-in-up" style={{
            padding: "48px", textAlign: "center", marginBottom: "24px",
            borderColor: isRecruitmentClosed ? "rgba(239, 68, 68, 0.2)" : "rgba(201, 162, 39, 0.2)"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            <h2 style={{ fontWeight: 700, fontSize: "20px", marginBottom: "10px" }}>
              No Application Yet
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "28px" }}>
              {isRecruitmentClosed
                ? "Recruitment is closed for this semester. You cannot start a new application."
                : "You haven't submitted your application. Start now to apply for the Executive Committee."}
            </p>
            {!isRecruitmentClosed && (
              <Link href="/upload" className="btn-gold">
                Start Your Application →
              </Link>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {isRecruitmentClosed ? (
            <div className="glass-card glow-border" style={{
              padding: "22px", opacity: 0.6, cursor: "not-allowed"
            }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>🔒</div>
              <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>Application Closed</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Recruitment portal is closed. Updates are locked.
              </p>
            </div>
          ) : (
            <Link href="/upload" style={{ textDecoration: "none" }}>
              <div className="glass-card glow-border transition-transform duration-200 hover:-translate-y-1" style={{
                padding: "22px", cursor: "pointer"
              }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                  {submission ? "✏️" : "📝"}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>
                  {submission ? "Update Application" : "Apply Now"}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {submission ? "Replace your CV or update your details." : "Fill in your details and upload your CV."}
                </p>
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <div className="glass-card glow-border transition-transform duration-200 hover:-translate-y-1" style={{
                padding: "22px", cursor: "pointer",
                borderColor: "rgba(201, 162, 39, 0.3)"
              }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>⚙️</div>
                <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>Admin Panel</h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  View all applications, download CVs.
                </p>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
