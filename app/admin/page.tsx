// app/admin/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminMemberTable from "@/components/AdminMemberTable";
import { getAllMembers, getRegistrationSettings } from "@/actions/admin";
import { Shield, Sparkles } from "lucide-react";

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

  // Fetch all members & settings
  const members = await getAllMembers();
  const settings = await getRegistrationSettings();

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar isAdmin={true} />
      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div
            className="badge badge-gold"
            style={{ marginBottom: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Shield size={14} />
            <span>Admin Command Center</span>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", marginBottom: "8px", color: "var(--text-primary)" }}>
            Club <span className="gradient-text">Members Management</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14.5px", maxWidth: "600px" }}>
            Verify bKash transactions, filter by department or sport, and export detailed member rosters to Excel (.xlsx) or PDF.
          </p>
        </div>

        <AdminMemberTable rows={members} initialSettings={settings} />
      </main>
    </div>
  );
}
