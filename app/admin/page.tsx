// app/admin/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cvSubmissions, users } from "@/lib/db/schema";
import Navbar from "@/components/Navbar";
import AdminTable, { type SubmissionRow } from "@/components/AdminTable";
import { eq } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const isAdmin = ADMIN_EMAILS.includes(session.user.email.toLowerCase());
  if (!isAdmin) redirect("/dashboard");

  // Fetch all submissions with joined user data
  const rows = await db
    .select({
      id: cvSubmissions.id,
      fullName: cvSubmissions.fullName,
      studentId: cvSubmissions.studentId,
      phone: cvSubmissions.phone,
      position: cvSubmissions.position,
      semester: cvSubmissions.semester,
      blobUrl: cvSubmissions.blobUrl,
      filename: cvSubmissions.filename,
      uploadedAt: cvSubmissions.uploadedAt,
      userEmail: users.email,
      userAvatar: users.avatar,
    })
    .from(cvSubmissions)
    .innerJoin(users, eq(cvSubmissions.userId, users.id))
    .orderBy(cvSubmissions.uploadedAt);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar isAdmin={true} />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div className="badge badge-gold" style={{ marginBottom: "12px" }}>
            ⚙️ Admin Panel
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", marginBottom: "8px" }}>
            All Applications
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Browse, search, and download submitted CVs for all positions.
            The ZIP download organizes files by position folder.
          </p>
        </div>

        <AdminTable rows={rows as SubmissionRow[]} />
      </main>
    </div>
  );
}
