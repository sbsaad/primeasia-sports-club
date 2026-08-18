// components/MemberRegistrationForm.tsx
"use client";

import { useState, useTransition, useRef } from "react";
import { registerMember } from "@/actions/member";
import { DEPARTMENTS, SPORTS_OPTIONS, BLOOD_GROUPS, JERSEY_SIZES, GENDERS } from "@/lib/validations";
import { calculateSemester, getSemesterLabel } from "@/lib/semester";
import { parseReceiptImage, extractReceiptInfo } from "@/lib/receipt-parser";
import HolographicMemberCard from "./HolographicMemberCard";
import confetti from "canvas-confetti";
import {
  User,
  Trophy,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Info,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Edit3,
  List,
  UploadCloud,
  ClipboardPaste,
  RefreshCw,
  Flag,
  AlertOctagon,
} from "lucide-react";

interface ExistingMemberData {
  id: string;
  membershipNumber: string;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  department: string;
  semester: number;
  gender: string;
  bloodGroup: string;
  sportsInterests: string;
  jerseySize: string;
  emergencyContact: string;
  bkashNumber: string;
  transactionId: string;
  paymentAmount: string;
  paymentStatus: string;
  registeredAt: Date;
}

interface Props {
  existingMember?: ExistingMemberData | null;
  userEmail?: string;
  userName?: string;
  userAvatar?: string | null;
  membershipFee?: string;
  validityLabel?: string;
}

type FormStep = 1 | 2 | 3 | 4;

export default function MemberRegistrationForm({
  existingMember,
  userEmail = "",
  userName = "",
  userAvatar = null,
  membershipFee = "200",
  validityLabel = "SEASON 2026-2027",
}: Props) {
  const isVerified = existingMember?.paymentStatus === "verified";
  const [isEditing, setIsEditing] = useState(!existingMember);
  const [justSaved, setJustSaved] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [step, setStep] = useState<FormStep>(existingMember ? 4 : 1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    membershipNumber: string;
    semester: number;
  } | null>(existingMember ? { membershipNumber: existingMember.membershipNumber, semester: existingMember.semester } : null);

  const [copiedText, setCopiedText] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(existingMember?.fullName ?? userName);
  const [studentId, setStudentId] = useState(existingMember?.studentId ?? "");
  const [phone, setPhone] = useState(existingMember?.phone ?? "");
  
  // Department State: Dropdown + Manual Input
  const initialIsManual = Boolean(
    existingMember?.department &&
    (!DEPARTMENTS.includes(existingMember.department as (typeof DEPARTMENTS)[number]) || existingMember.department === "✍️ Other / Write Manually")
  );
  const [isManualDept, setIsManualDept] = useState(initialIsManual);
  const [selectedDept, setSelectedDept] = useState(
    initialIsManual ? "✍️ Other / Write Manually" : (existingMember?.department ?? DEPARTMENTS[0])
  );
  const [manualDeptName, setManualDeptName] = useState(
    initialIsManual ? existingMember?.department ?? "" : ""
  );

  const getEffectiveDepartment = () => {
    if (isManualDept || selectedDept === "✍️ Other / Write Manually") {
      return manualDeptName.trim();
    }
    return selectedDept.trim();
  };

  const [gender, setGender] = useState<"Male" | "Female" | "Other">(
    (existingMember?.gender as (typeof GENDERS)[number]) ?? "Male"
  );
  const [bloodGroup, setBloodGroup] = useState<string>(existingMember?.bloodGroup ?? "Unknown");

  // Sports multi-select
  const initialSports = () => {
    if (!existingMember?.sportsInterests) return ["Football", "Cricket"];
    try {
      const parsed = JSON.parse(existingMember.sportsInterests);
      return Array.isArray(parsed) ? parsed : ["Football"];
    } catch {
      return ["Football"];
    }
  };
  const [selectedSports, setSelectedSports] = useState<string[]>(initialSports());
  const [jerseySize, setJerseySize] = useState<"S" | "M" | "L" | "XL" | "XXL">(
    (existingMember?.jerseySize as "S" | "M" | "L" | "XL" | "XXL") ?? "M"
  );
  const [emergencyContact, setEmergencyContact] = useState(existingMember?.emergencyContact ?? "");

  // Payment & OCR State
  const [bkashNumber, setBkashNumber] = useState(existingMember?.bkashNumber ?? "");
  const [transactionId, setTransactionId] = useState(existingMember?.transactionId ?? "");
  const [isScanningSlip, setIsScanningSlip] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [ocrSuccess, setOcrSuccess] = useState<{ trx?: string; sid?: string; bkash?: string } | null>(null);
  
  // Fraud / Student ID Mismatch Red Flag State
  const [scannedReceiptStudentId, setScannedReceiptStudentId] = useState<string>("");
  const [isFlaggedMismatch, setIsFlaggedMismatch] = useState<boolean>(false);

  const [showPasteSms, setShowPasteSms] = useState(false);
  const [pastedSmsText, setPastedSmsText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const semResult = calculateSemester(studentId);

  const toggleSport = (sportName: string) => {
    setSelectedSports((prev) =>
      prev.includes(sportName) ? prev.filter((s) => s !== sportName) : [...prev, sportName]
    );
  };

  const copyBkashGuide = () => {
    const text = `bKash App ➔ Education Fee (শিক্ষা ফি) ➔ Primeasia University ➔ Others (Fee: ${membershipFee} BDT) ➔ Enter Student ID and complete payment.`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const triggerError = (msg: string) => {
    setError(msg);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Verifies if receipt student ID matches registered student ID
  const checkStudentIdMismatch = (receiptSid: string) => {
    if (!receiptSid) return;
    const cleanReceiptSid = receiptSid.trim();
    const cleanFormSid = studentId.trim();

    setScannedReceiptStudentId(cleanReceiptSid);

    if (cleanFormSid && cleanReceiptSid !== cleanFormSid) {
      setIsFlaggedMismatch(true);
    } else {
      setIsFlaggedMismatch(false);
    }
  };

  // Pure Client-side OCR: reads text locally in browser without uploading anywhere
  const handleSlipImageScan = async (file: File) => {
    if (!file) return;
    setIsScanningSlip(true);
    setError("");
    setOcrStatus("Scanning image in browser...");

    try {
      const parsed = await parseReceiptImage(file, (status) => {
        setOcrStatus(status);
      });

      const extractedInfo: { trx?: string; sid?: string; bkash?: string } = {};

      if (parsed.transactionId) {
        setTransactionId(parsed.transactionId);
        extractedInfo.trx = parsed.transactionId;
      }
      if (parsed.bkashNumber) {
        setBkashNumber(parsed.bkashNumber);
        extractedInfo.bkash = parsed.bkashNumber;
      }
      if (parsed.studentId) {
        extractedInfo.sid = parsed.studentId;
        checkStudentIdMismatch(parsed.studentId);
      }

      if (parsed.transactionId || parsed.studentId || parsed.bkashNumber) {
        setOcrSuccess(extractedInfo);
        setOcrStatus("✅ Information retrieved & filled below!");
      } else {
        setOcrStatus("Could not find TrxID automatically. Please type it in below.");
      }
    } catch (err: unknown) {
      console.warn("Client OCR notice:", err instanceof Error ? err.message : String(err));
      setOcrStatus("Scan finished. Please verify the Transaction ID below.");
    } finally {
      setIsScanningSlip(false);
    }
  };

  // Instant SMS / Text Parser (0ms latency)
  const handleParseSmsText = (text: string) => {
    setPastedSmsText(text);
    if (!text.trim()) return;

    const parsed = extractReceiptInfo(text);
    const extractedInfo: { trx?: string; sid?: string; bkash?: string } = {};

    if (parsed.transactionId) {
      setTransactionId(parsed.transactionId);
      extractedInfo.trx = parsed.transactionId;
    }
    if (parsed.bkashNumber) {
      setBkashNumber(parsed.bkashNumber);
      extractedInfo.bkash = parsed.bkashNumber;
    }
    if (parsed.studentId) {
      extractedInfo.sid = parsed.studentId;
      checkStudentIdMismatch(parsed.studentId);
    }

    if (parsed.transactionId || parsed.studentId || parsed.bkashNumber) {
      setOcrSuccess(extractedInfo);
      setOcrStatus("✅ Details instantly extracted from text!");
    }
  };

  const handleNextStep = () => {
    setError("");

    if (step === 1) {
      if (!fullName.trim()) return triggerError("Full Name is required.");
      if (!studentId.trim()) return triggerError("Student ID is required.");
      if (studentId.trim().length < 8) return triggerError("Please enter a valid 9-digit Student ID (e.g. 242003032).");
      if (!semResult.isValid) return triggerError(semResult.error ?? "Invalid Primeasia Student ID.");
      if (!phone.trim()) return triggerError("Phone number is required.");
      if (!/^[\d+\-\s()]{10,15}$/.test(phone.trim())) return triggerError("Enter a valid mobile number.");
      
      const effectiveDept = getEffectiveDepartment();
      if (!effectiveDept) return triggerError("Please select or manually enter your department name.");
      
      setStep(2);
    } else if (step === 2) {
      if (selectedSports.length === 0) return triggerError("Please select at least one sport you are interested in.");
      setStep(3);
    } else if (step === 3) {
      if (!transactionId.trim() || transactionId.trim().length < 6) {
        return triggerError("Please enter a valid bKash Transaction ID (TrxID).");
      }
      setStep(4);
    }
  };

  const handleSubmitRegistration = () => {
    if (isVerified) {
      return triggerError("Your application has been verified and locked. Modifications are disabled.");
    }
    setError("");

    const effectiveDept = getEffectiveDepartment();
    if (!effectiveDept) {
      return triggerError("Please select or manually enter your department name.");
    }

    // Telemetry
    let deviceId = "";
    if (typeof window !== "undefined") {
      try {
        deviceId = localStorage.getItem("pausc_dev_id") || "";
        if (!deviceId) {
          deviceId = "dev_" + Math.random().toString(36).substring(2, 12);
          localStorage.setItem("pausc_dev_id", deviceId);
        }
      } catch {
        // Ignore localStorage error
      }
    }

    const browserInfo = {
      deviceId,
      screen: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "",
      language: typeof navigator !== "undefined" ? navigator.language : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
      detectedReceiptSid: scannedReceiptStudentId,
    };

    const finalIsFlagged = Boolean(
      isFlaggedMismatch || (scannedReceiptStudentId && scannedReceiptStudentId.trim() !== studentId.trim())
    );
    const finalFlagReason = finalIsFlagged
      ? `Payment Receipt Student ID (${scannedReceiptStudentId.trim()}) does not match registered Student ID (${studentId.trim()})`
      : "";

    startTransition(async () => {
      try {
        const res = await registerMember({
          fullName: fullName.trim(),
          studentId: studentId.trim(),
          phone: phone.trim(),
          department: effectiveDept,
          gender,
          bloodGroup: bloodGroup as (typeof BLOOD_GROUPS)[number],
          sportsInterests: selectedSports,
          jerseySize,
          emergencyContact: emergencyContact.trim(),
          bkashNumber: bkashNumber.trim(),
          transactionId: transactionId.trim().toUpperCase(),
          isFlagged: finalIsFlagged,
          flaggedReason: finalFlagReason,
          receiptStudentId: scannedReceiptStudentId.trim(),
          deviceInfo: JSON.stringify(browserInfo),
        });

        if (res.success) {
          setSuccessData({
            membershipNumber: res.membershipNumber,
            semester: res.semester,
          });
          setIsEditing(false);
          setJustSaved(true);
          setSaveSuccessMsg(
            existingMember
              ? "✅ Your registration details and bKash Transaction ID have been updated successfully! Your updated application is submitted to the admin team."
              : "🎉 Registration completed successfully! Your digital membership pass has been generated."
          );
          setStep(4);

          // Confetti celebration
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#f59e0b", "#38bdf8", "#22c55e", "#f43f5e"],
            });
          } catch {
            // Ignore confetti error
          }
        } else {
          setError(res.error || "Failed to submit registration.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  const finalDepartmentDisplay = getEffectiveDepartment() || "Primeasia University";

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
      {/* Verified Status Banner */}
      {isVerified && (
        <div
          className="glass-card animate-fade-in-up"
          style={{
            marginBottom: "24px",
            padding: "16px 20px",
            borderColor: "rgba(34, 197, 94, 0.6)",
            background: "rgba(34, 197, 94, 0.15)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(34, 197, 94, 0.25)",
              border: "1.5px solid #22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4ade80",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#86efac", marginBottom: "2px" }}>
              Official Membership Approved & Verified
            </div>
            <div style={{ fontSize: "12.5px", color: "#e2e8f0" }}>
              Your application has been verified by the sports authority. Details are locked and certified for the 2026 season.
            </div>
          </div>
        </div>
      )}

      {/* Progress Wizard Steps */}
      {!isVerified && (isEditing || !existingMember) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "10%",
              right: "10%",
              height: "2px",
              background: "rgba(255,255,255,0.1)",
              zIndex: 0,
              transform: "translateY(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "10%",
              width: step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "80%",
              height: "2px",
              background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
              zIndex: 0,
              transform: "translateY(-50%)",
              transition: "width 0.4s ease",
            }}
          />

          {[
            { s: 1, label: "Student Details", icon: <User size={16} /> },
            { s: 2, label: "Sports & Apparel", icon: <Trophy size={16} /> },
            { s: 3, label: `bKash Fee (${membershipFee} ৳)`, icon: <CreditCard size={16} /> },
            { s: 4, label: "Review & Pass", icon: <Sparkles size={16} /> },
          ].map((item) => {
            const isDone = step > item.s;
            const isCurrent = step === item.s;
            return (
              <div
                key={item.s}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone
                      ? "#22c55e"
                      : isCurrent
                      ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                      : "rgba(16, 32, 66, 0.9)",
                    border: isCurrent
                      ? "2px solid #fde047"
                      : isDone
                      ? "2px solid #22c55e"
                      : "1.5px solid rgba(255,255,255,0.15)",
                    color: isDone || isCurrent ? "#0b1730" : "#94a3b8",
                    boxShadow: isCurrent ? "0 0 16px rgba(245,158,11,0.5)" : "none",
                    fontWeight: 800,
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDone ? <Check size={18} /> : item.icon}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? "#fbbf24" : isDone ? "#86efac" : "#94a3b8",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          className="animate-slide-up"
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1.5px solid rgba(239, 68, 68, 0.5)",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#fca5a5",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ================= STEP 1: STUDENT DETAILS ================= */}
      {step === 1 && !isVerified && (
        <div className="glass-card animate-slide-up" style={{ padding: "32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "rgba(245,158,11,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fbbf24",
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Step 1: Academic & Personal Information
              </h2>
              <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "2px 0 0" }}>
                Provide your official Primeasia University student details
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
                Full Name <span style={{ color: "#fbbf24" }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Md. Tanvir Ahmed"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Student ID (9 Digits) */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
                Primeasia Student ID (9 Digits) <span style={{ color: "#fbbf24" }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 242003032 (9-digit ID)"
                value={studentId}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setStudentId(val);
                  if (scannedReceiptStudentId) {
                    checkStudentIdMismatch(scannedReceiptStudentId);
                  }
                }}
              />
              {studentId.length >= 3 && (
                <div style={{ marginTop: "6px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  {semResult.isValid ? (
                    <span style={{ color: "#86efac", fontWeight: 700 }}>
                      ✓ {getSemesterLabel(semResult.semester)} ({semResult.admitYear} {semResult.admitTermName})
                    </span>
                  ) : (
                    <span style={{ color: "#fca5a5", fontWeight: 600 }}>⚠ {semResult.error}</span>
                  )}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
                Active Phone / WhatsApp <span style={{ color: "#fbbf24" }}>*</span>
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                Emergency Contact (Parent / Guardian)
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="01XXXXXXXXX"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
              />
            </div>

            {/* Academic Department (Dropdown + Manual Input) */}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0" }}>
                  Academic Department <span style={{ color: "#fbbf24" }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualDept(!isManualDept)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38bdf8",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "underline",
                  }}
                >
                  {isManualDept ? (
                    <>
                      <List size={13} /> Choose from List
                    </>
                  ) : (
                    <>
                      <Edit3 size={13} /> ✍️ Write Department Manually
                    </>
                  )}
                </button>
              </div>

              {!isManualDept ? (
                <div>
                  <select
                    className="select-field"
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      if (e.target.value === "✍️ Other / Write Manually") {
                        setIsManualDept(true);
                      }
                    }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="animate-slide-up">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type your full department name (e.g. Computer Science & Engineering)"
                    value={manualDeptName}
                    onChange={(e) => setManualDeptName(e.target.value)}
                    autoFocus
                  />
                  <span style={{ fontSize: "11.5px", color: "#fbbf24", marginTop: "4px", display: "block" }}>
                    ✍️ Manually typing custom department name. Click &quot;Choose from List&quot; above to switch back.
                  </span>
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
                Gender <span style={{ color: "#fbbf24" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: gender === g ? "1.5px solid #fbbf24" : "1px solid rgba(255,255,255,0.12)",
                      background: gender === g ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.04)",
                      color: gender === g ? "#fef08a" : "#cbd5e1",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
                Blood Group <span style={{ color: "#fbbf24" }}>*</span>
              </label>
              <select
                className="select-field"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
            <button onClick={handleNextStep} className="btn-gold" style={{ padding: "12px 28px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Next: Sports & Apparel →
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: SPORTS & APPAREL ================= */}
      {step === 2 && !isVerified && (
        <div className="glass-card animate-slide-up" style={{ padding: "32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "rgba(245,158,11,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fbbf24",
              }}
            >
              <Trophy size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Step 2: Sports Disciplines & Apparel
              </h2>
              <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "2px 0 0" }}>
                Select all sports you are interested in playing or supporting
              </p>
            </div>
          </div>

          {/* Sports Grid */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
              Select Interested Sports (Multi-select) <span style={{ color: "#fbbf24" }}>*</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
              {SPORTS_OPTIONS.map((sport) => {
                const isSelected = selectedSports.includes(sport.name);
                return (
                  <div
                    key={sport.id}
                    onClick={() => toggleSport(sport.name)}
                    style={{
                      padding: "12px 10px",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.12)",
                      background: isSelected ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isSelected ? "translateY(-2px)" : "none",
                      boxShadow: isSelected ? "0 8px 16px -4px rgba(245,158,11,0.35)" : undefined,
                    }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "4px" }}>{sport.icon}</div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: isSelected ? "#fef08a" : "#ffffff" }}>
                      {sport.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jersey Size Selector */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                Preferred Jersey Size <span style={{ color: "#fbbf24" }}>*</span>
              </label>
              <span style={{ fontSize: "11px", background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>
                For Later Use
              </span>
            </div>

            {/* Explicit Notice as requested */}
            <div
              style={{
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "12.5px",
                color: "#fde047",
                marginBottom: "14px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Notice:</strong> Jersey size is recorded for future sports tournaments & club events.
                We are <u>not</u> giving any jersey right now.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
              {JERSEY_SIZES.map((j) => {
                const isSelected = jerseySize === j.size;
                return (
                  <button
                    key={j.size}
                    type="button"
                    onClick={() => setJerseySize(j.size as "S" | "M" | "L" | "XL" | "XXL")}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.12)",
                      background: isSelected ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.03)",
                      color: isSelected ? "#fef08a" : "#cbd5e1",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "2px" }}>{j.size}</div>
                    <div style={{ fontSize: "10.5px", opacity: 0.85 }}>{j.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
            <button onClick={() => setStep(1)} className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleNextStep} className="btn-gold" style={{ padding: "12px 28px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Next: Payment Details →
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: BKASH PAYMENT & RED FLAG VERIFICATION ================= */}
      {step === 3 && !isVerified && (
        <div className="glass-card animate-slide-up" style={{ padding: "32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "rgba(226, 19, 110, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f43f5e",
              }}
            >
              <CreditCard size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Step 3: Official bKash Fee Payment ({membershipFee} BDT)
              </h2>
              <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "2px 0 0" }}>
                Scan receipt screenshot or paste SMS text to automatically verify and fill your TrxID!
              </p>
            </div>
          </div>

          {/* bKash Instructions Box */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(226, 19, 110, 0.15) 0%, rgba(16, 32, 66, 0.9) 100%)",
              border: "1.5px solid rgba(226, 19, 110, 0.4)",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "22px" }}>📱</span>
                <span style={{ fontWeight: 800, fontSize: "16px", color: "#f472b6" }}>bKash Payment Steps</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#fef08a", background: "rgba(245,158,11,0.2)", padding: "4px 10px", borderRadius: "8px" }}>
                Fee: {membershipFee} BDT
              </span>
            </div>

            <ol style={{ fontSize: "13.5px", color: "#ffffff", lineHeight: 1.7, paddingLeft: "20px", margin: "0 0 16px" }}>
              <li>Open your <strong>bKash App</strong> and tap on <strong>Education Fee (শিক্ষা ফি)</strong>.</li>
              <li>Search and select <strong>Primeasia University</strong>.</li>
              <li>Choose <strong>Others</strong> (or Club/Registration Fee).</li>
              <li>Enter your Student ID (<strong>{studentId || "Your 9-Digit ID"}</strong>) and pay <strong>{membershipFee} BDT</strong>.</li>
              <li>Copy the <strong>Transaction ID (TrxID)</strong> or scan receipt below.</li>
            </ol>

            <button
              type="button"
              onClick={copyBkashGuide}
              className="btn-outline"
              style={{
                fontSize: "12px",
                padding: "6px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                borderColor: "rgba(226, 19, 110, 0.4)",
                color: "#f472b6",
              }}
            >
              {copiedText ? <Check size={14} /> : <Copy size={14} />}
              {copiedText ? "Copied Steps!" : "Copy Payment Steps"}
            </button>
          </div>

          {/* Instant Auto-Retrieval Tools: Client Image Scanner & Paste SMS */}
          <div
            style={{
              background: "rgba(56, 189, 248, 0.05)",
              border: "1.5px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "14px",
              padding: "18px 20px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={16} color="#38bdf8" />
                <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#38bdf8" }}>
                  Instant Auto-Fill: Scan Receipt or Paste SMS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteSms(!showPasteSms)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fbbf24",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textDecoration: "underline",
                }}
              >
                <ClipboardPaste size={13} /> {showPasteSms ? "Use Image Scanner" : "Paste SMS / Text"}
              </button>
            </div>

            {!showPasteSms ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSlipImageScan(f);
                  }}
                />

                <div
                  onClick={() => !isScanningSlip && fileInputRef.current?.click()}
                  style={{
                    border: "1.5px dashed rgba(56, 189, 248, 0.4)",
                    borderRadius: "10px",
                    padding: "16px",
                    textAlign: "center",
                    cursor: isScanningSlip ? "wait" : "pointer",
                    background: "rgba(56, 189, 248, 0.03)",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#38bdf8", fontWeight: 700, fontSize: "13px" }}>
                    {isScanningSlip ? <RefreshCw size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                    <span>{isScanningSlip ? "Scanning Receipt Image..." : "Click to select Receipt Screenshot for instant Auto-Fill"}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Runs locally in your browser. Reads Transaction ID and verifies Student ID in seconds!
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-slide-up">
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Paste your bKash payment SMS or receipt text here (e.g. 'You have paid BDT 200.00... TrxID DHH0JTZHQO')..."
                  value={pastedSmsText}
                  onChange={(e) => handleParseSmsText(e.target.value)}
                  style={{ fontSize: "12.5px" }}
                />
                <span style={{ fontSize: "11px", color: "#86efac", marginTop: "4px", display: "block" }}>
                  💡 Auto-extracts TrxID, Student ID, and payment details instantly as you paste!
                </span>
              </div>
            )}

            {/* Live Scan/Extraction Status Banner */}
            {ocrStatus && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: ocrStatus.includes("✅") ? "rgba(34, 197, 94, 0.15)" : "rgba(56, 189, 248, 0.12)",
                  border: ocrStatus.includes("✅") ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(56, 189, 248, 0.25)",
                  color: ocrStatus.includes("✅") ? "#86efac" : "#7dd3fc",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{ocrStatus}</span>
              </div>
            )}

            {/* Extracted Details Pill */}
            {ocrSuccess && (
              <div
                className="animate-slide-up"
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  fontSize: "12px",
                  color: "#fef08a",
                }}
              >
                {ocrSuccess.trx && <span>TrxID: <strong style={{ color: "#fbbf24" }}>{ocrSuccess.trx}</strong> </span>}
                {ocrSuccess.sid && <span>· Student ID: <strong style={{ color: "#93c5fd" }}>{ocrSuccess.sid}</strong> </span>}
                {ocrSuccess.bkash && <span>· Sender: <strong style={{ color: "#f472b6" }}>{ocrSuccess.bkash}</strong></span>}
              </div>
            )}
          </div>

          {/* 🚩 PROMINENT RED FLAG WARNING BANNER IF STUDENT ID MISMATCH DETECTED */}
          {isFlaggedMismatch && (
            <div
              className="animate-slide-up"
              style={{
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(127, 29, 29, 0.4) 100%)",
                border: "2px solid #ef4444",
                borderRadius: "14px",
                padding: "16px 18px",
                marginBottom: "22px",
                boxShadow: "0 0 24px rgba(239, 68, 68, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.3)",
                    border: "1.5px solid #ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fca5a5",
                    flexShrink: 0,
                  }}
                >
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "14px", color: "#fca5a5", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Flag size={15} color="#ef4444" /> RED FLAG: Payment Receipt Student ID Mismatch!
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#ffffff", marginTop: "4px", lineHeight: 1.5 }}>
                    The Student ID detected on this receipt (
                    <strong style={{ color: "#fef08a", fontFamily: "monospace", textDecoration: "underline" }}>
                      {scannedReceiptStudentId}
                    </strong>
                    ) does <strong>NOT match</strong> your registered Student ID (
                    <strong style={{ color: "#93c5fd", fontFamily: "monospace" }}>
                      {studentId}
                    </strong>
                    ).
                  </div>
                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "#fca5a5",
                      marginTop: "6px",
                      background: "rgba(0, 0, 0, 0.3)",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    ⚠️ <strong>Warning:</strong> Using another student&apos;s bKash payment slip is strictly prohibited. This submission will be marked as <strong>PROBABLE FAKE / MISMATCH</strong> and flagged to club authorities.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            {/* Transaction ID */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#fbbf24", marginBottom: "6px" }}>
                bKash Transaction ID (TrxID) <span style={{ color: "#fbbf24" }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. DHH0JTZHQO"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                style={{
                  fontFamily: "monospace",
                  fontSize: "16px",
                  letterSpacing: "0.08em",
                  borderColor: isFlaggedMismatch ? "#ef4444" : "rgba(245,158,11,0.6)",
                }}
              />
              <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                Auto-filled from receipt / SMS or enter from your bKash statement
              </span>
            </div>

            {/* bKash Sender Phone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
                bKash Sender Phone Number (Optional)
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="01XXXXXXXXX"
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                The mobile number from which the payment was sent
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
            <button onClick={() => setStep(2)} className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleNextStep} className="btn-gold" style={{ padding: "12px 28px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Next: Review & Preview Pass →
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: REVIEW, LIVE 3D PASS & SUBMIT ================= */}
      {step === 4 && (
        <div className="glass-card animate-slide-up" style={{ padding: "32px 28px", textAlign: "center" }}>
          {justSaved && (
            <div
              className="glass-card animate-fade-in-up"
              style={{
                marginBottom: "20px",
                padding: "14px 18px",
                background: "rgba(34, 197, 94, 0.15)",
                border: "1.5px solid #22c55e",
                borderRadius: "12px",
                color: "#86efac",
                fontSize: "13.5px",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {saveSuccessMsg || "✅ Your registration details & Transaction ID have been updated successfully! Your updated pass is shown below."}
            </div>
          )}

          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", marginBottom: "6px" }}>
              {isVerified
                ? "Verified Digital Membership Pass"
                : isEditing || (!existingMember && !successData)
                ? "Step 4: Review & Confirm Registration"
                : "Your Digital Membership Pass"}
            </h2>
            <p style={{ fontSize: "14px", color: "#cbd5e1", margin: 0 }}>
              {isVerified
                ? "Your official 2026 membership is certified. Download your PDF slip anytime."
                : isEditing || (!existingMember && !successData)
                ? "Verify your information before submitting your registration to club authorities."
                : "Your registration is recorded. Download your official PDF slip below or edit details if needed."}
            </p>
          </div>

          {/* If Flagged Mismatch Detected */}
          {isFlaggedMismatch && !isVerified && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "1.5px solid #ef4444",
                borderRadius: "10px",
                color: "#fca5a5",
                fontSize: "12px",
                fontWeight: 800,
                marginBottom: "16px",
              }}
            >
              <Flag size={14} color="#ef4444" />
              <span>🚩 Red Flag: Receipt Student ID ({scannedReceiptStudentId}) does not match ({studentId})</span>
            </div>
          )}

          {/* Interactive 3D Holographic Card Preview */}
          <div style={{ margin: "20px 0 30px" }}>
            <HolographicMemberCard
              member={{
                membershipNumber: successData?.membershipNumber || existingMember?.membershipNumber || "PAUSC-2026-PREVIEW",
                fullName: fullName || "Student Name",
                studentId: studentId || "242003032",
                email: userEmail || "student@primeasia.edu.bd",
                phone: phone || "01XXXXXXXXX",
                department: finalDepartmentDisplay,
                semester: semResult.isValid ? semResult.semester : 1,
                gender,
                bloodGroup,
                sportsInterests: selectedSports,
                jerseySize,
                emergencyContact,
                bkashNumber,
                transactionId: transactionId || "TRX123456",
                paymentAmount: membershipFee,
                paymentStatus: existingMember?.paymentStatus || "pending",
                registeredAt: existingMember?.registeredAt || new Date(),
                userAvatar,
                validityLabel,
              }}
            />
          </div>

          {/* Submission or Edit Actions */}
          {!isVerified && (isEditing || !existingMember) ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={() => setStep(3)} className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ArrowLeft size={16} /> Back to Payment
              </button>
              <button
                onClick={handleSubmitRegistration}
                disabled={isPending}
                className="btn-neon-gold"
                style={{ padding: "14px 36px", fontSize: "15px", fontWeight: 900 }}
              >
                {isPending
                  ? "Saving Changes..."
                  : existingMember
                  ? "💾 Save & Update Registration Details 🚀"
                  : "Complete Registration & Issue Member Pass 🚀"}
              </button>
            </div>
          ) : isVerified ? (
            /* RESTRICTED / LOCKED STATE FOR APPROVED MEMBERS */
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "rgba(34, 197, 94, 0.18)",
                border: "1.5px solid rgba(34, 197, 94, 0.5)",
                borderRadius: "12px",
                color: "#86efac",
                fontSize: "13px",
                fontWeight: 700,
                marginTop: "16px",
              }}
            >
              <Lock size={15} />
              <span>Membership verified & locked. Modifications are disabled.</span>
            </div>
          ) : (
            /* Pending / Rejected members can click to edit */
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setJustSaved(false);
                  setStep(1);
                }}
                className="btn-gold"
                style={{ padding: "10px 24px", fontSize: "13.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Edit3 size={15} /> ✏️ Edit My Registration Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
