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

  const calculateTilt = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -14; // max 14 deg tilt
    const rY = ((x - centerX) / centerX) * 16;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.75,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    calculateTilt(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isInteractive || e.touches.length === 0) return;
    calculateTilt(e.touches[0].clientX, e.touches[0].clientY);
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
      {/* 3D Card Container with Perspective */}
      <div
        style={{
          perspective: "1200px",
          width: "100%",
          maxWidth: "480px",
          height: "300px",
          cursor: isInteractive ? "pointer" : "default",
          touchAction: "pan-y",
        }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseLeave}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
            transition: isFlipped ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "transform 0.08s ease-out",
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
              background: "linear-gradient(135deg, rgba(17, 36, 72, 0.96) 0%, rgba(11, 23, 48, 0.98) 100%)",
              border: isVerified
                ? "2px solid rgba(34, 197, 94, 0.8)"
                : isRejected
                ? "2px solid rgba(239, 68, 68, 0.8)"
                : "2px solid rgba(245, 158, 11, 0.7)",
              boxShadow: isVerified
                ? "0 20px 45px -10px rgba(34, 197, 94, 0.35), 0 0 30px rgba(34, 197, 94, 0.25)"
                : "0 20px 45px -10px rgba(245, 158, 11, 0.35), 0 0 30px rgba(245, 158, 11, 0.2)",
              padding: "18px 22px",
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
                background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.35) 0%, rgba(245, 158, 11, 0.25) 35%, rgba(56, 189, 248, 0.15) 55%, transparent 75%)`,
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
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Top Bar: Club Crest & Membership ID */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    boxShadow: "0 0 16px rgba(245,158,11,0.6)",
                    flexShrink: 0,
                  }}
                >
                  ⚽
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--gold-light)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    PaUGSC · Member Pass
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
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
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  background: isVerified
                    ? "rgba(34, 197, 94, 0.25)"
                    : isRejected
                    ? "rgba(239, 68, 68, 0.25)"
                    : "rgba(245, 158, 11, 0.25)",
                  color: isVerified ? "#4ade80" : isRejected ? "#f87171" : "#fbbf24",
                  border: isVerified
                    ? "1px solid rgba(34, 197, 94, 0.6)"
                    : isRejected
                    ? "1px solid rgba(239, 68, 68, 0.6)"
                    : "1px solid rgba(245, 158, 11, 0.6)",
                  boxShadow: isVerified
                    ? "0 0 12px rgba(34, 197, 94, 0.3)"
                    : "0 0 12px rgba(245, 158, 11, 0.3)",
                }}
              >
                {isVerified ? (
                  <>
                    <ShieldCheck size={13} /> Verified
                  </>
                ) : isRejected ? (
                  <>
                    <AlertCircle size={13} /> Rejected
                  </>
                ) : (
                  <>
                    <Clock size={13} className="animate-spin-slow" /> Pending
                  </>
                )}
              </div>
            </div>

            {/* Middle Section: Member Avatar & Details */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", zIndex: 2, margin: "6px 0" }}>
              {member.userAvatar ? (
                <Image
                  src={member.userAvatar}
                  alt={member.fullName}
                  width={60}
                  height={60}
                  style={{
                    borderRadius: "12px",
                    border: "2px solid var(--gold)",
                    flexShrink: 0,
                    boxShadow: "0 0 16px rgba(245,158,11,0.4)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #1d4ed8, #0f172a)",
                    border: "2px solid var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--gold-light)",
                    flexShrink: 0,
                    boxShadow: "0 0 16px rgba(245,158,11,0.3)",
                  }}
                >
                  {member.fullName ? member.fullName[0].toUpperCase() : "P"}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 900,
                    color: "#ffffff",
                    marginBottom: "3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {member.fullName || "Student Name"}
                </h3>
                <div style={{ fontSize: "12.5px", color: "var(--accent)", fontWeight: 700, marginBottom: "2px" }}>
                  ID: {member.studentId || "24200000"} · Sem {member.semester || 1}
                </div>
                <div
                  style={{
                    fontSize: "11.5px",
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {member.department || "Primeasia University"}
                </div>
              </div>
            </div>

            {/* Sports Badge Pills Row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", zIndex: 2 }}>
              {sportsList.slice(0, 3).map((sport, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "8px",
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "var(--gold-pale)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                  }}
                >
                  {sport}
                </span>
              ))}
              {sportsList.length > 3 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 6px",
                    borderRadius: "8px",
                    background: "rgba(56, 189, 248, 0.2)",
                    color: "#38bdf8",
                  }}
                >
                  +{sportsList.length - 3} more
                </span>
              )}
            </div>

            {/* Bottom Bar: Membership Code & bKash TrxID */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                zIndex: 2,
                borderTop: "1px solid rgba(245, 158, 11, 0.25)",
                paddingTop: "8px",
              }}
            >
              <div>
                <div style={{ fontSize: "9.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Membership ID
                </div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--gold)", letterSpacing: "0.04em" }}>
                  {member.membershipNumber || "PAUSC-2026-0001"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  bKash TrxID
                </div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#f43f5e", letterSpacing: "0.04em" }}>
                  {member.transactionId || "PENDING"}
                </div>
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
              background: "linear-gradient(135deg, rgba(19, 41, 82, 0.98) 0%, rgba(10, 20, 42, 0.99) 100%)",
              border: "2px solid rgba(245, 158, 11, 0.6)",
              boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 158, 11, 0.2)",
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            {/* Top Back Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(245, 158, 11, 0.25)", paddingBottom: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--gold-light)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Official Member Clearance · 2026
              </div>
              <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700 }}>
                Blood: <span style={{ color: "#ef4444", fontWeight: 800 }}>{member.bloodGroup || "N/A"}</span>
              </div>
            </div>

            {/* Back Grid Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px", margin: "6px 0" }}>
              <div style={{ background: "rgba(13, 27, 56, 0.8)", padding: "6px 10px", borderRadius: "8px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "9.5px" }}>Jersey Size</span>
                <strong style={{ color: "#fff" }}>{member.jerseySize || "M"}</strong>
                <span style={{ fontSize: "8.5px", color: "var(--gold-pale)", display: "block" }}>(For future use)</span>
              </div>

              <div style={{ background: "rgba(13, 27, 56, 0.8)", padding: "6px 10px", borderRadius: "8px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "9.5px" }}>Fee Paid</span>
                <strong style={{ color: "#22c55e" }}>200 BDT</strong>
                <span style={{ fontSize: "8.5px", color: "#38bdf8", display: "block" }}>bKash Edu Fee</span>
              </div>

              <div style={{ background: "rgba(13, 27, 56, 0.8)", padding: "6px 10px", borderRadius: "8px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "9.5px" }}>Phone / WA</span>
                <strong style={{ color: "#fff", fontSize: "10.5px" }}>{member.phone || "N/A"}</strong>
              </div>

              <div style={{ background: "rgba(13, 27, 56, 0.8)", padding: "6px 10px", borderRadius: "8px" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "9.5px" }}>Issued On</span>
                <strong style={{ color: "#fff", fontSize: "10px" }}>
                  {new Date(member.registeredAt).toLocaleDateString()}
                </strong>
              </div>
            </div>

            {/* Back Disclaimer */}
            <div style={{ fontSize: "9.5px", color: "var(--text-secondary)", lineHeight: 1.4, borderTop: "1px solid rgba(245,158,11,0.2)", paddingTop: "6px" }}>
              This pass verifies general membership for PaUGSC 2026 events, league eligibility, and training. Present this card & PDF slip during club check-ins.
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      {isInteractive && (
        <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "480px" }}>
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="btn-outline"
            style={{ flex: 1, fontSize: "13px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={isFlipped ? "rotate-180 transition-transform" : "transition-transform"} />
            {isFlipped ? "View Front" : "Flip 3D Pass"}
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="btn-neon-gold"
            style={{ flex: 1.5, fontSize: "13px", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Download size={15} />
            {isDownloading ? "Generating PDF..." : "Download PDF Slip"}
          </button>
        </div>
      )}
    </div>
  );
}
