"use client";

import { useState } from "react";
import Image from "next/image";
import { getSemesterLabel } from "@/lib/semester";
import { saveRecruitmentDates, resetRecruitmentData } from "@/actions/admin";

export type SubmissionRow = {
  id: string;
  fullName: string;
  studentId: string;
  phone: string;
  position: string;
  semester: number;
  department: string;
  cgpa: string;
  experienceDetails: string;
  whyAppropriate: string;
  deviceInfo: string;
  blobUrl: string;
  filename: string;
  uploadedAt: Date;
  userEmail: string;
  userAvatar: string | null;
};

const POSITION_COLORS: Record<string, string> = {
  "President": "badge-gold",
  "Vice President": "badge-blue",
  "General Secretary": "badge-green",
  "Treasurer": "badge-orange",
};

interface Props {
  rows: SubmissionRow[];
  initialDates?: {
    start: string;
    end: string;
  };
}

export default function AdminTable({ rows, initialDates }: Props) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [downloading, setDownloading] = useState(false);

  // Date range picker states
  const [startDate, setStartDate] = useState(initialDates?.start ? new Date(initialDates.start).toISOString().slice(0, 16) : "");
  const [endDate, setEndDate] = useState(initialDates?.end ? new Date(initialDates.end).toISOString().slice(0, 16) : "");
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [dateMessage, setDateMessage] = useState("");

  // Details Modal state
  const [selectedRow, setSelectedRow] = useState<SubmissionRow | null>(null);

  // Secure Database Reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const positions = ["All", "President", "Vice President", "General Secretary", "Treasurer"];

  // Helper to count duplicate device IDs (fingerprint audit)
  const deviceIdCounts = rows.reduce((acc, r) => {
    try {
      if (r.deviceInfo) {
        const info = JSON.parse(r.deviceInfo);
        if (info.deviceId) {
          acc[info.deviceId] = (acc[info.deviceId] || 0) + 1;
        }
      }
    } catch (e) {}
    return acc;
  }, {} as Record<string, number>);

  const handleSaveDates = async () => {
    setIsSavingDates(true);
    setDateMessage("");
    try {
      const startIso = startDate ? new Date(startDate).toISOString() : "";
      const endIso = endDate ? new Date(endDate).toISOString() : "";
      await saveRecruitmentDates(startIso, endIso);
      setDateMessage("✅ Dates saved successfully!");
      setTimeout(() => setDateMessage(""), 3000);
    } catch (err) {
      setDateMessage("❌ Failed to save recruitment window dates.");
    } finally {
      setIsSavingDates(false);
    }
  };

  const handleResetData = async () => {
    if (resetConfirmText !== "RESET recruitment 2026") return;
    setIsResetting(true);
    try {
      await resetRecruitmentData();
      alert("Recruitment database successfully reset!");
      window.location.reload();
    } catch (err) {
      alert("Failed to reset database. Please try again.");
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
      setResetConfirmText("");
    }
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.studentId.toLowerCase().includes(q);
    const matchPos = posFilter === "All" || r.position === posFilter;
    return matchSearch && matchPos;
  });

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/download-zip");
      if (!res.ok) throw new Error("Failed to generate ZIP");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `primeasia_sports_club_cvs_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download ZIP. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Date settings and DB reset block */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        
        {/* Recruitment Date Controller */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
            📅 Set Recruitment Window
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Start Date & Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>End Date & Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <button
              onClick={handleSaveDates}
              className="btn-gold"
              style={{ marginTop: "8px", width: "100%", padding: "10px" }}
              disabled={isSavingDates}
            >
              {isSavingDates ? "Saving..." : "Save Recruitment Dates"}
            </button>
            {dateMessage && <p style={{ fontSize: "13px", margin: 0, color: "var(--gold)" }}>{dateMessage}</p>}
          </div>
        </div>

        {/* Destructive DB Reset Admin Tool */}
        <div className="glass-card" style={{ padding: "24px", borderColor: "rgba(239, 68, 68, 0.2)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "#fca5a5" }}>
            🚨 System Reset Tool
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
            Clean up the platform database. This will permanently wipe all candidate profiles, CV submissions, and registered users (except designated administrators).
          </p>
          <button
            onClick={() => setShowResetModal(true)}
            className="btn-outline"
            style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5", width: "100%", padding: "10px" }}
          >
            🗑️ Clear Recruitment Data
          </button>
        </div>

      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <span style={{
            position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", fontSize: "15px", pointerEvents: "none"
          }}>🔍</span>
          <input
            className="input-field"
            style={{ paddingLeft: "40px" }}
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Position filter */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {positions.map(p => (
            <button
              key={p}
              onClick={() => setPosFilter(p)}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border: posFilter === p ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.08)",
                background: posFilter === p ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.03)",
                color: posFilter === p ? "var(--gold)" : "var(--text-secondary)",
                fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
              }}
            >{p}</button>
          ))}
        </div>

        <button
          className="btn-gold"
          onClick={handleDownloadZip}
          disabled={downloading || rows.length === 0}
          style={{ flexShrink: 0, padding: "10px 20px", fontSize: "14px" }}
        >
          {downloading ? (
            <>
              <svg className="animate-spin-slow" width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Generating...
            </>
          ) : (
            <>📦 Download All (ZIP)</>
          )}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div className="glass-card" style={{ padding: "14px 20px", textAlign: "center", flex: "1 1 120px" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--gold)" }}>{rows.length}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Total Applications</div>
        </div>
        {["President", "Vice President", "General Secretary", "Treasurer"].map(pos => (
          <div key={pos} className="glass-card" style={{ padding: "14px 20px", textAlign: "center", flex: "1 1 120px" }}>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>
              {rows.filter(r => r.position === pos).length}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{pos}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>No submissions found.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Student ID</th>
                  <th>Position</th>
                  <th>Semester</th>
                  <th>Phone</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  let parsedDev: any = null;
                  try {
                    if (row.deviceInfo) parsedDev = JSON.parse(row.deviceInfo);
                  } catch(e){}
                  const isSuspicious = parsedDev?.deviceId && deviceIdCounts[parsedDev.deviceId] > 1;

                  return (
                    <tr key={row.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {row.userAvatar ? (
                            <Image src={row.userAvatar} alt={row.fullName} width={32} height={32}
                                   style={{ borderRadius: "50%", flexShrink: 0 }} />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                              background: "var(--navy-mid)", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              fontWeight: 700, fontSize: "13px", color: "var(--gold)"
                            }}>{row.fullName[0]}</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                              {row.fullName}
                              {isSuspicious && (
                                <span title="Multiple submissions from same browser fingerprint" style={{ fontSize: "11px", background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "1px 6px", borderRadius: "4px" }}>
                                  ⚠️ Shared Device
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--text-secondary)" }}>
                          {row.studentId}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${POSITION_COLORS[row.position] ?? "badge-blue"}`}>
                          {row.position}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {getSemesterLabel(row.semester)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {row.phone}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {formatDate(row.uploadedAt)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => setSelectedRow(row)}
                            className="btn-outline"
                            style={{ padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
                          >
                            🔎 View
                          </button>
                          <a
                            href={`/api/cv/${row.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline"
                            style={{ padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
                          >
                            ↓ CV
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: "12px 20px", borderTop: "1px solid var(--glass-border)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Showing {filtered.length} of {rows.length} applications
            </span>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.8)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 100,
          backdropFilter: "blur(6px)", padding: "20px"
        }}>
          <div className="glass-card animate-fade-in-up" style={{ maxWidth: "480px", width: "100%", padding: "32px", border: "1px solid rgba(239,68,68,0.3)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fca5a5", marginBottom: "12px" }}>⚠️ Destructive Database Reset</h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
              This operation will permanently delete all candidate CVs, details, and logged users except administrators. <strong>This cannot be undone.</strong>
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
              To verify this, type <strong style={{ color: "var(--gold)" }}>RESET recruitment 2026</strong> below:
            </p>
            <input
              type="text"
              className="input-field"
              placeholder="RESET recruitment 2026"
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value)}
              style={{ marginBottom: "24px", borderColor: resetConfirmText === "RESET recruitment 2026" ? "var(--gold)" : "" }}
            />
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowResetModal(false); setResetConfirmText(""); }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                disabled={resetConfirmText !== "RESET recruitment 2026" || isResetting}
                className="btn-gold"
                style={{
                  background: resetConfirmText === "RESET recruitment 2026" ? "#ef4444" : "rgba(255,255,255,0.05)",
                  color: "#fff",
                  borderColor: resetConfirmText === "RESET recruitment 2026" ? "#ef4444" : "transparent",
                  cursor: resetConfirmText === "RESET recruitment 2026" ? "pointer" : "not-allowed"
                }}
              >
                {isResetting ? "Wiping Database..." : "Delete All Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Viewer Modal */}
      {selectedRow && (() => {
        let deviceParsed: any = null;
        try {
          if (selectedRow.deviceInfo) deviceParsed = JSON.parse(selectedRow.deviceInfo);
        } catch(e){}
        const hasDeviceWarning = deviceParsed?.deviceId && deviceIdCounts[deviceParsed.deviceId] > 1;

        return (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.85)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 90,
            backdropFilter: "blur(8px)", padding: "20px"
          }}>
            <div className="glass-card animate-fade-in-up" style={{ maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>{selectedRow.fullName}</h2>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>{selectedRow.userEmail}</p>
                </div>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="btn-ghost"
                  style={{ fontSize: "20px", padding: "4px 8px" }}
                >
                  ✕
                </button>
              </div>

              {hasDeviceWarning && (
                <div className="glass-card" style={{
                  padding: "12px 16px", marginBottom: "20px",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#f87171", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center"
                }}>
                  <span>⚠️</span> <strong>Shared Device Warning:</strong> {deviceIdCounts[deviceParsed.deviceId]} applications have been submitted from this browser fingerprint!
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Student ID</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{selectedRow.studentId}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Semester</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{getSemesterLabel(selectedRow.semester)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Department</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{selectedRow.department || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Current CGPA</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--gold)" }}>{selectedRow.cgpa || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Phone (WhatsApp)</span>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{selectedRow.phone}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Position Applied</span>
                  <span className={`badge ${POSITION_COLORS[selectedRow.position] ?? "badge-blue"}`} style={{ display: "inline-block", marginTop: "4px" }}>
                    {selectedRow.position}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Club & Leadership Experience</h4>
                <p style={{ fontSize: "14.5px", lineHeight: 1.6, background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "10px", whiteSpace: "pre-wrap", border: "1px solid var(--glass-border)", margin: 0 }}>
                  {selectedRow.experienceDetails || "No club experience details provided."}
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Why Appropriate for Post</h4>
                <p style={{ fontSize: "14.5px", lineHeight: 1.6, background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "10px", whiteSpace: "pre-wrap", border: "1px solid var(--glass-border)", margin: 0 }}>
                  {selectedRow.whyAppropriate || "No response provided."}
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Device / Browser Security Telemetry</h4>
                <div style={{ fontSize: "12px", lineHeight: 1.5, background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "10px", border: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                  {deviceParsed ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                      <div><strong>Platform:</strong> {deviceParsed.platform || "Unknown"}</div>
                      <div><strong>Resolution:</strong> {deviceParsed.screen || "Unknown"}</div>
                      <div><strong>Timezone:</strong> {deviceParsed.timezone || "Unknown"}</div>
                      <div><strong>Language:</strong> {deviceParsed.language || "Unknown"}</div>
                      <div style={{ gridColumn: "1 / -1", wordBreak: "break-all" }}><strong>User Agent:</strong> {deviceParsed.userAgent || "Unknown"}</div>
                      <div style={{ gridColumn: "1 / -1", wordBreak: "break-all" }}><strong>Fingerprint ID:</strong> <span style={{ fontFamily: "monospace", color: "var(--gold)" }}>{deviceParsed.deviceId || "N/A"}</span></div>
                    </div>
                  ) : "No security telemetry collected."}
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <a
                  href={`/api/cv/${selectedRow.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold"
                  style={{ display: "flex", gap: "6px", alignItems: "center" }}
                >
                  📄 View PDF CV
                </a>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="btn-ghost"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
