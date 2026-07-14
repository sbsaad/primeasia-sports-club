// app/admin/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminTable, { type SubmissionRow } from "@/components/AdminTable";

import { getAllSubmissions, getRecruitmentDates } from "@/actions/admin";

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

  // Fetch all submissions and application dates using server actions
  const rows = await getAllSubmissions();
  const dates = await getRecruitmentDates();

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

        <AdminTable rows={rows as SubmissionRow[]} initialDates={dates} />
      </main>
    </div>
  );
}
