// components/AdminMemberTable.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { AdminMemberRow, AdminDonationRow } from "@/actions/admin";
import {
  updateMemberPaymentStatus,
  verifyMemberRenewal,
  deleteMember,
  saveClubFullSettings,
  updateDonationStatus,
  revokeAllMemberships,
} from "@/actions/admin";
import { exportMembersToExcel, exportFinancialAuditToExcel } from "@/lib/export-excel";
import {
  downloadAdminRosterPdf,
  downloadMemberSlipPdf,
  downloadIdCardPdf,
  downloadFinancialAuditPdf,
} from "@/lib/export-pdf";
import { DEPARTMENTS, SPORTS_OPTIONS, DONATION_CATEGORIES } from "@/lib/validations";
import HolographicMemberCard from "./HolographicMemberCard";
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  Trash2,
  Eye,
  Calendar,
  Copy,
  Check,
  Flag,
  HeartHandshake,
  Settings as SettingsIcon,
  Users,
  Landmark,
  CircleDollarSign,
  PieChart,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface Props {
  rows: AdminMemberRow[];
  donations?: AdminDonationRow[];
  initialSettings?: {
    start?: string;
    end?: string;
    validityLabel?: string;
    durationMonths?: number;
    membershipFee?: string;
    fee?: string;
    instructions?: string;
  };
}

const toLocalDateTimeLocal = (isoString?: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminMemberTable({ rows, donations = [], initialSettings }: Props) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"members" | "donations" | "treasury" | "settings">("members");

  // Members filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [sportFilter, setSportFilter] = useState<string>("All");
  const [flagFilter, setFlagFilter] = useState<boolean>(false);

  // Donations filters
  const [donationSearch, setDonationSearch] = useState("");
  const [donationStatusFilter, setDonationStatusFilter] = useState<string>("All");
  const [donationCategoryFilter, setDonationCategoryFilter] = useState<string>("All");

  // Club & Validity settings state
  const [startDate, setStartDate] = useState(toLocalDateTimeLocal(initialSettings?.start));
  const [endDate, setEndDate] = useState(toLocalDateTimeLocal(initialSettings?.end));
  const [validityLabel, setValidityLabel] = useState(initialSettings?.validityLabel || "SEASON 2026-2027");
  const [durationMonths, setDurationMonths] = useState<number>(initialSettings?.durationMonths || 12);
  const [membershipFee, setMembershipFee] = useState(initialSettings?.membershipFee || "200");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  // Inspect Modal
  const [selectedMember, setSelectedMember] = useState<AdminMemberRow | null>(null);

  // Revoke Modal
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeConfirmText, setRevokeConfirmText] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  const memFeeNumber = parseFloat(membershipFee || "200") || 200;

  // Members Filtering logic
  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.studentId.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.transactionId.toLowerCase().includes(q) ||
      r.membershipNumber.toLowerCase().includes(q) ||
      (r.receiptStudentId && r.receiptStudentId.toLowerCase().includes(q));
    const matchStatus = statusFilter === "All" || r.paymentStatus === statusFilter;
    const matchFlag = !flagFilter || r.isFlagged || (r.receiptStudentId && r.receiptStudentId !== r.studentId);
    const matchDept =
      deptFilter === "All" ||
      r.department.toLowerCase().includes(deptFilter.toLowerCase()) ||
      deptFilter.toLowerCase().includes(r.department.toLowerCase()) ||
      (() => {
        const filterCode = deptFilter.match(/\(([^)]+)\)/)?.[1]?.toLowerCase();
        const rowCode = r.department.match(/\(([^)]+)\)/)?.[1]?.toLowerCase();
        if (filterCode && rowCode && filterCode === rowCode) return true;
        const filterBase = deptFilter.replace(/\s*\([^)]*\)/, "").trim().toLowerCase();
        const rowBase = r.department.replace(/\s*\([^)]*\)/, "").trim().toLowerCase();
        return (
          filterBase.length > 2 &&
          (filterBase === rowBase || rowBase.includes(filterBase) || filterBase.includes(rowBase))
        );
      })();

    let matchSport = true;
    if (sportFilter !== "All") {
      try {
        const parsed = JSON.parse(r.sportsInterests);
        matchSport =
          Array.isArray(parsed) &&
          (parsed.includes(sportFilter) ||
            parsed.some((x: string) => x.toLowerCase().includes(sportFilter.toLowerCase())));
      } catch {
        matchSport = r.sportsInterests.toLowerCase().includes(sportFilter.toLowerCase());
      }
    }

    return matchSearch && matchStatus && matchDept && matchSport && matchFlag;
  });

  const verifiedCount = rows.filter((r) => r.paymentStatus === "verified").length;
  const pendingCount = rows.filter((r) => r.paymentStatus === "pending" || r.paymentStatus === "pending_renewal").length;
  const flaggedCount = rows.filter((r) => r.isFlagged || (r.receiptStudentId && r.receiptStudentId !== r.studentId)).length;
  const totalCollectedBDT = verifiedCount * memFeeNumber;

  // Donations Filtering
  const filteredDonations = donations.filter((d) => {
    const q = donationSearch.toLowerCase();
    const matchSearch =
      !q ||
      d.donorName.toLowerCase().includes(q) ||
      d.donorStudentId.toLowerCase().includes(q) ||
      d.donorEmail.toLowerCase().includes(q) ||
      d.donorPhone.includes(q) ||
      d.transactionId.toLowerCase().includes(q);

    const matchStatus = donationStatusFilter === "All" || d.status === donationStatusFilter;
    const matchCategory = donationCategoryFilter === "All" || d.category === donationCategoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  const verifiedDonationAmount = donations
    .filter((d) => d.status === "verified")
    .reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

  const pendingDonationAmount = donations
    .filter((d) => d.status === "pending")
    .reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

  // Financial Grand Totals
  const grandTotalVerifiedTreasury = totalCollectedBDT + verifiedDonationAmount;
  const totalPendingRequests = (pendingCount * memFeeNumber) + pendingDonationAmount;

  // Category breakdown for Treasury tab
  const treasuryCategoryBreakdown: { [cat: string]: { verifiedCount: number; verifiedAmt: number; pendingCount: number; pendingAmt: number } } = {
    "Membership Registration": { verifiedCount: verifiedCount, verifiedAmt: totalCollectedBDT, pendingCount: pendingCount, pendingAmt: pendingCount * memFeeNumber },
    "Tournament & Inter-University Fund": { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 },
    "Jersey & Sports Equipment": { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 },
    "Training, Practice & Coaching": { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 },
    "General Club Expansion": { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 },
  };

  for (const d of donations) {
    const cat = d.category || "General Club Expansion";
    if (!treasuryCategoryBreakdown[cat]) {
      treasuryCategoryBreakdown[cat] = { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 };
    }
    const amt = parseFloat(d.amount) || 0;
    if (d.status === "verified") {
      treasuryCategoryBreakdown[cat].verifiedCount += 1;
      treasuryCategoryBreakdown[cat].verifiedAmt += amt;
    } else if (d.status === "pending") {
      treasuryCategoryBreakdown[cat].pendingCount += 1;
      treasuryCategoryBreakdown[cat].pendingAmt += amt;
    }
  }

  const handleUpdateStatus = async (
    id: string,
    newStatus: "pending" | "verified" | "rejected" | "expired" | "pending_renewal"
  ) => {
    setUpdatingId(id);
    try {
      await updateMemberPaymentStatus(id, newStatus);
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember({ ...selectedMember, paymentStatus: newStatus });
      }
    } catch (err: unknown) {
      alert("Failed to update status: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyRenewal = async (id: string) => {
    setUpdatingId(id);
    try {
      await verifyMemberRenewal(id);
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember({ ...selectedMember, paymentStatus: "verified" });
      }
    } catch (err: unknown) {
      alert("Failed to verify renewal: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateDonation = async (
    donationId: string,
    status: "verified" | "rejected" | "pending"
  ) => {
    setUpdatingId(donationId);
    try {
      await updateDonationStatus(donationId, status);
    } catch (err: unknown) {
      alert("Failed to update donation status: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete member registration for ${name}?`)) {
      return;
    }
    try {
      await deleteMember(id);
      if (selectedMember?.id === id) setSelectedMember(null);
    } catch (err: unknown) {
      alert("Failed to delete member: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveFullSettings = async () => {
    setIsSavingSettings(true);
    setSettingsMessage("");
    try {
      const startIso = startDate ? new Date(startDate).toISOString() : "";
      const endIso = endDate ? new Date(endDate).toISOString() : "";
      await saveClubFullSettings({
        regStart: startIso,
        regEnd: endIso,
        validityLabel: validityLabel.trim(),
        durationMonths,
        membershipFee: membershipFee.trim(),
      });
      setSettingsMessage("✅ Club & Pass Validity Settings updated successfully! All registration fees reflect immediately.");
      setTimeout(() => setSettingsMessage(""), 4000);
    } catch {
      setSettingsMessage("❌ Failed to save settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRevokeAllMemberships = async () => {
    if (revokeConfirmText !== "REVOKE ALL FOR NEW SEASON") return;
    setIsRevoking(true);
    try {
      await revokeAllMemberships({
        newMembershipFee: membershipFee.trim(),
        newValidityLabel: validityLabel.trim(),
      });
      alert(`Success! All memberships have been reset to PENDING for ${validityLabel}. Members will now be prompted to pay ৳${membershipFee} BDT on their dashboard to reactivate.`);
      window.location.reload();
    } catch (err: unknown) {
      alert("Revocation failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsRevoking(false);
      setShowRevokeModal(false);
      setRevokeConfirmText("");
    }
  };

  const copyTrx = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrxId(trx);
    setTimeout(() => setCopiedTrxId(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          paddingBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: activeTab === "members" ? "rgba(245, 158, 11, 0.25)" : "rgba(255, 255, 255, 0.04)",
            border: activeTab === "members" ? "1.5px solid #fbbf24" : "1px solid rgba(255, 255, 255, 0.1)",
            color: activeTab === "members" ? "#fef08a" : "#cbd5e1",
          }}
        >
          <Users size={16} /> Members &amp; Athletes ({rows.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("donations")}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: activeTab === "donations" ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.04)",
            border: activeTab === "donations" ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
            color: activeTab === "donations" ? "#7dd3fc" : "#cbd5e1",
          }}
        >
          <HeartHandshake size={16} /> Club Donations &amp; Funds ({donations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("treasury")}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: activeTab === "treasury" ? "rgba(34, 197, 94, 0.25)" : "rgba(255, 255, 255, 0.04)",
            border: activeTab === "treasury" ? "1.5px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.1)",
            color: activeTab === "treasury" ? "#86efac" : "#cbd5e1",
          }}
        >
          <Landmark size={16} /> Treasury &amp; Financial Audit (BDT {grandTotalVerifiedTreasury.toLocaleString()})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: activeTab === "settings" ? "rgba(234, 179, 8, 0.2)" : "rgba(255, 255, 255, 0.04)",
            border: activeTab === "settings" ? "1.5px solid #eab308" : "1px solid rgba(255, 255, 255, 0.1)",
            color: activeTab === "settings" ? "#fef08a" : "#cbd5e1",
          }}
        >
          <SettingsIcon size={16} /> Validity &amp; Season Settings
        </button>
      </div>

      {/* ================= TAB 1: MEMBERS MANAGEMENT ================= */}
      {activeTab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <div className="glass-card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Total Registered
              </div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "var(--text-primary)", marginTop: "2px" }}>
                {rows.length}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>Members applied</div>
            </div>

            <div className="glass-card" style={{ padding: "16px 18px", borderColor: "rgba(34, 197, 94, 0.3)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#4ade80", textTransform: "uppercase" }}>
                Verified Members
              </div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#4ade80", marginTop: "2px" }}>
                {verifiedCount}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>Pass active</div>
            </div>

            <div className="glass-card" style={{ padding: "16px 18px", borderColor: "rgba(245, 158, 11, 0.3)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" }}>
                Pending Verification
              </div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#fbbf24", marginTop: "2px" }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>Awaiting check</div>
            </div>

            {/* 🚩 Flagged / Suspected Fake Metric */}
            <div
              className="glass-card"
              onClick={() => setFlagFilter(!flagFilter)}
              style={{
                padding: "16px 18px",
                borderColor: flaggedCount > 0 ? "rgba(239, 68, 68, 0.5)" : "rgba(255,255,255,0.1)",
                background: flagFilter ? "rgba(239, 68, 68, 0.18)" : undefined,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#f87171", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                <Flag size={12} color="#ef4444" /> Flagged / Suspect ID
              </div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#f87171", marginTop: "2px" }}>
                {flaggedCount}
              </div>
              <div style={{ fontSize: "11.5px", color: "#fca5a5", marginTop: "2px" }}>
                {flagFilter ? "Showing flagged only (Click to clear)" : "Click to filter flagged"}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "16px 18px", borderColor: "rgba(201, 162, 39, 0.3)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
                Fees Verified (BDT)
              </div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "var(--gold)", marginTop: "2px" }}>
                ৳{totalCollectedBDT.toLocaleString()}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>@ {membershipFee} BDT/member</div>
            </div>
          </div>

          {/* Search, Filters & Export */}
          <div
            className="glass-card"
            style={{
              padding: "12px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search Name, ID, TrxID, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "32px", fontSize: "12.5px", padding: "7px 10px 7px 32px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Department Dropdown Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Filter size={13} color="var(--text-muted)" />
                <select
                  className="input-field"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  style={{ width: "auto", minWidth: "130px", fontSize: "11.5px", padding: "5px 8px", background: "var(--navy-mid)" }}
                >
                  <option value="All">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sports Dropdown Filter */}
              <select
                className="input-field"
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                style={{ width: "auto", minWidth: "120px", fontSize: "11.5px", padding: "5px 8px", background: "var(--navy-mid)" }}
              >
                <option value="All">All Sports</option>
                {SPORTS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>

              {/* Flag Toggle Button */}
              <button
                type="button"
                onClick={() => setFlagFilter(!flagFilter)}
                style={{
                  background: flagFilter ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.1)",
                  border: flagFilter ? "1.5px solid #ef4444" : "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  padding: "5px 9px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Flag size={12} color="#ef4444" />
                {flagFilter ? "Flagged Only" : `🚩 (${flaggedCount})`}
              </button>

              {/* Status Filter Buttons */}
              <div style={{ display: "flex", background: "var(--navy-mid)", borderRadius: "8px", padding: "2px", border: "1px solid var(--glass-border)", flexWrap: "wrap" }}>
                {["All", "pending", "verified", "pending_renewal", "rejected"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      background: statusFilter === st ? "rgba(245, 158, 11, 0.25)" : "transparent",
                      color: statusFilter === st ? "#fbbf24" : "var(--text-muted)",
                      border: statusFilter === st ? "1px solid rgba(245, 158, 11, 0.4)" : "none",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.15s",
                    }}
                  >
                    {st === "All" ? "All" : st.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Export Buttons */}
              <button
                onClick={() => exportMembersToExcel(filtered)}
                className="btn-outline"
                style={{ padding: "5px 10px", fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <FileSpreadsheet size={13} color="#22c55e" /> Excel
              </button>
              <button
                onClick={() => downloadAdminRosterPdf(filtered)}
                className="btn-outline"
                style={{ padding: "5px 10px", fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <FileText size={13} color="#38bdf8" /> PDF
              </button>
            </div>
          </div>

          {/* Main Members Table */}
          {filtered.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>No members found</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ overflow: "hidden", padding: 0 }}>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>Member Name</th>
                      <th style={{ width: "15%" }}>Student ID</th>
                      <th style={{ width: "18%" }}>Department</th>
                      <th style={{ width: "15%" }}>bKash TrxID</th>
                      <th style={{ width: "12%" }}>Status</th>
                      <th style={{ width: "16%", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => {
                      const isRowVerified = m.paymentStatus === "verified";
                      const isRowRenewal = m.paymentStatus === "pending_renewal";
                      const isRowRejected = m.paymentStatus === "rejected";
                      const isRowFlagged = Boolean(
                        m.isFlagged || (m.receiptStudentId && m.receiptStudentId !== m.studentId)
                      );

                      return (
                        <tr
                          key={m.id}
                          style={{
                            background: isRowFlagged
                              ? "rgba(239, 68, 68, 0.08)"
                              : isRowRenewal
                              ? "rgba(56, 189, 248, 0.05)"
                              : undefined,
                          }}
                        >
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {m.userAvatar ? (
                                <Image
                                  src={m.userAvatar}
                                  alt={m.fullName}
                                  width={30}
                                  height={30}
                                  style={{ borderRadius: "50%", border: "1.5px solid var(--gold)", flexShrink: 0 }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    background: "var(--navy-mid)",
                                    border: "1.5px solid var(--gold)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    color: "var(--gold)",
                                    flexShrink: 0,
                                  }}
                                >
                                  {m.fullName[0]}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "13px" }}>
                                  {m.fullName}
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  {m.membershipNumber}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#ffffff", fontSize: "12.5px" }}>
                              {m.studentId}
                            </span>
                            {isRowFlagged && (
                              <div style={{ fontSize: "10.5px", color: "#f87171", fontWeight: 800, marginTop: "2px" }}>
                                🚩 Suspect ({m.receiptStudentId || "Mismatch"})
                              </div>
                            )}
                          </td>

                          <td>
                            <div style={{ fontSize: "12.5px", color: "#ffffff", fontWeight: 600 }}>{m.department}</div>
                            <div style={{ fontSize: "11px", color: "var(--gold)" }}>Sem {m.semester}</div>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ fontFamily: "monospace", color: "#f43f5e", fontWeight: 800, fontSize: "12.5px" }}>
                                {m.transactionId}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyTrx(m.transactionId)}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                              >
                                {copiedTrxId === m.transactionId ? <Check size={11} color="#22c55e" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: "10px",
                                textTransform: "uppercase",
                                background: isRowVerified
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : isRowRenewal
                                  ? "rgba(56, 189, 248, 0.2)"
                                  : isRowRejected
                                  ? "rgba(239, 68, 68, 0.2)"
                                  : "rgba(245, 158, 11, 0.2)",
                                color: isRowVerified
                                  ? "#86efac"
                                  : isRowRenewal
                                  ? "#7dd3fc"
                                  : isRowRejected
                                  ? "#fca5a5"
                                  : "#fef08a",
                                border: isRowVerified
                                  ? "1px solid rgba(34, 197, 94, 0.4)"
                                  : isRowRenewal
                                  ? "1px solid rgba(56, 189, 248, 0.4)"
                                  : isRowRejected
                                  ? "1px solid rgba(239, 68, 68, 0.4)"
                                  : "1px solid rgba(245, 158, 11, 0.4)",
                              }}
                            >
                              {m.paymentStatus.replace("_", " ")}
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              {isRowRenewal ? (
                                <button
                                  type="button"
                                  title="Approve Renewal"
                                  disabled={updatingId === m.id}
                                  onClick={() => handleVerifyRenewal(m.id)}
                                  style={{
                                    background: "rgba(56, 189, 248, 0.2)",
                                    border: "1px solid #38bdf8",
                                    color: "#7dd3fc",
                                    borderRadius: "6px",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                  }}
                                >
                                  ✓ Approve
                                </button>
                              ) : !isRowVerified ? (
                                <button
                                  type="button"
                                  title="Verify Payment"
                                  disabled={updatingId === m.id}
                                  onClick={() => handleUpdateStatus(m.id, "verified")}
                                  style={{
                                    background: "rgba(34, 197, 94, 0.2)",
                                    border: "1px solid #22c55e",
                                    color: "#4ade80",
                                    borderRadius: "6px",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                  }}
                                >
                                  ✓ Verify
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title="Set Pending"
                                  disabled={updatingId === m.id}
                                  onClick={() => handleUpdateStatus(m.id, "pending")}
                                  style={{
                                    background: "rgba(245, 158, 11, 0.15)",
                                    border: "1px solid #f59e0b",
                                    color: "#fbbf24",
                                    borderRadius: "6px",
                                    padding: "4px 6px",
                                    cursor: "pointer",
                                    fontSize: "10.5px",
                                  }}
                                >
                                  Pending
                                </button>
                              )}

                              {/* Inspect Button */}
                              <button
                                type="button"
                                title="View Member Card & Slip"
                                onClick={() => setSelectedMember(m)}
                                style={{
                                  background: "rgba(255, 255, 255, 0.08)",
                                  border: "1px solid rgba(255, 255, 255, 0.15)",
                                  borderRadius: "6px",
                                  padding: "4px 6px",
                                  color: "#cbd5e1",
                                  cursor: "pointer",
                                }}
                              >
                                <Eye size={13} />
                              </button>

                              {/* Individual Member Delete Button */}
                              <button
                                type="button"
                                title="Delete Member Record"
                                onClick={() => handleDelete(m.id, m.fullName)}
                                style={{
                                  background: "rgba(239, 68, 68, 0.12)",
                                  border: "1px solid rgba(239, 68, 68, 0.35)",
                                  borderRadius: "6px",
                                  padding: "4px 6px",
                                  color: "#f87171",
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: CLUB DONATIONS & FUNDS ================= */}
      {activeTab === "donations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Donation Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div className="glass-card" style={{ padding: "16px 18px", borderColor: "rgba(34, 197, 94, 0.3)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#4ade80", textTransform: "uppercase" }}>
                Total Verified Contributions
              </div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#4ade80", marginTop: "2px" }}>
                ৳{verifiedDonationAmount.toLocaleString()} BDT
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>Direct sports sponsorship</div>
            </div>

            <div className="glass-card" style={{ padding: "16px 18px", borderColor: "rgba(245, 158, 11, 0.3)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" }}>
                Pending Review
              </div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#fbbf24", marginTop: "2px" }}>
                ৳{pendingDonationAmount.toLocaleString()} BDT
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>Awaiting admin check</div>
            </div>

            <div className="glass-card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Total Donors &amp; Patrons
              </div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "var(--text-primary)", marginTop: "2px" }}>
                {donations.length}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>Contributions logged</div>
            </div>
          </div>

          {/* Donation Search & Filters */}
          <div
            className="glass-card"
            style={{
              padding: "12px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search Donor, Student ID, TrxID, Email..."
                value={donationSearch}
                onChange={(e) => setDonationSearch(e.target.value)}
                style={{ paddingLeft: "32px", fontSize: "12.5px", padding: "7px 10px 7px 32px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", background: "var(--navy-mid)", borderRadius: "8px", padding: "2px", border: "1px solid var(--glass-border)" }}>
                {["All", "pending", "verified", "rejected"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setDonationStatusFilter(st)}
                    style={{
                      background: donationStatusFilter === st ? "rgba(56, 189, 248, 0.25)" : "transparent",
                      color: donationStatusFilter === st ? "#7dd3fc" : "var(--text-muted)",
                      border: donationStatusFilter === st ? "1px solid rgba(56, 189, 248, 0.4)" : "none",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <select
                className="input-field"
                value={donationCategoryFilter}
                onChange={(e) => setDonationCategoryFilter(e.target.value)}
                style={{ width: "auto", minWidth: "160px", fontSize: "12px", padding: "6px 10px", background: "var(--navy-mid)" }}
              >
                <option value="All">All Categories</option>
                {DONATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Donations Table */}
          {filteredDonations.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>💖</div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>No donations found</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Contributions will appear here when submitted.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ overflow: "hidden", padding: 0 }}>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>Donor Details</th>
                      <th style={{ width: "22%" }}>Fund Category</th>
                      <th style={{ width: "14%" }}>Amount</th>
                      <th style={{ width: "16%" }}>bKash TrxID</th>
                      <th style={{ width: "10%" }}>Status</th>
                      <th style={{ width: "14%", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((d) => {
                      const isVerified = d.status === "verified";
                      const isRejected = d.status === "rejected";

                      return (
                        <tr key={d.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: "#ffffff", fontSize: "13px" }}>{d.donorName}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                              ID: {d.donorStudentId} · {d.donorPhone || d.donorEmail}
                            </div>
                            {d.donorNote && (
                              <div style={{ fontSize: "10.5px", color: "#fbbf24", fontStyle: "italic", marginTop: "2px" }}>
                                &quot;{d.donorNote}&quot;
                              </div>
                            )}
                          </td>

                          <td>
                            <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 700 }}>{d.category}</span>
                          </td>

                          <td>
                            <span style={{ fontSize: "14px", fontWeight: 900, color: "#4ade80" }}>
                              ৳{parseFloat(d.amount).toLocaleString()} BDT
                            </span>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ fontFamily: "monospace", color: "#f43f5e", fontWeight: 800, fontSize: "12px" }}>
                                {d.transactionId}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyTrx(d.transactionId)}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                              >
                                {copiedTrxId === d.transactionId ? <Check size={11} color="#22c55e" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: "10px",
                                textTransform: "uppercase",
                                background: isVerified
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : isRejected
                                  ? "rgba(239, 68, 68, 0.2)"
                                  : "rgba(245, 158, 11, 0.2)",
                                color: isVerified
                                  ? "#86efac"
                                  : isRejected
                                  ? "#fca5a5"
                                  : "#fef08a",
                                border: isVerified
                                  ? "1px solid rgba(34, 197, 94, 0.4)"
                                  : isRejected
                                  ? "1px solid rgba(239, 68, 68, 0.4)"
                                  : "1px solid rgba(245, 158, 11, 0.4)",
                              }}
                            >
                              {d.status}
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              {!isVerified && (
                                <button
                                  type="button"
                                  disabled={updatingId === d.id}
                                  onClick={() => handleUpdateDonation(d.id, "verified")}
                                  style={{
                                    background: "rgba(34, 197, 94, 0.2)",
                                    border: "1px solid #22c55e",
                                    color: "#4ade80",
                                    borderRadius: "6px",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                  }}
                                >
                                  ✓ Verify
                                </button>
                              )}
                              {!isRejected && (
                                <button
                                  type="button"
                                  disabled={updatingId === d.id}
                                  onClick={() => handleUpdateDonation(d.id, "rejected")}
                                  style={{
                                    background: "rgba(239, 68, 68, 0.15)",
                                    border: "1px solid rgba(239, 68, 68, 0.4)",
                                    color: "#f87171",
                                    borderRadius: "6px",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                  }}
                                >
                                  ✕ Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: TREASURY & FINANCIAL AUDIT ================= */}
      {activeTab === "treasury" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header & Export Controls */}
          <div
            className="glass-card"
            style={{
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              border: "1.5px solid rgba(34, 197, 94, 0.4)",
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(11, 23, 48, 0.8) 100%)",
            }}
          >
            <div>
              <span className="badge badge-gold" style={{ marginBottom: "6px", display: "inline-flex", gap: "6px" }}>
                <Landmark size={13} /> Official Treasury &amp; Financial Statement
              </span>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", margin: 0 }}>
                Club Treasury &amp; Transparency Audit
              </h2>
              <p style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "4px" }}>
                Reconciled fiscal reporting. Only verified transactions count towards actual treasury reserves.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  downloadFinancialAuditPdf(rows, donations, {
                    validityLabel,
                    membershipFee,
                  })
                }
                className="btn-gold"
                style={{
                  padding: "10px 20px",
                  fontSize: "13px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 0 20px rgba(245, 158, 11, 0.35)",
                }}
              >
                <FileText size={15} /> Download Audit Statement (PDF)
              </button>

              <button
                onClick={() =>
                  exportFinancialAuditToExcel(rows, donations, {
                    validityLabel,
                    membershipFee,
                  })
                }
                className="btn-neon-gold"
                style={{
                  padding: "10px 20px",
                  fontSize: "13px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <FileSpreadsheet size={15} /> Export Audit Ledger (Excel .xlsx)
              </button>
            </div>
          </div>

          {/* 4 Executive Financial Summary KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            {/* Grand Verified Treasury */}
            <div
              className="glass-card-bright glow-border"
              style={{
                padding: "20px",
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(14, 30, 62, 0.9) 100%)",
                borderColor: "#22c55e",
              }}
            >
              <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#86efac", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <CircleDollarSign size={15} color="#4ade80" /> Total Verified Treasury (Actual Funds)
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#4ade80", marginTop: "6px" }}>
                ৳{grandTotalVerifiedTreasury.toLocaleString()} BDT
              </div>
              <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
                {verifiedCount + donations.filter((d) => d.status === "verified").length} 100% Verified Transactions
              </div>
            </div>

            {/* Verified Membership Revenue */}
            <div className="glass-card" style={{ padding: "20px", borderColor: "rgba(245, 158, 11, 0.4)" }}>
              <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#fbbf24", textTransform: "uppercase" }}>
                Membership Dues Revenue
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#fef08a", marginTop: "6px" }}>
                ৳{totalCollectedBDT.toLocaleString()} BDT
              </div>
              <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
                {verifiedCount} Verified Athletes (@ ৳{membershipFee} BDT)
              </div>
            </div>

            {/* Verified Donations */}
            <div className="glass-card" style={{ padding: "20px", borderColor: "rgba(56, 189, 248, 0.4)" }}>
              <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
                Donations &amp; Patron Funds
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#38bdf8", marginTop: "6px" }}>
                ৳{verifiedDonationAmount.toLocaleString()} BDT
              </div>
              <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
                {donations.filter((d) => d.status === "verified").length} Verified Contributions
              </div>
            </div>

            {/* Pending Requests */}
            <div className="glass-card" style={{ padding: "20px", borderColor: "rgba(239, 68, 68, 0.4)" }}>
              <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#f87171", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} color="#f87171" /> Pending Requests (Not Counted)
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#fca5a5", marginTop: "6px" }}>
                ৳{totalPendingRequests.toLocaleString()} BDT
              </div>
              <div style={{ fontSize: "12px", color: "#fca5a5", marginTop: "4px" }}>
                {pendingCount + donations.filter((d) => d.status === "pending").length} Awaiting Verification
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="glass-card" style={{ padding: "22px", borderRadius: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <PieChart size={18} color="#fbbf24" />
              Fund Stream Allocation &amp; Reconciliation Table
            </h3>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Fund Stream / Category</th>
                    <th style={{ width: "15%" }}>Verified Count</th>
                    <th style={{ width: "20%" }}>Verified Treasury (BDT)</th>
                    <th style={{ width: "20%" }}>Pending Requests (BDT)</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Treasury Share</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(treasuryCategoryBreakdown).map(([cat, stats]) => {
                    const share =
                      grandTotalVerifiedTreasury > 0
                        ? ((stats.verifiedAmt / grandTotalVerifiedTreasury) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr key={cat}>
                        <td style={{ fontWeight: 800, color: "#ffffff", fontSize: "13px" }}>{cat}</td>
                        <td style={{ fontSize: "12.5px", color: "#cbd5e1" }}>{stats.verifiedCount}</td>
                        <td>
                          <span style={{ fontSize: "14px", fontWeight: 900, color: "#4ade80" }}>
                            ৳{stats.verifiedAmt.toLocaleString()} BDT
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12.5px", color: "#f87171" }}>
                            ৳{stats.pendingAmt.toLocaleString()} BDT
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#fbbf24", fontSize: "13px" }}>
                          {share}%
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr style={{ background: "rgba(34, 197, 94, 0.1)", borderTop: "2px solid #22c55e" }}>
                    <td style={{ fontWeight: 900, color: "#ffffff", fontSize: "14px" }}>
                      GRAND TOTAL RECONCILED TREASURY
                    </td>
                    <td style={{ fontWeight: 900, color: "#ffffff", fontSize: "13px" }}>
                      {verifiedCount + donations.filter((d) => d.status === "verified").length}
                    </td>
                    <td>
                      <span style={{ fontSize: "16px", fontWeight: 900, color: "#4ade80" }}>
                        ৳{grandTotalVerifiedTreasury.toLocaleString()} BDT
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#fca5a5" }}>
                        ৳{totalPendingRequests.toLocaleString()} BDT
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 900, color: "#4ade80", fontSize: "14px" }}>
                      100.0%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: VALIDITY & SEASON SETTINGS ================= */}
      {activeTab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
          
          {/* Top Info Banner */}
          <div
            className="glass-card"
            style={{
              padding: "16px 20px",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              background: "rgba(245, 158, 11, 0.06)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#fef08a" }}>
                  Official Club Season &amp; Fee Management
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#cbd5e1", lineHeight: 1.4 }}>
                  Changes to Membership Fee and Pass Validity update the student registration portal and dashboard automatically.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", width: "100%" }}>
            
            {/* Card 1: Pass Validity & Duration Settings */}
            <div className="glass-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24" }}>
                  <SettingsIcon size={18} />
                  Pass Validity &amp; Fee Configuration
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                  Configure what displays on ID cards and how much athletes pay.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                    ID Card Pass Validity Label:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={validityLabel}
                    onChange={(e) => setValidityLabel(e.target.value)}
                    placeholder="e.g. SEASON 2026-2027 or VALID THRU: DEC 2026"
                    style={{ fontSize: "13px", width: "100%", boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", display: "block" }}>
                    Shown on holographic card front and verified PDF passes.
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                      Duration (Months):
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(parseInt(e.target.value, 10) || 12)}
                      min={1}
                      max={48}
                      style={{ fontSize: "13px", width: "100%", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                      Membership Fee (BDT):
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={membershipFee}
                      onChange={(e) => setMembershipFee(e.target.value)}
                      style={{ fontSize: "13px", width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Registration Window */}
            <div className="glass-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8" }}>
                  <Calendar size={18} />
                  Official Registration Window
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                  Registration is locked for students outside these dates.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                    Registration Start Date &amp; Time:
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ fontSize: "12.5px", width: "100%", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                    Registration Deadline Date &amp; Time:
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ fontSize: "12.5px", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveFullSettings}
                disabled={isSavingSettings}
                className="btn-gold"
                style={{ width: "100%", padding: "11px", fontSize: "13.5px", marginTop: "auto" }}
              >
                {isSavingSettings ? "Saving Settings..." : "Save All Club Settings"}
              </button>

              {settingsMessage && (
                <div style={{ fontSize: "12px", textAlign: "center", color: "#86efac", fontWeight: 700, lineHeight: 1.4 }}>
                  {settingsMessage}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: New Season Transition & Revoke All Memberships */}
          <div
            className="glass-card"
            style={{
              padding: "22px 24px",
              borderColor: "rgba(234, 179, 8, 0.4)",
              background: "linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(13, 21, 39, 0.8) 100%)",
              borderRadius: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#fef08a" }}>
                  <RefreshCw size={18} />
                  New Season Transition &amp; Membership Revocation
                </h3>
                <p style={{ fontSize: "12.5px", color: "#cbd5e1", marginTop: "6px", lineHeight: 1.5, maxWidth: "700px" }}>
                  When a new athletic season begins, click below to set all athlete memberships to <strong>PENDING</strong>.
                  All member personal information, sports selections, and student records are <strong>safely preserved</strong>.
                  Athletes will be prompted on their dashboard to pay the new season membership fee (<strong>৳{membershipFee} BDT</strong>) to reactivate their pass for <strong>{validityLabel}</strong>.
                </p>
              </div>

              <button
                onClick={() => setShowRevokeModal(true)}
                style={{
                  background: "rgba(234, 179, 8, 0.2)",
                  border: "1.5px solid #eab308",
                  color: "#fef08a",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 0 15px rgba(234, 179, 8, 0.2)",
                }}
              >
                <RefreshCw size={15} /> Revoke All for New Season
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Member Modal */}
      {selectedMember && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            className="glass-card animate-fade-in-up"
            style={{
              maxWidth: "600px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "26px",
              border: "1.5px solid var(--gold)",
              background: "#0c1527",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="badge badge-gold">{selectedMember.membershipNumber}</span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", margin: "4px 0 0" }}>
                  {selectedMember.fullName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Holographic Card Preview */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
              <HolographicMemberCard
                member={{
                  fullName: selectedMember.fullName,
                  studentId: selectedMember.studentId,
                  department: selectedMember.department,
                  sportsList: (() => {
                    try {
                      const p = JSON.parse(selectedMember.sportsInterests);
                      return Array.isArray(p) ? p : [selectedMember.sportsInterests];
                    } catch {
                      return [selectedMember.sportsInterests];
                    }
                  })(),
                  membershipNumber: selectedMember.membershipNumber,
                  transactionId: selectedMember.transactionId,
                  phone: selectedMember.phone,
                  gender: selectedMember.gender,
                  bloodGroup: selectedMember.bloodGroup,
                  jerseySize: selectedMember.jerseySize,
                  emergencyContact: selectedMember.emergencyContact,
                  paymentStatus: selectedMember.paymentStatus,
                  registeredAt: selectedMember.registeredAt,
                  userAvatar: selectedMember.userAvatar,
                  validityLabel,
                }}
              />
            </div>

            {/* Quick Status Bar */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid var(--glass-border)",
                marginBottom: "18px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
                Update Payment Verification Status:
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleUpdateStatus(selectedMember.id, "verified")}
                  className="btn-gold"
                  style={{
                    flex: 1,
                    padding: "8px",
                    fontSize: "12.5px",
                    background: selectedMember.paymentStatus === "verified" ? "#22c55e" : undefined,
                    color: "#fff",
                  }}
                >
                  ✓ Mark Verified
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMember.id, "pending")}
                  className="btn-outline"
                  style={{ flex: 1, padding: "8px", fontSize: "12.5px" }}
                >
                  ⏳ Set Pending
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMember.id, "rejected")}
                  className="btn-ghost"
                  style={{
                    flex: 1,
                    padding: "8px",
                    fontSize: "12.5px",
                    color: "#f87171",
                    background: "rgba(239,68,68,0.1)",
                  }}
                >
                  ✕ Reject / Fake
                </button>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  downloadIdCardPdf({
                    membershipNumber: selectedMember.membershipNumber,
                    fullName: selectedMember.fullName,
                    studentId: selectedMember.studentId,
                    email: selectedMember.email,
                    phone: selectedMember.phone,
                    department: selectedMember.department,
                    semester: selectedMember.semester,
                    gender: selectedMember.gender,
                    bloodGroup: selectedMember.bloodGroup,
                    sportsInterests: selectedMember.sportsInterests,
                    jerseySize: selectedMember.jerseySize,
                    emergencyContact: selectedMember.emergencyContact,
                    bkashNumber: selectedMember.bkashNumber,
                    transactionId: selectedMember.transactionId,
                    paymentAmount: selectedMember.paymentAmount,
                    paymentStatus: selectedMember.paymentStatus,
                    registeredAt: selectedMember.registeredAt,
                  })
                }
                className="btn-gold"
                style={{ flex: "1 1 180px", padding: "9px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Download size={14} /> Download ID Card
              </button>

              <button
                onClick={() =>
                  downloadMemberSlipPdf({
                    membershipNumber: selectedMember.membershipNumber,
                    fullName: selectedMember.fullName,
                    studentId: selectedMember.studentId,
                    email: selectedMember.email,
                    phone: selectedMember.phone,
                    department: selectedMember.department,
                    semester: selectedMember.semester,
                    gender: selectedMember.gender,
                    bloodGroup: selectedMember.bloodGroup,
                    sportsInterests: selectedMember.sportsInterests,
                    jerseySize: selectedMember.jerseySize,
                    emergencyContact: selectedMember.emergencyContact,
                    bkashNumber: selectedMember.bkashNumber,
                    transactionId: selectedMember.transactionId,
                    paymentAmount: selectedMember.paymentAmount,
                    paymentStatus: selectedMember.paymentStatus,
                    registeredAt: selectedMember.registeredAt,
                  })
                }
                className="btn-outline"
                style={{ flex: "1 1 140px", padding: "9px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <FileText size={14} /> Download Slip
              </button>

              <button
                onClick={() => handleDelete(selectedMember.id, selectedMember.fullName)}
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  borderRadius: "8px",
                  padding: "9px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Trash2 size={13} /> Delete
              </button>

              <button onClick={() => setSelectedMember(null)} className="btn-outline" style={{ padding: "9px 16px", fontSize: "12px" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke All Memberships Modal */}
      {showRevokeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px",
          }}
        >
          <div
            className="glass-card animate-fade-in-up"
            style={{
              maxWidth: "480px",
              width: "100%",
              padding: "24px",
              border: "1.5px solid #eab308",
              background: "#0d1527",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", marginBottom: "12px" }}>
              <RefreshCw size={22} />
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>Revoke Memberships for New Season</h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
              This will set all athlete membership statuses to <strong>PENDING</strong> for <strong>{validityLabel}</strong>.
              Athletes will see an alert on their dashboard to pay <strong>৳{membershipFee} BDT</strong> to renew their pass. All user profiles and sports data remain preserved.
            </p>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Type <strong style={{ color: "#fbbf24" }}>REVOKE ALL FOR NEW SEASON</strong> to confirm:
              </label>
              <input
                type="text"
                className="input-field"
                value={revokeConfirmText}
                onChange={(e) => setRevokeConfirmText(e.target.value)}
                placeholder="REVOKE ALL FOR NEW SEASON"
                style={{ borderColor: "#eab308" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleRevokeAllMemberships}
                disabled={revokeConfirmText !== "REVOKE ALL FOR NEW SEASON" || isRevoking}
                style={{
                  flex: 1,
                  background: revokeConfirmText === "REVOKE ALL FOR NEW SEASON" ? "#eab308" : "rgba(234,179,8,0.2)",
                  color: "#0c1527",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px",
                  fontWeight: 900,
                  fontSize: "12.5px",
                  cursor: revokeConfirmText === "REVOKE ALL FOR NEW SEASON" ? "pointer" : "not-allowed",
                }}
              >
                {isRevoking ? "Revoking Memberships..." : "Confirm & Revoke All"}
              </button>
              <button onClick={() => setShowRevokeModal(false)} className="btn-outline" style={{ padding: "9px 16px", fontSize: "12.5px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
