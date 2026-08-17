// components/HolographicMemberCard.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { downloadMemberSlipPdf } from "@/lib/export-pdf";
import { ShieldCheck, Clock, AlertCircle, Download, RefreshCw, Trophy, Sparkles } from "lucide-react";

export type CardMemberData = {
  membershipNumber: string;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  department: string;
  semester: number | string;
  gender: string;
  bloodGroup: string;
  sportsInterests: string | string[];
  jerseySize: string;
  emergencyContact?: string;
  bkashNumber?: string;
  transactionId: string;
  paymentAmount?: string;
  paymentStatus: string;
  registeredAt: Date | string;
  userAvatar?: string | null;
};

interface Props {
  member: CardMemberData;
  isInteractive?: boolean;
}

export default function HolographicMemberCard({ member, isInteractive = true }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12; // tilt max 12 deg
    const rY = ((x - centerX) / centerX) * 14;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.6,
    });
  };

  const handleMouseLeave = () => {
    if (!isInteractive) return;
    setRotateX(0);
    setRotateY(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  let sportsList: string[] = [];
  if (Array.isArray(member.sportsInterests)) {
    sportsList = member.sportsInterests;
  } else {
    try {
      const parsed = JSON.parse(member.sportsInterests);
      sportsList = Array.isArray(parsed) ? parsed : [member.sportsInterests];
    } catch (e) {
      sportsList = member.sportsInterests ? member.sportsInterests.split(",") : [];
    }
  }

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      downloadMemberSlipPdf({
        membershipNumber: member.membershipNumber || "PAUSC-2026-PREVIEW",
        fullName: member.fullName || "Student Name",
        studentId: member.studentId || "24200000",
        email: member.email || "student@primeasia.edu.bd",
        phone: member.phone || "01XXXXXXXXX",
        department: member.department || "Computer Science & Engineering",
        semester: member.semester || 1,
        gender: member.gender || "Male",
        bloodGroup: member.bloodGroup || "Unknown",
        sportsInterests: JSON.stringify(sportsList),
        jerseySize: member.jerseySize || "M",
        emergencyContact: member.emergencyContact,
        bkashNumber: member.bkashNumber,
        transactionId: member.transactionId || "TRX123456",
        paymentAmount: member.paymentAmount || "200",
        paymentStatus: member.paymentStatus || "pending",
        registeredAt: member.registeredAt || new Date(),
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isVerified = member.paymentStatus === "verified";
  const isRejected = member.paymentStatus === "rejected";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", width: "100%" }}>
      {/* 3D Card Container with Perspective */}
      <div
        style={{
          perspective: "1200px",
          width: "100%",
          maxWidth: "460px",
          height: "300px",
          cursor: isInteractive ? "pointer" : "default",
        }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
            transition: isFlipped ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "transform 0.1s ease-out",
            borderRadius: "20px",
          }}
        >
          {/* ================= FRONT SIDE ================= */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(15, 28, 50, 0.95) 0%, rgba(10, 18, 35, 0.98) 100%)",
              border: isVerified
                ? "2px solid rgba(34, 197, 94, 0.6)"
                : isRejected
                ? "2px solid rgba(239, 68, 68, 0.6)"
                : "2px solid rgba(201, 162, 39, 0.5)",
              boxShadow: isVerified
                ? "0 20px 40px -10px rgba(34, 197, 94, 0.25), 0 0 25px rgba(34, 197, 94, 0.2)"
                : "0 20px 40px -10px rgba(201, 162, 39, 0.25), 0 0 25px rgba(201, 162, 39, 0.15)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            {/* Holographic Sheen Layer */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.25) 0%, rgba(201, 162, 39, 0.15) 30%, transparent 70%)`,
                opacity: glarePosition.opacity,
                pointerEvents: "none",
                borderRadius: "20px",
                transition: "opacity 0.2s ease",
              }}
            />

            {/* Decorative Cyber Background Grid Lines */}
            <div
              style={{
                position: "absolute",
                right: "-20px",
                top: "-20px",
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(201,162,39,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Top Bar: Club Crest & Membership ID */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 900,
                    color: "var(--navy)",
                    boxShadow: "0 0 12px rgba(201,162,39,0.5)",
                  }}
                >
                  ⚽
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--gold)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    PaUGSC · Member Pass
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
                    Primeasia University
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  background: isVerified
                    ? "rgba(34, 197, 94, 0.15)"
                    : isRejected
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(245, 158, 11, 0.15)",
                  color: isVerified ? "#4ade80" : isRejected ? "#f87171" : "#fbbf24",
                  border: isVerified
                    ? "1px solid rgba(34, 197, 94, 0.4)"
                    : isRejected
                    ? "1px solid rgba(239, 68, 68, 0.4)"
                    : "1px solid rgba(245, 158, 11, 0.4)",
                }}
              >
                {isVerified ? (
                  <>
                    <ShieldCheck size={12} /> Verified
                  </>
                ) : isRejected ? (
                  <>
                    <AlertCircle size={12} /> Rejected
                  </>
                ) : (
                  <>
                    <Clock size={12} className="animate-spin-slow" /> Pending
                  </>
                )}
              </div>
            </div>

            {/* Middle Section: Member Avatar & Details */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", zIndex: 2, margin: "10px 0" }}>
              {member.userAvatar ? (
                <Image
                  src={member.userAvatar}
                  alt={member.fullName}
                  width={64}
                  height={64}
                  style={{
                    borderRadius: "14px",
                    border: "2px solid var(--gold)",
                    flexShrink: 0,
                    boxShadow: "0 0 14px rgba(201,162,39,0.3)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #1e3a8a, #0f172a)",
                    border: "2px solid var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--gold)",
                    flexShrink: 0,
                  }}
                >
                  {member.fullName ? member.fullName[0].toUpperCase() : "P"}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 800,
                    color: "#fff",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {member.fullName || "Student Name"}
                </h3>
                <div style={{ fontSize: "12px", color: "var(--gold-light)", fontFamily: "monospace", fontWeight: 700, marginTop: "2px" }}>
                  ID: {member.studentId || "24200000"} · Sem {member.semester || 1}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: "2px",
                  }}
                >
                  {member.department || "Department of CSE"}
                </div>
              </div>
            </div>

            {/* Bottom Row: Membership Number, Sports, Blood Group */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                zIndex: 2,
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: "10px",
              }}
            >
              <div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Member Pass ID
                </div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--gold)", fontFamily: "monospace" }}>
                  {member.membershipNumber || "PAUSC-2026-XXXX"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {member.bloodGroup && member.bloodGroup !== "Unknown" && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      background: "rgba(239, 68, 68, 0.2)",
                      color: "#fca5a5",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      padding: "2px 6px",
                      borderRadius: "6px",
                    }}
                  >
                    🩸 {member.bloodGroup}
                  </span>
                )}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    background: "rgba(79, 142, 247, 0.15)",
                    color: "#93c5fd",
                    border: "1px solid rgba(79, 142, 247, 0.3)",
                    padding: "2px 6px",
                    borderRadius: "6px",
                  }}
                >
                  Jersey: {member.jerseySize || "M"}
                </span>
              </div>
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(10, 18, 35, 0.98) 0%, rgba(15, 28, 50, 0.95) 100%)",
              border: "2px solid rgba(201, 162, 39, 0.4)",
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--gold)", textTransform: "uppercase" }}>
                  Official Verification Data
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PaUGSC 2026</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px 8px", borderRadius: "6px" }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>bKash TrxID</span>
                  <strong style={{ color: "#fff", fontFamily: "monospace" }}>{member.transactionId || "N/A"}</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px 8px", borderRadius: "6px" }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Payment Fee</span>
                  <strong style={{ color: "var(--gold)" }}>{member.paymentAmount || "200"} BDT (Paid)</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px 8px", borderRadius: "6px" }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Phone Number</span>
                  <strong style={{ color: "#fff" }}>{member.phone || "N/A"}</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px 8px", borderRadius: "6px" }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Emergency Contact</span>
                  <strong style={{ color: "#fff" }}>{member.emergencyContact || "Recorded"}</strong>
                </div>
              </div>

              <div style={{ marginTop: "12px", fontSize: "10.5px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                <div style={{ fontWeight: 700, color: "var(--gold-light)", marginBottom: "2px" }}>Selected Sports:</div>
                <div>{sportsList.length > 0 ? sportsList.join(" · ") : "General Athletics"}</div>
              </div>
            </div>

            {/* Mock QR / Barcode Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.05)",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px dashed rgba(201,162,39,0.3)",
              }}
            >
              <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                Scan / Present slip during events & kit distribution
              </div>
              <div style={{ fontSize: "18px" }}>🎟️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons below 3D Card */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="btn-outline"
          style={{ padding: "8px 16px", fontSize: "12.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} className={isFlipped ? "rotate-180 transition-transform" : "transition-transform"} />
          {isFlipped ? "Show Front Pass" : "Flip to Back View"}
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="btn-gold"
          style={{ padding: "8px 20px", fontSize: "12.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Download size={14} />
          {isDownloading ? "Generating PDF..." : "Download Official PDF Slip"}
        </button>
      </div>
    </div>
  );
}
