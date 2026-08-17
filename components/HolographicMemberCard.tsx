// components/HolographicMemberCard.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { downloadMemberSlipPdf, downloadIdCardPdf } from "@/lib/export-pdf";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Sparkles,
  QrCode,
  Cpu,
  FileText,
  ImageIcon,
} from "lucide-react";

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
  const exportFrontRef = useRef<HTMLDivElement>(null);
  const exportBackRef = useRef<HTMLDivElement>(null);

  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloadingSlip, setIsDownloadingSlip] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);

  const calculateTilt = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -16; // 16 deg max 3D tilt
    const rY = ((x - centerX) / centerX) * 18;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.85,
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
    } catch {
      sportsList = member.sportsInterests ? member.sportsInterests.split(",") : [];
    }
  }

  const getSlipPayload = () => ({
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

  const handleDownloadIdCardPdf = async () => {
    setIsDownloadingCard(true);
    try {
      if (exportFrontRef.current && exportBackRef.current) {
        // High-res pixel-perfect DOM capture
        const frontDataUrl = await toPng(exportFrontRef.current, {
          pixelRatio: 3.5,
          quality: 1.0,
          cacheBust: true,
        });

        const backDataUrl = await toPng(exportBackRef.current, {
          pixelRatio: 3.5,
          quality: 1.0,
          cacheBust: true,
        });

        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [85.6, 54], // CR80 standard dimensions
        });

        // Page 1: Exact Front Card
        doc.addImage(frontDataUrl, "PNG", 0, 0, 85.6, 54, undefined, "FAST");

        // Page 2: Exact Back Card
        doc.addPage([85.6, 54], "landscape");
        doc.addImage(backDataUrl, "PNG", 0, 0, 85.6, 54, undefined, "FAST");

        const safeName = (member.fullName || "Student").replace(/[^a-zA-Z0-9]/g, "_");
        doc.save(`PaUGSC_Official_ID_Card_${safeName}_${member.studentId || "2026"}.pdf`);
      } else {
        downloadIdCardPdf(getSlipPayload());
      }
    } catch (err) {
      console.error("DOM Image capture failed, falling back to vector PDF:", err);
      downloadIdCardPdf(getSlipPayload());
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const handleDownloadImages = async () => {
    setIsDownloadingImages(true);
    try {
      if (exportFrontRef.current && exportBackRef.current) {
        const safeName = (member.fullName || "Student").replace(/[^a-zA-Z0-9]/g, "_");

        // Front Image
        const frontDataUrl = await toPng(exportFrontRef.current, { pixelRatio: 3.5, quality: 1.0, cacheBust: true });
        const linkFront = document.createElement("a");
        linkFront.download = `PaUGSC_Card_Front_${safeName}_${member.studentId}.png`;
        linkFront.href = frontDataUrl;
        linkFront.click();

        // Back Image
        setTimeout(async () => {
          if (exportBackRef.current) {
            const backDataUrl = await toPng(exportBackRef.current, { pixelRatio: 3.5, quality: 1.0, cacheBust: true });
            const linkBack = document.createElement("a");
            linkBack.download = `PaUGSC_Card_Back_${safeName}_${member.studentId}.png`;
            linkBack.href = backDataUrl;
            linkBack.click();
          }
        }, 400);
      }
    } catch (err) {
      console.error("Image export failed:", err);
      alert("Could not export card images. Please try the PDF download.");
    } finally {
      setIsDownloadingImages(false);
    }
  };

  const handleDownloadSlip = () => {
    setIsDownloadingSlip(true);
    try {
      downloadMemberSlipPdf(getSlipPayload());
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF slip. Please try again.");
    } finally {
      setIsDownloadingSlip(false);
    }
  };

  const isVerified = member.paymentStatus === "verified";
  const isRejected = member.paymentStatus === "rejected";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
      {/* 3D Card Perspective Wrapper */}
      <div
        style={{
          perspective: "1400px",
          width: "100%",
          maxWidth: "500px",
          height: "310px",
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
            transition: isFlipped ? "transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)" : "transform 0.08s ease-out",
            borderRadius: "22px",
          }}
        >
          {/* ================= FRONT SIDE (3D) ================= */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
              borderRadius: "22px",
              background: "linear-gradient(135deg, #122854 0%, #0d1e3e 50%, #081328 100%)",
              border: isVerified
                ? "2px solid #22c55e"
                : isRejected
                ? "2px solid #ef4444"
                : "2px solid #fbbf24",
              boxShadow: isVerified
                ? "0 25px 50px -12px rgba(34, 197, 94, 0.45), 0 0 35px rgba(34, 197, 94, 0.3)"
                : "0 25px 50px -12px rgba(245, 158, 11, 0.45), 0 0 35px rgba(245, 158, 11, 0.3), inset 0 0 20px rgba(251, 191, 36, 0.15)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            {/* Dynamic Rainbow Holographic Laser Glare Layer */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(251, 191, 36, 0.3) 30%, rgba(56, 189, 248, 0.25) 50%, rgba(168, 85, 247, 0.2) 70%, transparent 85%)`,
                opacity: glarePosition.opacity,
                pointerEvents: "none",
                borderRadius: "22px",
                mixBlendMode: "screen",
                transition: "opacity 0.15s ease",
                zIndex: 1,
              }}
            />

            {/* Futuristic Watermark Glow */}
            <div
              style={{
                position: "absolute",
                right: "-25px",
                top: "-25px",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Layer 1: Top Bar Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                transform: "translateZ(34px)",
                zIndex: 3,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    boxShadow: "0 0 20px rgba(245,158,11,0.7), inset 0 0 8px rgba(255,255,255,0.6)",
                    flexShrink: 0,
                  }}
                >
                  ⚽
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 900,
                      color: "#fbbf24",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      textShadow: "0 0 10px rgba(245,158,11,0.5)",
                    }}
                  >
                    PaUGSC · Official Pass
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#ffffff", lineHeight: 1.1 }}>
                    Primeasia University
                  </div>
                </div>
              </div>

              {/* Hologram Verification Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  background: isVerified
                    ? "rgba(34, 197, 94, 0.3)"
                    : isRejected
                    ? "rgba(239, 68, 68, 0.3)"
                    : "rgba(245, 158, 11, 0.3)",
                  color: isVerified ? "#4ade80" : isRejected ? "#f87171" : "#fef08a",
                  border: isVerified
                    ? "1.5px solid #22c55e"
                    : isRejected
                    ? "1.5px solid #ef4444"
                    : "1.5px solid #fbbf24",
                  boxShadow: isVerified
                    ? "0 0 16px rgba(34, 197, 94, 0.4)"
                    : "0 0 16px rgba(245, 158, 11, 0.4)",
                  transform: "translateZ(38px)",
                }}
              >
                {isVerified ? (
                  <>
                    <ShieldCheck size={14} /> Verified
                  </>
                ) : isRejected ? (
                  <>
                    <AlertCircle size={14} /> Rejected
                  </>
                ) : (
                  <>
                    <Clock size={14} className="animate-spin-slow" /> Pending
                  </>
                )}
              </div>
            </div>

            {/* Layer 2: Member Details & 3D Avatar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                margin: "4px 0",
                transform: "translateZ(30px)",
                zIndex: 3,
              }}
            >
              {member.userAvatar ? (
                <Image
                  src={member.userAvatar}
                  alt={member.fullName}
                  width={64}
                  height={64}
                  style={{
                    borderRadius: "14px",
                    border: "2px solid #fbbf24",
                    flexShrink: 0,
                    objectFit: "cover",
                    boxShadow: "0 0 20px rgba(245,158,11,0.5)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #1d4ed8, #0f172a)",
                    border: "2px solid #fbbf24",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    fontWeight: 900,
                    color: "#fef08a",
                    flexShrink: 0,
                    boxShadow: "0 0 20px rgba(245,158,11,0.4)",
                  }}
                >
                  {member.fullName ? member.fullName[0].toUpperCase() : "P"}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 900,
                    color: "#ffffff",
                    marginBottom: "3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  {member.fullName || "Student Name"}
                </h3>
                <div style={{ fontSize: "13px", color: "#38bdf8", fontWeight: 800, marginBottom: "2px" }}>
                  ID: {member.studentId || "24200000"} · Sem {member.semester || 1}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#cbd5e1",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {member.department || "Primeasia University"}
                </div>
              </div>

              {/* Gold Smart Chip Icon */}
              <div
                style={{
                  width: 32,
                  height: 24,
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #fef08a 0%, #ca8a04 100%)",
                  border: "1px solid #eab308",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#713f12",
                  boxShadow: "0 0 10px rgba(234,179,8,0.5)",
                  flexShrink: 0,
                }}
              >
                <Cpu size={16} />
              </div>
            </div>

            {/* Layer 3: Sports Disciplines Pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                transform: "translateZ(24px)",
                zIndex: 3,
              }}
            >
              {sportsList.slice(0, 3).map((sport, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: "8px",
                    background: "rgba(245, 158, 11, 0.25)",
                    color: "#fef08a",
                    border: "1px solid rgba(251, 191, 36, 0.5)",
                    boxShadow: "0 0 10px rgba(245,158,11,0.2)",
                  }}
                >
                  {sport}
                </span>
              ))}
              {sportsList.length > 3 && (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 800,
                    padding: "3px 7px",
                    borderRadius: "8px",
                    background: "rgba(56, 189, 248, 0.25)",
                    color: "#7dd3fc",
                    border: "1px solid rgba(56, 189, 248, 0.5)",
                  }}
                >
                  +{sportsList.length - 3} more
                </span>
              )}
            </div>

            {/* Layer 4: Bottom Security Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                transform: "translateZ(26px)",
                zIndex: 3,
                borderTop: "1px solid rgba(251, 191, 36, 0.35)",
                paddingTop: "8px",
              }}
            >
              <div>
                <div style={{ fontSize: "9.5px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  Membership Code
                </div>
                <div style={{ fontSize: "13px", fontWeight: 900, color: "#fef08a", letterSpacing: "0.06em" }}>
                  {member.membershipNumber || "PAUSC-2026-0001"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9.5px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  bKash TrxID (200 Tk)
                </div>
                <div style={{ fontSize: "13px", fontWeight: 900, color: "#f43f5e", letterSpacing: "0.06em" }}>
                  {member.transactionId || "PENDING"}
                </div>
              </div>
            </div>
          </div>

          {/* ================= BACK SIDE (3D) ================= */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              transformStyle: "preserve-3d",
              borderRadius: "22px",
              background: "linear-gradient(135deg, #132b58 0%, #0c1a36 50%, #071124 100%)",
              border: "2px solid #fbbf24",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.25)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            {/* Top Back Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(251, 191, 36, 0.35)",
                paddingBottom: "8px",
                transform: "translateZ(25px)",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#fef08a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Official Member Clearance · 2026
              </div>
              <div style={{ fontSize: "11.5px", color: "#38bdf8", fontWeight: 800 }}>
                Blood: <span style={{ color: "#ef4444", fontWeight: 900 }}>{member.bloodGroup || "N/A"}</span>
              </div>
            </div>

            {/* Back Grid Details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                fontSize: "11px",
                margin: "4px 0",
                transform: "translateZ(22px)",
              }}
            >
              <div style={{ background: "rgba(16, 32, 66, 0.9)", padding: "7px 10px", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.2)" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px", fontWeight: 700 }}>Jersey Size</span>
                <strong style={{ color: "#ffffff", fontSize: "12px" }}>{member.jerseySize || "M"}</strong>
                <span style={{ fontSize: "8.5px", color: "#fef08a", display: "block" }}>(For future use)</span>
              </div>

              <div style={{ background: "rgba(16, 32, 66, 0.9)", padding: "7px 10px", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.3)" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px", fontWeight: 700 }}>Fee Paid</span>
                <strong style={{ color: "#4ade80", fontSize: "12px" }}>200 BDT</strong>
                <span style={{ fontSize: "8.5px", color: "#38bdf8", display: "block" }}>bKash Edu Fee</span>
              </div>

              <div style={{ background: "rgba(16, 32, 66, 0.9)", padding: "7px 10px", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.2)" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px", fontWeight: 700 }}>Phone / WA</span>
                <strong style={{ color: "#ffffff", fontSize: "11px" }}>{member.phone || "N/A"}</strong>
              </div>

              <div style={{ background: "rgba(16, 32, 66, 0.9)", padding: "7px 10px", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.2)" }}>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px", fontWeight: 700 }}>Issued Date</span>
                <strong style={{ color: "#ffffff", fontSize: "10.5px" }}>
                  {new Date(member.registeredAt).toLocaleDateString()}
                </strong>
              </div>
            </div>

            {/* Back Disclaimer with QR Code Graphic */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                borderTop: "1px solid rgba(251,191,36,0.25)",
                paddingTop: "8px",
                transform: "translateZ(24px)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  background: "#ffffff",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0b1730",
                  flexShrink: 0,
                  boxShadow: "0 0 10px rgba(255,255,255,0.4)",
                }}
              >
                <QrCode size={28} />
              </div>
              <div style={{ fontSize: "9.5px", color: "#cbd5e1", lineHeight: 1.4 }}>
                This pass certifies active club membership for 2026 tournaments, coaching sessions, and events. Present this pass or PDF slip upon check-in.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HIDDEN 2D NODES FOR 100% PIXEL-PERFECT EXACT IMAGE & PDF EXPORT
         ========================================================================= */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", opacity: 0, pointerEvents: "none", zIndex: -100 }}>
        {/* FRONT EXPORT NODE */}
        <div
          ref={exportFrontRef}
          style={{
            width: "500px",
            height: "310px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, #122854 0%, #0d1e3e 50%, #081328 100%)",
            border: isVerified
              ? "2px solid #22c55e"
              : isRejected
              ? "2px solid #ef4444"
              : "2px solid #fbbf24",
            boxShadow: isVerified
              ? "0 25px 50px -12px rgba(34, 197, 94, 0.45), 0 0 35px rgba(34, 197, 94, 0.3)"
              : "0 25px 50px -12px rgba(245, 158, 11, 0.45), 0 0 35px rgba(245, 158, 11, 0.3), inset 0 0 20px rgba(251, 191, 36, 0.15)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Radial Watermark */}
          <div
            style={{
              position: "absolute",
              right: "-25px",
              top: "-25px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Top Bar Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  boxShadow: "0 0 20px rgba(245,158,11,0.7)",
                  flexShrink: 0,
                }}
              >
                ⚽
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    color: "#fbbf24",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    textShadow: "0 0 10px rgba(245,158,11,0.5)",
                  }}
                >
                  PaUGSC · Official Pass
                </div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#ffffff", lineHeight: 1.1 }}>
                  Primeasia University
                </div>
              </div>
            </div>

            {/* Verification Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: isVerified ? "rgba(34, 197, 94, 0.3)" : isRejected ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)",
                color: isVerified ? "#4ade80" : isRejected ? "#f87171" : "#fef08a",
                border: isVerified ? "1.5px solid #22c55e" : isRejected ? "1.5px solid #ef4444" : "1.5px solid #fbbf24",
                boxShadow: isVerified ? "0 0 16px rgba(34, 197, 94, 0.4)" : "0 0 16px rgba(245, 158, 11, 0.4)",
              }}
            >
              {isVerified ? "✓ VERIFIED" : isRejected ? "✕ REJECTED" : "⏱ PENDING"}
            </div>
          </div>

          {/* Member Details */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "4px 0", position: "relative", zIndex: 2 }}>
            {member.userAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={member.userAvatar}
                alt={member.fullName}
                crossOrigin="anonymous"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "14px",
                  border: "2px solid #fbbf24",
                  objectFit: "cover",
                  boxShadow: "0 0 20px rgba(245,158,11,0.5)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #1d4ed8, #0f172a)",
                  border: "2px solid #fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  fontWeight: 900,
                  color: "#fef08a",
                  boxShadow: "0 0 20px rgba(245,158,11,0.4)",
                  flexShrink: 0,
                }}
              >
                {member.fullName ? member.fullName[0].toUpperCase() : "P"}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#ffffff",
                  marginBottom: "3px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {member.fullName || "Student Name"}
              </h3>
              <div style={{ fontSize: "13px", color: "#38bdf8", fontWeight: 800, marginBottom: "2px" }}>
                ID: {member.studentId || "24200000"} · Sem {member.semester || 1}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {member.department || "Primeasia University"}
              </div>
            </div>

            {/* Smart Chip */}
            <div
              style={{
                width: "32px",
                height: "24px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #fef08a 0%, #ca8a04 100%)",
                border: "1px solid #eab308",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#713f12",
                boxShadow: "0 0 10px rgba(234,179,8,0.5)",
                flexShrink: 0,
              }}
            >
              <Cpu size={16} />
            </div>
          </div>

          {/* Sports Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", position: "relative", zIndex: 2 }}>
            {sportsList.slice(0, 3).map((sport, i) => (
              <span
                key={i}
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "3px 9px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.25)",
                  color: "#fef08a",
                  border: "1px solid rgba(251, 191, 36, 0.5)",
                  boxShadow: "0 0 10px rgba(245,158,11,0.2)",
                }}
              >
                {sport}
              </span>
            ))}
            {sportsList.length > 3 && (
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "3px 7px",
                  borderRadius: "8px",
                  background: "rgba(56, 189, 248, 0.25)",
                  color: "#7dd3fc",
                  border: "1px solid rgba(56, 189, 248, 0.5)",
                }}
              >
                +{sportsList.length - 3} more
              </span>
            )}
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid rgba(251, 191, 36, 0.35)",
              paddingTop: "8px",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div>
              <div style={{ fontSize: "9.5px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                Membership Code
              </div>
              <div style={{ fontSize: "13px", fontWeight: 900, color: "#fef08a", letterSpacing: "0.06em" }}>
                {member.membershipNumber || "PAUSC-2026-0001"}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "9.5px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                bKash TrxID (200 Tk)
              </div>
              <div style={{ fontSize: "13px", fontWeight: 900, color: "#f43f5e", letterSpacing: "0.06em" }}>
                {member.transactionId || "PENDING"}
              </div>
            </div>
          </div>
        </div>

        {/* BACK EXPORT NODE */}
        <div
          ref={exportBackRef}
          style={{
            width: "500px",
            height: "310px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, #132b58 0%, #0c1a36 50%, #071124 100%)",
            border: "2px solid #fbbf24",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.25)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Top Back Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(251, 191, 36, 0.35)",
              paddingBottom: "8px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 900, color: "#fef08a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Official Member Clearance · 2026
            </div>
            <div style={{ fontSize: "11.5px", color: "#38bdf8", fontWeight: 800 }}>
              Blood: <span style={{ color: "#ef4444", fontWeight: 900 }}>{member.bloodGroup || "N/A"}</span>
            </div>
          </div>

          {/* 4-Grid Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px", margin: "4px 0" }}>
            <div style={{ background: "rgba(16, 32, 66, 0.9)", padding: "7px 10px", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.2)" }}>
              <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px", fontWeight: 700 }}>Jersey Size</span>
              <strong style={{ color: "#ffffff", fontSize: "12px" }}>{member.jerseySize || "M"}</strong>
              <span style={{ fontSize: "8.5px", color: "#fef08a", display: "block" }}>(For future use)</span>
            </div>

            <div style={{ background: "rgba(16, 32, 66, 0.9)", padding: "7px 10px", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.3)" }}>
              <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px", fontWeight: 700 }}>Fee Paid</span>
              <strong style={{ color: "#4ade80", fontSize: "12px" }}>200 BDT</strong>
              <span style={{ fontSize: "8.5px", color: "#38bdf8", display: "block" }}>bKash Edu Fee</span>
            </div>

            <div style={{ background: "rgba(16, 32, 66, 0.9)", padding: "7px 10px", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.2)" }}>
              <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px", fontWeight: 700 }}>Phone / WA</span>
              <strong style={{ color: "#ffffff", fontSize: "11px" }}>{member.phone || "N/A"}</strong>
            </div>

            <div style={{ background: "rgba(16, 32, 66, 0.9)", padding: "7px 10px", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.2)" }}>
              <span style={{ color: "#94a3b8", display: "block", fontSize: "9.5px", fontWeight: 700 }}>Issued Date</span>
              <strong style={{ color: "#ffffff", fontSize: "10.5px" }}>
                {new Date(member.registeredAt).toLocaleDateString()}
              </strong>
            </div>
          </div>

          {/* QR Code & Disclaimer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderTop: "1px solid rgba(251,191,36,0.25)",
              paddingTop: "8px",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: "#ffffff",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0b1730",
                flexShrink: 0,
                boxShadow: "0 0 10px rgba(255,255,255,0.4)",
              }}
            >
              <QrCode size={28} />
            </div>
            <div style={{ fontSize: "9.5px", color: "#cbd5e1", lineHeight: 1.4 }}>
              This pass certifies active club membership for 2026 tournaments, coaching sessions, and events. Present this pass or PDF slip upon check-in.
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE CONTROL BUTTONS
         ========================================================================= */}
      {isInteractive && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "500px" }}>
          {/* Main Action: Download Official Dual-Sided ID Card PDF (Exact 1:1 Pixel-Perfect) */}
          <button
            type="button"
            onClick={handleDownloadIdCardPdf}
            disabled={isDownloadingCard}
            className="btn-neon-gold"
            style={{
              width: "100%",
              fontSize: "13.5px",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 900,
              boxShadow: "0 0 25px rgba(245, 158, 11, 0.4)",
            }}
          >
            <Sparkles size={17} color="#0b1730" />
            {isDownloadingCard ? "Rendering 1:1 HD ID Card..." : "Download Official ID Card (Exact PDF)"}
          </button>

          {/* Secondary Actions: Flip Card, Download Images PNG, Download Registration Slip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "8px", width: "100%" }}>
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="btn-outline"
              style={{
                fontSize: "12px",
                padding: "9px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                fontWeight: 800,
              }}
            >
              <RefreshCw size={13} className={isFlipped ? "rotate-180 transition-transform duration-500" : "transition-transform duration-500"} />
              {isFlipped ? "Front" : "Flip Pass"}
            </button>

            <button
              type="button"
              onClick={handleDownloadImages}
              disabled={isDownloadingImages}
              className="btn-outline"
              style={{
                fontSize: "12px",
                padding: "9px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                borderColor: "rgba(245, 158, 11, 0.4)",
                color: "#fbbf24",
                fontWeight: 800,
              }}
            >
              <ImageIcon size={13} />
              {isDownloadingImages ? "Exporting..." : "Save PNG"}
            </button>

            <button
              type="button"
              onClick={handleDownloadSlip}
              disabled={isDownloadingSlip}
              className="btn-outline"
              style={{
                fontSize: "12px",
                padding: "9px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                borderColor: "rgba(56, 189, 248, 0.4)",
                color: "#7dd3fc",
                fontWeight: 800,
              }}
            >
              <FileText size={13} />
              {isDownloadingSlip ? "Slip..." : "PDF Slip"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
