// app/upload/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import StudentForm from "@/components/StudentForm";
import { getMySubmission } from "@/actions/submit-cv";
import { getRecruitmentDates } from "@/actions/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const isAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "");
  
  // Date check
  const dates = await getRecruitmentDates();
  const now = new Date();
  let isRecruitmentClosed = true;
  if (dates.start && dates.end) {
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    isRecruitmentClosed = now < start || now > end;
  }

  const existingSubmission = await getMySubmission();

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar isAdmin={isAdmin} />
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 20px" }}>
        {isRecruitmentClosed ? (
          <div className="glass-card animate-fade-in-up" style={{ padding: "48px", textAlign: "center", borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.04)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <h1 style={{ fontWeight: 800, fontSize: "24px", marginBottom: "12px", color: "#fca5a5" }}>
              Recruitment is Closed
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "28px", lineHeight: 1.6 }}>
              The application deadline has passed or recruitment has not started yet. New submissions and updates are currently locked.
            </p>
            <Link href="/dashboard" className="btn-gold">
              ← Return to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "36px", textAlign: "center" }}>
              <h1 style={{ fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", marginBottom: "10px" }}>
                {existingSubmission ? "Update Your Application" : "Executive Committee Application"}
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6 }}>
                {existingSubmission
                  ? "You can update your details or replace your CV below."
                  : "Fill in your details and upload your CV to apply for the Games and Sports Club Executive Committee."}
              </p>
            </div>

            <StudentForm existingSubmission={existingSubmission ? {
              id: existingSubmission.id,
              filename: existingSubmission.filename,
              blobUrl: existingSubmission.blobUrl,
              uploadedAt: existingSubmission.uploadedAt,
              semester: existingSubmission.semester,
              position: existingSubmission.position,
              fullName: existingSubmission.fullName,
              studentId: existingSubmission.studentId,
              phone: existingSubmission.phone,
              department: existingSubmission.department,
              cgpa: existingSubmission.cgpa,
              experienceDetails: existingSubmission.experienceDetails,
              whyAppropriate: existingSubmission.whyAppropriate,
            } : null} />
          </>
        )}
      </main>
    </div>
  );
}
