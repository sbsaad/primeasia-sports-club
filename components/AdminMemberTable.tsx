// components/AdminMemberTable.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { AdminMemberRow } from "@/actions/admin";
import { updateMemberPaymentStatus, deleteMember, saveRegistrationSettings, resetAllMemberData } from "@/actions/admin";
import { exportMembersToExcel } from "@/lib/export-excel";
import { downloadAdminRosterPdf, downloadMemberSlipPdf } from "@/lib/export-pdf";
import { DEPARTMENTS, SPORTS_OPTIONS } from "@/lib/validations";
import HolographicMemberCard from "./HolographicMemberCard";
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

interface Props {
  rows: AdminMemberRow[];
  initialSettings?: {
    start: string;
    end: string;
    fee: string;
    instructions: string;
  };
}

const toLocalDateTimeLocal = (isoString?: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminMemberTable({ rows, initialSettings }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [sportFilter, setSportFilter] = useState<string>("All");

  // Date settings state
  const [startDate, setStartDate] = useState(toLocalDateTimeLocal(initialSettings?.start));
  const [endDate, setEndDate] = useState(toLocalDateTimeLocal(initialSettings?.end));
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [dateMessage, setDateMessage] = useState("");

  // Inspect Modal
  const [selectedMember, setSelectedMember] = useState<AdminMemberRow | null>(null);

  // Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  // Filtering logic
  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.studentId.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.transactionId.toLowerCase().includes(q) ||
      r.membershipNumber.toLowerCase().includes(q);

    const matchStatus = statusFilter === "All" || r.paymentStatus === statusFilter;
    const matchDept = deptFilter === "All" || r.department.includes(deptFilter);

    let matchSport = true;
    if (sportFilter !== "All") {
      try {
        const parsed = JSON.parse(r.sportsInterests);
        matchSport = Array.isArray(parsed) && parsed.includes(sportFilter);
      } catch {
        matchSport = r.sportsInterests.includes(sportFilter);
      }
    }

    return matchSearch && matchStatus && matchDept && matchSport;
  });

  const verifiedCount = rows.filter((r) => r.paymentStatus === "verified").length;
  const pendingCount = rows.filter((r) => r.paymentStatus === "pending").length;
  const totalCollectedBDT = verifiedCount * 200;

  const handleUpdateStatus = async (id: string, newStatus: "pending" | "verified" | "rejected") => {
    setUpdatingId(id);
    try {
      await updateMemberPaymentStatus(id, newStatus);
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember({ ...selectedMember, paymentStatus: newStatus });
      }
    } catch (err: any) {
      alert("Failed to update status: " + (err.message || err));
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
    } catch (err: any) {
      alert("Failed to delete member: " + (err.message || err));
    }
  };

  const handleSaveDates = async () => {
    setIsSavingDates(true);
    setDateMessage("");
    try {
      const startIso = startDate ? new Date(startDate).toISOString() : "";
      const endIso = endDate ? new Date(endDate).toISOString() : "";
      await saveRegistrationSettings({ start: startIso, end: endIso });
      setDateMessage("✅ Registration window dates updated successfully!");
      setTimeout(() => setDateMessage(""), 3000);
    } catch {
      setDateMessage("❌ Failed to save registration dates.");
    } finally {
      setIsSavingDates(false);
    }
  };

  const handleResetDatabase = async () => {
    if (resetConfirmText !== "RESET PAUSC 2026") return;
    setIsResetting(true);
    try {
      await resetAllMemberData();
      alert("Member database cleared successfully!");
      window.location.reload();
    } catch (err: any) {
      alert("Reset failed: " + (err.message || err));
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
      setResetConfirmText("");
    }
  };

  const copyTrx = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrxId(trx);
    setTimeout(() => setCopiedTrxId(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
        <div className="glass-card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Registered
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginTop: "4px" }}>
            {rows.length}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Members applied</div>
        </div>

        <div className="glass-card" style={{ padding: "18px 20px", borderColor: "rgba(34, 197, 94, 0.3)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#4ade80", textTransform: "uppercase" }}>
            Verified Members
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#4ade80", marginTop: "4px" }}>
            {verifiedCount}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Payment confirmed</div>
        </div>

        <div className="glass-card" style={{ padding: "18px 20px", borderColor: "rgba(245, 158, 11, 0.3)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" }}>
            Pending Verification
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#fbbf24", marginTop: "4px" }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Awaiting Trx check</div>
        </div>

        <div className="glass-card" style={{ padding: "18px 20px", borderColor: "rgba(201, 162, 39, 0.3)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
            Fees Verified (BDT)
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "var(--gold)", marginTop: "4px" }}>
            ৳{totalCollectedBDT.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>@ 200 BDT/member</div>
        </div>
      </div>

      {/* Admin Controllers: Registration Window & DB Reset */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {/* Registration Window */}
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} color="var(--gold)" />
            Member Registration Window
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "4px" }}>Start Date & Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ fontSize: "12.5px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "4px" }}>End Date & Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ fontSize: "12.5px" }}
              />
            </div>
          </div>
          <button
            onClick={handleSaveDates}
            disabled={isSavingDates}
            className="btn-gold"
            style={{ width: "100%", padding: "9px", fontSize: "13px" }}
          >
            {isSavingDates ? "Saving..." : "Save Window Dates"}
          </button>
          {dateMessage && <p style={{ fontSize: "12px", margin: "8px 0 0", color: "var(--gold)" }}>{dateMessage}</p>}
        </div>

        {/* Database Clean & Export Quick Box */}
        <div className="glass-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Download size={16} color="var(--gold)" />
              Bulk Exports & Records
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 16px" }}>
              Export the complete members roster with all university and payment data in one click.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => exportMembersToExcel(filtered)}
              disabled={filtered.length === 0}
              className="btn-gold"
              style={{ flex: 1, padding: "10px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <FileSpreadsheet size={15} /> Export Excel (.xlsx)
            </button>
            <button
              onClick={() => downloadAdminRosterPdf(filtered)}
              disabled={filtered.length === 0}
              className="btn-outline"
              style={{ flex: 1, padding: "10px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <FileText size={15} /> Export PDF Roster
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search Name, ID, Phone, Email, TrxID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "38px", fontSize: "13.5px" }}
            />
          </div>

          {/* Payment Status Filter */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["All", "pending", "verified", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: statusFilter === st ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.08)",
                  background: statusFilter === st ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.03)",
                  color: statusFilter === st ? "var(--gold)" : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  cursor: "pointer",
                }}
              >
                {st === "All" ? "All Status" : st}
              </button>
            ))}
          </div>

          {/* Sport Filter */}
          <select
            className="input-field"
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            style={{ width: "auto", minWidth: "140px", fontSize: "12.5px", background: "var(--navy-mid)" }}
          >
            <option value="All">All Sports</option>
            {SPORTS_OPTIONS.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Members Table */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🔍</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>No members found</h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Student ID</th>
                  <th>Department</th>
                  <th>bKash TrxID</th>
                  <th>Status</th>
                  <th>Sports</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  let sports: string[] = [];
                  try {
                    const p = JSON.parse(m.sportsInterests);
                    sports = Array.isArray(p) ? p : [m.sportsInterests];
                  } catch {
                    sports = [m.sportsInterests];
                  }

                  const isRowVerified = m.paymentStatus === "verified";
                  const isRowRejected = m.paymentStatus === "rejected";

                  return (
                    <tr key={m.id}>
                      {/* Member profile */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {m.userAvatar ? (
                            <Image
                              src={m.userAvatar}
                              alt={m.fullName}
                              width={34}
                              height={34}
                              style={{ borderRadius: "50%", border: "1px solid var(--gold)", flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: "var(--navy-mid)",
                                border: "1px solid var(--gold)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "13px",
                                color: "var(--gold)",
                                flexShrink: 0,
                              }}
                            >
                              {m.fullName[0]}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-primary)" }}>
                              {m.fullName}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                              {m.membershipNumber} · {m.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "13px", color: "var(--gold)" }}>
                          {m.studentId}
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sem {m.semester}</div>
                      </td>

                      {/* Department */}
                      <td>
                        <div style={{ fontSize: "12.5px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.department}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Jersey: {m.jerseySize}</div>
                      </td>

                      {/* TrxID */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "12.5px",
                              background: "rgba(226, 19, 110, 0.15)",
                              color: "#f472b6",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: "1px solid rgba(226, 19, 110, 0.3)",
                            }}
                          >
                            {m.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyTrx(m.transactionId)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}
                            title="Copy TrxID"
                          >
                            {copiedTrxId === m.transactionId ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                          </button>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Paid: ৳{m.paymentAmount || "200"}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: isRowVerified
                              ? "rgba(34, 197, 94, 0.15)"
                              : isRowRejected
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(245, 158, 11, 0.15)",
                            color: isRowVerified ? "#4ade80" : isRowRejected ? "#f87171" : "#fbbf24",
                            border: isRowVerified
                              ? "1px solid rgba(34, 197, 94, 0.3)"
                              : isRowRejected
                              ? "1px solid rgba(239, 68, 68, 0.3)"
                              : "1px solid rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          {isRowVerified ? "Verified" : isRowRejected ? "Rejected" : "Pending"}
                        </span>
                      </td>

                      {/* Sports */}
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "160px" }}>
                          {sports.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              style={{
                                fontSize: "10.5px",
                                background: "rgba(255,255,255,0.05)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {s}
                            </span>
                          ))}
                          {sports.length > 2 && (
                            <span style={{ fontSize: "10.5px", color: "var(--gold)" }}>+{sports.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td>
                        <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          {new Date(m.registeredAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {/* Quick Verify Toggle */}
                          {!isRowVerified && (
                            <button
                              onClick={() => handleUpdateStatus(m.id, "verified")}
                              disabled={updatingId === m.id}
                              title="Mark as Verified Member"
                              style={{
                                background: "rgba(34, 197, 94, 0.15)",
                                border: "1px solid rgba(34, 197, 94, 0.4)",
                                color: "#4ade80",
                                padding: "5px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <CheckCircle size={13} /> Verify
                            </button>
                          )}

                          {isRowVerified && (
                            <button
                              onClick={() => handleUpdateStatus(m.id, "pending")}
                              disabled={updatingId === m.id}
                              title="Revert to Pending"
                              style={{
                                background: "rgba(245, 158, 11, 0.15)",
                                border: "1px solid rgba(245, 158, 11, 0.4)",
                                color: "#fbbf24",
                                padding: "5px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Pending
                            </button>
                          )}

                          {/* View Modal */}
                          <button
                            onClick={() => setSelectedMember(m)}
                            className="btn-outline"
                            style={{ padding: "5px 8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Inspect Details & Pass"
                          >
                            <Eye size={13} /> View
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(m.id, m.fullName)}
                            style={{
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                              color: "#f87171",
                              padding: "5px 7px",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            title="Delete Member"
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

          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--glass-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12.5px",
              color: "var(--text-muted)",
            }}
          >
            <span>
              Showing {filtered.length} of {rows.length} total members
            </span>
            <span>Primeasia University Games & Sports Club · 2026</span>
          </div>
        </div>
      )}

      {/* Member Details Inspector Modal */}
      {selectedMember && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="glass-card animate-fade-in-up"
            style={{
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
              border: "1px solid var(--glass-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  {selectedMember.fullName}
                </h2>
                <p style={{ fontSize: "13px", color: "var(--gold)", margin: "2px 0 0", fontFamily: "monospace" }}>
                  {selectedMember.membershipNumber} · {selectedMember.email}
                </p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="btn-ghost" style={{ fontSize: "18px", padding: "4px 8px" }}>
                ✕
              </button>
            </div>

            {/* 3D Holographic Card Preview in Modal */}
            <div style={{ margin: "16px 0 24px" }}>
              <HolographicMemberCard
                member={{
                  ...selectedMember,
                  userAvatar: selectedMember.userAvatar,
                }}
              />
            </div>

            {/* Member Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Student ID</span>
                <strong style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>{selectedMember.studentId}</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Department</span>
                <strong style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>{selectedMember.department}</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Phone / WhatsApp</span>
                <strong style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>{selectedMember.phone}</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>bKash TrxID</span>
                <strong style={{ fontSize: "13.5px", color: "#f472b6", fontFamily: "monospace" }}>{selectedMember.transactionId}</strong>
              </div>
            </div>

            {/* Verification Status Controls in Modal */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--glass-border)",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "10px" }}>
                Update Payment Verification Status:
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleUpdateStatus(selectedMember.id, "verified")}
                  className="btn-gold"
                  style={{
                    flex: 1,
                    padding: "9px",
                    fontSize: "13px",
                    background: selectedMember.paymentStatus === "verified" ? "#22c55e" : undefined,
                    color: "#fff",
                  }}
                >
                  ✓ Mark Verified
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMember.id, "pending")}
                  className="btn-outline"
                  style={{ flex: 1, padding: "9px", fontSize: "13px" }}
                >
                  ⏳ Set Pending
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMember.id, "rejected")}
                  className="btn-ghost"
                  style={{
                    flex: 1,
                    padding: "9px",
                    fontSize: "13px",
                    color: "#f87171",
                    background: "rgba(239,68,68,0.1)",
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => downloadMemberSlipPdf(selectedMember)}
                className="btn-outline"
                style={{ padding: "8px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={14} /> Download Official PDF Slip
              </button>
              <button onClick={() => setSelectedMember(null)} className="btn-ghost" style={{ padding: "8px 16px", fontSize: "13px" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secure Database Reset Modal */}
      {showResetModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "20px",
          }}
        >
          <div className="glass-card animate-fade-in-up" style={{ maxWidth: "480px", width: "100%", padding: "32px", border: "1px solid rgba(239,68,68,0.4)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#fca5a5", marginBottom: "10px" }}>
              ⚠️ Clear All Registered Members Data
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
              This will permanently delete all registered member records, bKash transactions, and associated files.
            </p>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Type <strong style={{ color: "var(--gold)" }}>RESET PAUSC 2026</strong> to confirm:
            </p>
            <input
              type="text"
              className="input-field"
              placeholder="RESET PAUSC 2026"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              style={{ marginBottom: "20px" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowResetModal(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={resetConfirmText !== "RESET PAUSC 2026" || isResetting}
                className="btn-gold"
                style={{ background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
              >
                {isResetting ? "Wiping..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
