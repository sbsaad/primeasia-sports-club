// components/AdminMemberTable.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { AdminMemberRow } from "@/actions/admin";
import { updateMemberPaymentStatus, deleteMember, saveRegistrationSettings, resetAllMemberData } from "@/actions/admin";
import { exportMembersToExcel } from "@/lib/export-excel";
import { downloadAdminRosterPdf, downloadMemberSlipPdf, downloadIdCardPdf } from "@/lib/export-pdf";
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
  Shield,
  FileCheck,
  Flag,
  AlertOctagon,
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
  const [flagFilter, setFlagFilter] = useState<boolean>(false);

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
      r.membershipNumber.toLowerCase().includes(q) ||
      (r.receiptStudentId && r.receiptStudentId.toLowerCase().includes(q));

    const matchStatus = statusFilter === "All" || r.paymentStatus === statusFilter;
    const matchDept = deptFilter === "All" || r.department.toLowerCase().includes(deptFilter.toLowerCase());
    const matchFlag = !flagFilter || r.isFlagged || (r.receiptStudentId && r.receiptStudentId !== r.studentId);

    let matchSport = true;
    if (sportFilter !== "All") {
      try {
        const parsed = JSON.parse(r.sportsInterests);
        matchSport = Array.isArray(parsed) && parsed.includes(sportFilter);
      } catch {
        matchSport = r.sportsInterests.includes(sportFilter);
      }
    }

    return matchSearch && matchStatus && matchDept && matchSport && matchFlag;
  });

  const verifiedCount = rows.filter((r) => r.paymentStatus === "verified").length;
  const pendingCount = rows.filter((r) => r.paymentStatus === "pending").length;
  const flaggedCount = rows.filter((r) => r.isFlagged || (r.receiptStudentId && r.receiptStudentId !== r.studentId)).length;
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
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>Payment confirmed</div>
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
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>@ 200 BDT/member</div>
        </div>
      </div>

      {/* Admin Quick Action Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
        {/* Registration Window */}
        <div className="glass-card" style={{ padding: "16px 20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={15} color="var(--gold)" />
            Member Registration Window
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "3px" }}>Start</label>
              <input
                type="datetime-local"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ fontSize: "12px", padding: "6px 8px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "3px" }}>End</label>
              <input
                type="datetime-local"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ fontSize: "12px", padding: "6px 8px" }}
              />
            </div>
          </div>
          <button
            onClick={handleSaveDates}
            disabled={isSavingDates}
            className="btn-gold"
            style={{ width: "100%", padding: "7px", fontSize: "12.5px" }}
          >
            {isSavingDates ? "Saving..." : "Save Window Dates"}
          </button>
          {dateMessage && (
            <div style={{ fontSize: "11.5px", marginTop: "6px", textAlign: "center", color: "#fbbf24" }}>
              {dateMessage}
            </div>
          )}
        </div>

        {/* Data Export & Reset */}
        <div className="glass-card" style={{ padding: "16px 20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", color: "#f87171" }}>
            <FileCheck size={15} />
            Data Export & Roster
          </h3>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <button
              onClick={() => exportMembersToExcel(filtered)}
              className="btn-outline"
              style={{ flex: 1, padding: "8px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px", justifyContent: "center" }}
            >
              <FileSpreadsheet size={14} color="#22c55e" /> Excel ({filtered.length})
            </button>
            <button
              onClick={() => downloadAdminRosterPdf(filtered)}
              className="btn-outline"
              style={{ flex: 1, padding: "8px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px", justifyContent: "center" }}
            >
              <FileText size={14} color="#38bdf8" /> PDF Roster
            </button>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            style={{
              width: "100%",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#f87171",
              padding: "6px",
              borderRadius: "8px",
              fontSize: "11.5px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <Trash2 size={12} /> Reset Member Database
          </button>
        </div>
      </div>

      {/* Search & Filters */}
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
            placeholder="Search Name, Student ID, TrxID, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "32px", fontSize: "12.5px", padding: "7px 10px 7px 32px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Flag Toggle Button */}
          <button
            type="button"
            onClick={() => setFlagFilter(!flagFilter)}
            style={{
              background: flagFilter ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.1)",
              border: flagFilter ? "1.5px solid #ef4444" : "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "5px 10px",
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
            {flagFilter ? "Showing Flagged Only" : `🚩 Flagged (${flaggedCount})`}
          </button>

          {/* Status Filter Buttons */}
          <div style={{ display: "flex", background: "var(--navy-mid)", borderRadius: "8px", padding: "2px", border: "1px solid var(--glass-border)" }}>
            {["All", "pending", "verified", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? "rgba(245, 158, 11, 0.25)" : "transparent",
                  color: statusFilter === st ? "#fbbf24" : "var(--text-muted)",
                  border: statusFilter === st ? "1px solid rgba(245, 158, 11, 0.4)" : "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {st === "All" ? "All" : st}
              </button>
            ))}
          </div>

          {/* Sport Filter */}
          <select
            className="input-field"
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            style={{ width: "auto", minWidth: "120px", fontSize: "12px", padding: "6px 10px", background: "var(--navy-mid)" }}
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

      {/* Main Members Table - Sleek, Compact, Clean layout with Fraud Flags */}
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
                  <th style={{ width: "26%" }}>Member Name</th>
                  <th style={{ width: "16%" }}>Student ID</th>
                  <th style={{ width: "22%" }}>Department</th>
                  <th style={{ width: "16%" }}>bKash TrxID</th>
                  <th style={{ width: "10%" }}>Status</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isRowVerified = m.paymentStatus === "verified";
                  const isRowRejected = m.paymentStatus === "rejected";
                  const isRowFlagged = Boolean(
                    m.isFlagged || (m.receiptStudentId && m.receiptStudentId !== m.studentId)
                  );

                  return (
                    <tr
                      key={m.id}
                      style={{
                        background: isRowFlagged ? "rgba(239, 68, 68, 0.08)" : undefined,
                      }}
                    >
                      {/* Member profile */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {m.userAvatar ? (
                            <Image
                              src={m.userAvatar}
                              alt={m.fullName}
                              width={32}
                              height={32}
                              style={{ borderRadius: "50%", border: isRowFlagged ? "1.5px solid #ef4444" : "1.5px solid var(--gold)", flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: isRowFlagged ? "rgba(239,68,68,0.2)" : "var(--navy-mid)",
                                border: isRowFlagged ? "1.5px solid #ef4444" : "1.5px solid var(--gold)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "13px",
                                color: isRowFlagged ? "#f87171" : "var(--gold)",
                                flexShrink: 0,
                              }}
                            >
                              {m.fullName[0]}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                              {m.fullName}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                              {m.phone}
                            </div>
                            {/* 🚩 Red Flag Pill in Table */}
                            {isRowFlagged && (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  background: "rgba(239, 68, 68, 0.25)",
                                  color: "#fca5a5",
                                  border: "1px solid rgba(239, 68, 68, 0.5)",
                                  borderRadius: "4px",
                                  padding: "1px 5px",
                                  marginTop: "2px",
                                }}
                                title={m.flaggedReason || `Slip ID: ${m.receiptStudentId} != Form ID: ${m.studentId}`}
                              >
                                <Flag size={9} color="#ef4444" />
                                <span>SUSPECT / ID MISMATCH</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td>
                        <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "13px", color: isRowFlagged ? "#f87171" : "var(--gold)" }}>
                          {m.studentId}
                        </div>
                        <div style={{ fontSize: "11px", color: "#93c5fd" }}>
                          Sem {m.semester}
                        </div>
                        {isRowFlagged && m.receiptStudentId && (
                          <div style={{ fontSize: "10px", color: "#fca5a5", fontFamily: "monospace" }}>
                            Slip: {m.receiptStudentId}
                          </div>
                        )}
                      </td>

                      {/* Department */}
                      <td>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                          {m.department}
                        </div>
                      </td>

                      {/* TrxID */}
                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: "12px",
                              background: "rgba(226, 19, 110, 0.16)",
                              color: "#f472b6",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: "1px solid rgba(226, 19, 110, 0.35)",
                              letterSpacing: "0.03em",
                            }}
                          >
                            {m.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyTrx(m.transactionId)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "1px" }}
                            title="Copy TrxID"
                          >
                            {copiedTrxId === m.transactionId ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "10.5px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            display: "inline-flex",
                            alignItems: "center",
                            background: isRowVerified
                              ? "rgba(34, 197, 94, 0.18)"
                              : isRowRejected
                              ? "rgba(239, 68, 68, 0.18)"
                              : "rgba(245, 158, 11, 0.18)",
                            color: isRowVerified ? "#4ade80" : isRowRejected ? "#f87171" : "#fbbf24",
                            border: isRowVerified
                              ? "1px solid rgba(34, 197, 94, 0.4)"
                              : isRowRejected
                              ? "1px solid rgba(239, 68, 68, 0.4)"
                              : "1px solid rgba(245, 158, 11, 0.4)",
                          }}
                        >
                          {isRowVerified ? "Verified" : isRowRejected ? "Rejected" : "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "5px", alignItems: "center" }}>
                          {/* Quick Verify Toggle */}
                          {!isRowVerified && (
                            <button
                              onClick={() => handleUpdateStatus(m.id, "verified")}
                              disabled={updatingId === m.id}
                              title="Mark as Verified"
                              style={{
                                background: "rgba(34, 197, 94, 0.15)",
                                border: "1px solid rgba(34, 197, 94, 0.4)",
                                color: "#4ade80",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <CheckCircle size={12} /> Verify
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
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "11.5px",
                                fontWeight: 700,
                              }}
                            >
                              Pending
                            </button>
                          )}

                          {/* View Modal */}
                          <button
                            onClick={() => setSelectedMember(m)}
                            className="btn-outline"
                            style={{ padding: "4px 8px", fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "3px" }}
                            title="Inspect Details & Pass"
                          >
                            <Eye size={12} /> View
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(m.id, m.fullName)}
                            style={{
                              background: "rgba(239, 68, 68, 0.08)",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                              color: "#f87171",
                              padding: "4px 6px",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
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
              padding: "10px 16px",
              borderTop: "1px solid var(--glass-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11.5px",
              color: "var(--text-muted)",
            }}
          >
            <span>
              Showing {filtered.length} of {rows.length} total members ({flaggedCount} flagged)
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
              maxWidth: "640px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              border: (selectedMember.isFlagged || (selectedMember.receiptStudentId && selectedMember.receiptStudentId !== selectedMember.studentId))
                ? "2px solid #ef4444"
                : "1px solid var(--glass-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <h2 style={{ fontSize: "19px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  {selectedMember.fullName}
                </h2>
                <p style={{ fontSize: "12.5px", color: "var(--gold)", margin: "2px 0 0", fontFamily: "monospace" }}>
                  {selectedMember.membershipNumber} · {selectedMember.email}
                </p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="btn-ghost" style={{ fontSize: "18px", padding: "4px 8px" }}>
                ✕
              </button>
            </div>

            {/* 🚩 Loud Fraud Alert in Modal if Flagged */}
            {(selectedMember.isFlagged || (selectedMember.receiptStudentId && selectedMember.receiptStudentId !== selectedMember.studentId)) && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.18)",
                  border: "1.5px solid #ef4444",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "18px",
                  color: "#fca5a5",
                }}
              >
                <div style={{ fontWeight: 900, fontSize: "13.5px", color: "#fca5a5", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <AlertOctagon size={18} color="#ef4444" /> FRAUD WARNING: Probable Fake / Mismatched Payment Slip!
                </div>
                <div style={{ fontSize: "12.5px", lineHeight: 1.5, color: "#ffffff" }}>
                  <div>• <strong>Registered Student ID:</strong> <span style={{ fontFamily: "monospace", color: "#93c5fd" }}>{selectedMember.studentId}</span></div>
                  <div>• <strong>Receipt Detected Student ID:</strong> <span style={{ fontFamily: "monospace", color: "#fef08a" }}>{selectedMember.receiptStudentId || "Unknown / Mismatch"}</span></div>
                  {selectedMember.flaggedReason && (
                    <div>• <strong>Flag Reason:</strong> {selectedMember.flaggedReason}</div>
                  )}
                </div>
              </div>
            )}

            {/* 3D Holographic Card Preview in Modal */}
            <div style={{ margin: "14px 0 20px" }}>
              <HolographicMemberCard
                member={{
                  ...selectedMember,
                  userAvatar: selectedMember.userAvatar,
                }}
              />
            </div>

            {/* Member Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "18px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Student ID</span>
                <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{selectedMember.studentId}</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Department</span>
                <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{selectedMember.department}</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Phone</span>
                <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{selectedMember.phone}</strong>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>bKash TrxID</span>
                <strong style={{ fontSize: "13px", color: "#f472b6", fontFamily: "monospace" }}>{selectedMember.transactionId}</strong>
              </div>
            </div>

            {/* Verification Status Controls in Modal */}
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
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
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
                style={{ flex: 1.2, padding: "9px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Download size={14} /> Download Official ID Card
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
                style={{ flex: 1, padding: "9px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <FileText size={14} /> Download Slip
              </button>

              <button onClick={() => setSelectedMember(null)} className="btn-outline" style={{ padding: "9px 16px", fontSize: "12px" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Wipe Reset Modal */}
      {showResetModal && (
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
              maxWidth: "460px",
              width: "100%",
              padding: "24px",
              border: "1.5px solid #ef4444",
              background: "#0d1527",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171", marginBottom: "12px" }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>Reset Member Database</h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
              This will permanently delete <strong>all registered members and their bKash transaction data</strong>.
            </p>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Type <strong style={{ color: "#fbbf24" }}>RESET PAUSC 2026</strong> to confirm:
              </label>
              <input
                type="text"
                className="input-field"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET PAUSC 2026"
                style={{ borderColor: "#ef4444" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleResetDatabase}
                disabled={resetConfirmText !== "RESET PAUSC 2026" || isResetting}
                style={{
                  flex: 1,
                  background: resetConfirmText === "RESET PAUSC 2026" ? "#ef4444" : "rgba(239,68,68,0.2)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  cursor: resetConfirmText === "RESET PAUSC 2026" ? "pointer" : "not-allowed",
                }}
              >
                {isResetting ? "Wiping Database..." : "Permanently Wipe Data"}
              </button>
              <button onClick={() => setShowResetModal(false)} className="btn-outline" style={{ padding: "9px 16px", fontSize: "12.5px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
