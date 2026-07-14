// app/upload/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import StudentForm from "@/components/StudentForm";
import { getMySubmission } from "@/actions/submit-cv";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const isAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "");
  const existingSubmission = await getMySubmission();

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar isAdmin={isAdmin} />
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ marginBottom: "36px", textAlign: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", marginBottom: "10px" }}>
            {existingSubmission ? "Update Your Application" : "Executive Committee Application"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6 }}>
            {existingSubmission
              ? "You can update your details or replace your CV below."
              : "Fill in your details and upload your CV to apply for the Sports Club Executive Committee."}
          </p>
        </div>

        <StudentForm existingSubmission={existingSubmission ? {
          filename: existingSubmission.filename,
          blobUrl: existingSubmission.blobUrl,
          uploadedAt: existingSubmission.uploadedAt,
          semester: existingSubmission.semester,
          position: existingSubmission.position,
          fullName: existingSubmission.fullName,
          studentId: existingSubmission.studentId,
        } : null} />
      </main>
    </div>
  );
}
