// components/MemberRegistrationForm.tsx
"use client";

import { useState, useTransition, useId } from "react";
import { registerMember, type MemberRegistrationResult } from "@/actions/member";
import { DEPARTMENTS, SPORTS_OPTIONS, BLOOD_GROUPS, JERSEY_SIZES, GENDERS } from "@/lib/validations";
import { calculateSemester, getSemesterLabel } from "@/lib/semester";
import HolographicMemberCard from "./HolographicMemberCard";
import confetti from "canvas-confetti";
import {
  User,
  GraduationCap,
  Phone,
  Trophy,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Copy,
  Check,
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
}

type FormStep = 1 | 2 | 3 | 4;

export default function MemberRegistrationForm({
  existingMember,
  userEmail = "",
  userName = "",
  userAvatar = null,
}: Props) {
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
  const [department, setDepartment] = useState(existingMember?.department ?? DEPARTMENTS[0]);
  const [gender, setGender] = useState<"Male" | "Female" | "Other">((existingMember?.gender as any) ?? "Male");
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
    (existingMember?.jerseySize as any) ?? "M"
  );
  const [emergencyContact, setEmergencyContact] = useState(existingMember?.emergencyContact ?? "");

  // Payment info
  const [bkashNumber, setBkashNumber] = useState(existingMember?.bkashNumber ?? "");
  const [transactionId, setTransactionId] = useState(existingMember?.transactionId ?? "");

  const semResult = calculateSemester(studentId);

  const toggleSport = (sportName: string) => {
    if (selectedSports.includes(sportName)) {
      if (selectedSports.length === 1) return; // Keep at least one
      setSelectedSports(selectedSports.filter((s) => s !== sportName));
    } else {
      setSelectedSports([...selectedSports, sportName]);
    }
  };

  const copyBkashGuide = () => {
    navigator.clipboard.writeText("bKash App -> Education Fee -> Primeasia University -> Others -> 200 Tk");
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const triggerError = (msg: string) => {
    setError(msg);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextStep = () => {
    setError("");

    if (step === 1) {
      if (!fullName.trim()) return triggerError("Full Name is required.");
      if (!studentId.trim()) return triggerError("Student ID is required.");
      if (!semResult.isValid) return triggerError(semResult.error ?? "Invalid Primeasia Student ID.");
      if (!phone.trim()) return triggerError("Phone number is required.");
      if (!/^[\d+\-\s()]{10,15}$/.test(phone.trim())) return triggerError("Enter a valid mobile number.");
      if (!department) return triggerError("Please select your department.");
      setStep(2);
    } else if (step === 2) {
      if (selectedSports.length === 0) return triggerError("Please select at least one sport you are interested in.");
      setStep(3);
    } else if (step === 3) {
      if (!transactionId.trim() || transactionId.trim().length < 6) {
        return triggerError("Please enter a valid bKash Transaction ID (TrxID) of at least 6 characters.");
      }
      setStep(4);
    }
  };

  const handleSubmitRegistration = () => {
    setError("");

    // Telemetry
    let deviceId = "";
    if (typeof window !== "undefined") {
      try {
        deviceId = localStorage.getItem("pausc_dev_id") || "";
        if (!deviceId) {
          deviceId = "dev_" + Math.random().toString(36).substring(2, 12);
          localStorage.setItem("pausc_dev_id", deviceId);
        }
      } catch (e) {}
    }

    const browserInfo = {
      deviceId,
      screen: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "",
      language: typeof navigator !== "undefined" ? navigator.language : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
    };

    startTransition(async () => {
      try {
        const res = await registerMember({
          fullName: fullName.trim(),
          studentId: studentId.trim(),
          phone: phone.trim(),
          department,
          gender,
          bloodGroup: bloodGroup as any,
          sportsInterests: selectedSports,
          jerseySize,
          emergencyContact: emergencyContact.trim(),
          bkashNumber: bkashNumber.trim(),
          transactionId: transactionId.trim().toUpperCase(),
          deviceInfo: JSON.stringify(browserInfo),
        });

        if (res.success) {
          setSuccessData({
            membershipNumber: res.membershipNumber,
            semester: res.semester,
          });

          // Trigger confetti explosion
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#c9a227", "#e8c84e", "#4f8ef7", "#10b981", "#ffffff"],
            });
          } catch (e) {}

          setStep(4);
        } else {
          setError(res.error);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", width: "100%" }}>
      {/* Progress Bar Indicator */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          {[
            { num: 1, label: "University Profile", icon: GraduationCap },
            { num: 2, label: "Sports & Apparel", icon: Trophy },
            { num: 3, label: "bKash Payment", icon: CreditCard },
            { num: 4, label: "Member Pass", icon: Sparkles },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num || (existingMember && step === 4);
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (isCompleted && !isPending) setStep(s.num as FormStep);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: isCompleted ? "pointer" : "default",
                  flex: 1,
                  position: "relative",
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
                    fontSize: "14px",
                    fontWeight: 800,
                    background: isActive
                      ? "linear-gradient(135deg, var(--gold), var(--gold-light))"
                      : isCompleted
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(255, 255, 255, 0.05)",
                    color: isActive ? "var(--navy)" : isCompleted ? "#4ade80" : "var(--text-muted)",
                    border: isActive
                      ? "2px solid var(--gold-pale)"
                      : isCompleted
                      ? "2px solid rgba(34, 197, 94, 0.5)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: isActive ? "0 0 16px rgba(201, 162, 39, 0.5)" : undefined,
                    transition: "all 0.3s ease",
                  }}
                >
                  {isCompleted && !isActive ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    marginTop: "6px",
                    color: isActive ? "var(--gold)" : isCompleted ? "var(--text-primary)" : "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          className="glass-card animate-fade-in-up"
          style={{
            padding: "14px 18px",
            marginBottom: "24px",
            borderColor: "rgba(239, 68, 68, 0.4)",
            background: "rgba(239, 68, 68, 0.08)",
            color: "#fca5a5",
            fontSize: "13.5px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ================= STEP 1: UNIVERSITY & PERSONAL INFO ================= */}
      {step === 1 && (
        <div className="glass-card animate-fade-in-up" style={{ padding: "32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "rgba(201,162,39,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                Step 1: Student & University Information
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                Enter your academic and contact details
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Full Name <span style={{ color: "var(--gold)" }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. S. M. Saad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Student ID */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Student ID <span style={{ color: "var(--gold)" }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 24200000"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              {studentId && (
                <div style={{ marginTop: "4px", fontSize: "11.5px" }}>
                  {semResult.isValid ? (
                    <span style={{ color: "#4ade80", fontWeight: 600 }}>
                      ✓ Detected: {getSemesterLabel(semResult.semester)} ({semResult.semester}th Sem)
                    </span>
                  ) : (
                    <span style={{ color: "#f87171" }}>⚠ {semResult.error}</span>
                  )}
                </div>
              )}
            </div>

            {/* Phone (WhatsApp) */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Phone / WhatsApp Number <span style={{ color: "var(--gold)" }}>*</span>
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Department */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Department <span style={{ color: "var(--gold)" }}>*</span>
              </label>
              <select
                className="input-field"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ background: "var(--navy-mid)" }}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Gender <span style={{ color: "var(--gold)" }}>*</span>
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
                      border: gender === g ? "1.5px solid var(--gold)" : "1px solid rgba(255,255,255,0.08)",
                      background: gender === g ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.03)",
                      color: gender === g ? "var(--gold)" : "var(--text-secondary)",
                      fontWeight: 600,
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
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Blood Group <span style={{ color: "var(--gold)" }}>*</span>
              </label>
              <select
                className="input-field"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                style={{ background: "var(--navy-mid)" }}
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
      {step === 2 && (
        <div className="glass-card animate-fade-in-up" style={{ padding: "32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "rgba(201,162,39,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
              }}
            >
              <Trophy size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                Step 2: Sports Disciplines & Apparel
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                Select all sports you are interested in playing or supporting
              </p>
            </div>
          </div>

          {/* Sports Grid */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              Select Interested Sports (Multi-select) <span style={{ color: "var(--gold)" }}>*</span>
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
                      border: isSelected ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,0.08)",
                      background: isSelected ? "rgba(201,162,39,0.18)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isSelected ? "translateY(-2px)" : "none",
                      boxShadow: isSelected ? "0 8px 16px -4px rgba(201,162,39,0.3)" : undefined,
                    }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "4px" }}>{sport.icon}</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "var(--gold)" : "var(--text-primary)" }}>
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
              <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                Preferred Jersey Size <span style={{ color: "var(--gold)" }}>*</span>
              </label>
              <span style={{ fontSize: "11px", background: "rgba(201,162,39,0.15)", color: "var(--gold)", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                For Later Use
              </span>
            </div>

            {/* Explicit Notice as requested */}
            <div
              style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "12.5px",
                color: "#fbbf24",
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
                    onClick={() => setJerseySize(j.size as any)}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,0.08)",
                      background: isSelected ? "rgba(201,162,39,0.18)" : "rgba(255,255,255,0.03)",
                      color: isSelected ? "var(--gold)" : "var(--text-secondary)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "2px" }}>{j.size}</div>
                    <div style={{ fontSize: "10px", opacity: 0.8 }}>{j.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
              Emergency Contact / Guardian Phone (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Brother / 017XXXXXXXX"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
            <button onClick={() => setStep(1)} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleNextStep} className="btn-gold" style={{ padding: "12px 28px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Next: bKash Payment →
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: BKASH PAYMENT ================= */}
      {step === 3 && (
        <div className="glass-card animate-fade-in-up" style={{ padding: "32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "rgba(236, 72, 153, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ec4899",
              }}
            >
              <CreditCard size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                Step 3: bKash Payment Verification (200 BDT)
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                Primeasia University official bKash Education Fee payment
              </p>
            </div>
          </div>

          {/* bKash Instructions Card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(226, 19, 110, 0.12) 0%, rgba(10, 22, 40, 0.7) 100%)",
              border: "1px solid rgba(226, 19, 110, 0.35)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "22px" }}>📱</span>
                <span style={{ fontWeight: 800, fontSize: "16px", color: "#f472b6" }}>bKash Payment Method</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--gold)", background: "rgba(201,162,39,0.15)", padding: "4px 10px", borderRadius: "8px" }}>
                Fee: 200 BDT
              </span>
            </div>

            <ol style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.7, paddingLeft: "20px", margin: "0 0 16px" }}>
              <li>Open your <strong>bKash App</strong> and tap on <strong>Education Fee (শিক্ষা ফি)</strong>.</li>
              <li>Search and select <strong>Primeasia University</strong>.</li>
              <li>Choose <strong>Others</strong> (or Club/Registration Fee).</li>
              <li>Enter your Student ID and complete the payment of <strong>200 BDT</strong>.</li>
              <li>Copy the <strong>Transaction ID (TrxID)</strong> and paste it below.</li>
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

          {/* Payment Inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            {/* Transaction ID */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--gold)", marginBottom: "6px" }}>
                bKash Transaction ID (TrxID) <span style={{ color: "var(--gold)" }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 9J83KLMN45"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                style={{
                  fontFamily: "monospace",
                  fontSize: "16px",
                  letterSpacing: "0.08em",
                  borderColor: "rgba(201,162,39,0.5)",
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                Found in your bKash payment confirmation SMS or statement
              </span>
            </div>

            {/* bKash Sender Phone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                bKash Sender Phone Number (Optional)
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="01XXXXXXXXX"
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                The mobile number from which the payment was made
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
            <button onClick={() => setStep(2)} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
        <div className="glass-card animate-fade-in-up" style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
              {existingMember || successData ? "Your Digital Membership Pass" : "Step 4: Live Pass Preview & Confirmation"}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
              {existingMember || successData
                ? "Your registration is recorded. Download your official PDF slip below."
                : "Verify your information before generating your official PaUGSC member pass."}
            </p>
          </div>

          {/* Interactive 3D Holographic Card Preview */}
          <div style={{ margin: "20px 0 30px" }}>
            <HolographicMemberCard
              member={{
                membershipNumber: successData?.membershipNumber || existingMember?.membershipNumber || "PAUSC-2026-PREVIEW",
                fullName: fullName || "Student Name",
                studentId: studentId || "24200000",
                email: userEmail || "student@primeasia.edu.bd",
                phone: phone || "01XXXXXXXXX",
                department: department || "Computer Science & Engineering",
                semester: semResult.isValid ? semResult.semester : 1,
                gender,
                bloodGroup,
                sportsInterests: selectedSports,
                jerseySize,
                emergencyContact,
                bkashNumber,
                transactionId: transactionId || "TRX123456",
                paymentAmount: "200",
                paymentStatus: existingMember?.paymentStatus || "pending",
                registeredAt: existingMember?.registeredAt || new Date(),
                userAvatar,
              }}
            />
          </div>

          {/* Submission or Edit Actions */}
          {!successData && !existingMember ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
              <button onClick={() => setStep(3)} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ArrowLeft size={16} /> Edit Payment
              </button>
              <button
                onClick={handleSubmitRegistration}
                disabled={isPending}
                className="btn-gold"
                style={{ padding: "14px 36px", fontSize: "15px", fontWeight: 800 }}
              >
                {isPending ? "Submitting Registration..." : "Complete Registration & Issue Member Pass 🚀"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                onClick={() => setStep(1)}
                className="btn-ghost"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                ✏️ Edit My Registration Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
