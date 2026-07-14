// components/AdminTable.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { getSemesterLabel } from "@/lib/semester";

export type SubmissionRow = {
  id: string;
  fullName: string;
  studentId: string;
  phone: string;
  position: string;
  semester: number;
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

export default function AdminTable({ rows }: { rows: SubmissionRow[] }) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [downloading, setDownloading] = useState(false);

  const positions = ["All", "President", "Vice President", "General Secretary", "Treasurer"];

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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

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
                  <th>CV</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
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
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>{row.fullName}</div>
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
                      <a
                        href={`/api/cv/${row.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline"
                        style={{ padding: "6px 14px", fontSize: "12px" }}
                      >
                        ↓ Download
                      </a>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
