// components/SuccessCard.tsx
"use client";

import { getSemesterLabel } from "@/lib/semester";

interface Props {
  filename: string;
  submissionId: string;
  semester: number;
  position: string;
  onReplace: () => void;
}

export default function SuccessCard({ filename, submissionId, semester, position, onReplace }: Props) {
  return (
    <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Success Banner */}
      <div className="glass-card" style={{
        padding: "32px", textAlign: "center",
        borderColor: "rgba(34, 197, 94, 0.3)",
        background: "rgba(34, 197, 94, 0.04)"
      }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
        <h2 style={{ fontWeight: 800, fontSize: "24px", marginBottom: "8px", color: "#4ade80" }}>
          Application Submitted!
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6 }}>
          Your application for <strong style={{ color: "var(--gold)" }}>{position}</strong> has been
          received successfully.
        </p>
      </div>

      {/* Submission Details */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "16px",
                     color: "var(--text-secondary)", textTransform: "uppercase",
                     letterSpacing: "0.05em", fontSize: "12px" }}>
          Submission Details
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { label: "Position", value: position, icon: "🎯" },
            { label: "CV File", value: filename, icon: "📄" },
            { label: "Semester", value: getSemesterLabel(semester), icon: "🎓" },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600,
                              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
          <a href={`/api/cv/${submissionId}`} target="_blank" rel="noopener noreferrer" className="btn-outline">
            View CV ↗
          </a>
          <button onClick={onReplace} className="btn-ghost">
            🔄 Replace CV
          </button>
        </div>
      </div>

      {/* What happens next */}
      <div className="glass-card" style={{
        padding: "24px",
        borderColor: "rgba(201, 162, 39, 0.25)",
        background: "rgba(201, 162, 39, 0.04)"
      }}>
        <h3 style={{ fontWeight: 700, fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>
          📋 What Happens Next?
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            {
              step: "1",
              title: "Application Review",
              desc: "Our selection committee will review all submitted applications and CVs.",
            },
            {
              step: "2",
              title: "Shortlisting",
              desc: "Shortlisted candidates will be notified via their registered email and WhatsApp number.",
            },
            {
              step: "3",
              title: "Physical Interview / Presentation",
              desc: "Shortlisted applicants will be called for a physical interview and self-assessment session where all parties of the university will be present to evaluate you.",
            },
            {
              step: "4",
              title: "Final Announcement",
              desc: "The final executive committee will be announced officially by the university administration.",
            },
          ].map(item => (
            <div key={item.step} style={{ display: "flex", gap: "14px" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "rgba(201, 162, 39, 0.15)",
                border: "1px solid rgba(201, 162, 39, 0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 700, color: "var(--gold)", marginTop: "2px"
              }}>{item.step}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "3px" }}>{item.title}</p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
