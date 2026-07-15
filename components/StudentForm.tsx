// components/StudentForm.tsx
"use client";

import { useState, useTransition, useRef } from "react";
import { calculateSemester, getSemesterLabel } from "@/lib/semester";
import { POSITIONS, type Position } from "@/lib/validations";
import { submitCV, type SubmitResult } from "@/actions/submit-cv";
import CVUploadZone from "./CVUploadZone";
import SuccessCard from "./SuccessCard";

type Step = "details" | "upload" | "done";

interface Props {
  existingSubmission?: {
    id: string;
    filename: string;
    blobUrl: string;
    uploadedAt: Date;
    semester: number;
    position: string;
    fullName: string;
    studentId: string;
    phone: string;
    department: string;
    cgpa: string;
    experienceDetails: string;
    whyAppropriate: string;
  } | null;
}

export default function StudentForm({ existingSubmission }: Props) {
  const [step, setStep] = useState<Step>(existingSubmission ? "done" : "details");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  // Form fields
  const [fullName, setFullName] = useState(existingSubmission?.fullName ?? "");
  const [studentId, setStudentId] = useState(existingSubmission?.studentId ?? "");
  const [phone, setPhone] = useState(existingSubmission?.phone ?? "");
  const [department, setDepartment] = useState(existingSubmission?.department ?? "");
  const [cgpa, setCgpa] = useState(existingSubmission?.cgpa ?? "");
  const [experienceDetails, setExperienceDetails] = useState(existingSubmission?.experienceDetails ?? "");
  const [whyAppropriate, setWhyAppropriate] = useState(existingSubmission?.whyAppropriate ?? "");
  const [position, setPosition] = useState<Position | "">(
    (existingSubmission?.position as Position) ?? ""
  );
  const [cvFile, setCvFile] = useState<File | null>(null);

  const semResult = calculateSemester(studentId);

  // If replacing, go back to details step
  const handleReplace = () => {
    setStep("details");
    setResult(null);
    setError("");
    setCvFile(null);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Full name is required.");
    if (!studentId.trim()) return setError("Student ID is required.");
    if (!semResult.isValid) return setError(semResult.error ?? "Invalid Student ID.");
    if (!phone.trim()) return setError("Phone number is required.");
    if (!/^[\d+\-\s()]+$/.test(phone)) return setError("Enter a valid phone number.");
    if (!department.trim()) return setError("Department is required.");
    if (!cgpa.trim()) return setError("CGPA is required.");
    
    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 4.0) {
      return setError("CGPA must be a decimal between 0.00 and 4.00.");
    }
    if (parsedCgpa < 2.5) {
      return setError("You cannot apply because the minimum CGPA requirement is 2.5.");
    }
    
    if (!experienceDetails.trim() || experienceDetails.trim().length < 5) {
      return setError("Experience details must be at least 5 characters.");
    }
    if (!whyAppropriate.trim() || whyAppropriate.trim().length < 5) {
      return setError("Reasoning response must be at least 5 characters.");
    }
    if (!position) return setError("Please select a position.");

    setStep("upload");
  };

  const handleUploadSubmit = () => {
    if (!cvFile) return setError("Please select a PDF file.");
    setError("");

    // Generate or retrieve persistent browser fingerprint
    let deviceId = "";
    if (typeof window !== "undefined") {
      try {
        deviceId = localStorage.getItem("dev_fingerprint") || "";
        if (!deviceId) {
          deviceId = "dev_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem("dev_fingerprint", deviceId);
        }
        document.cookie = `dev_fingerprint=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
      } catch (err) {
        console.error("Local storage error:", err);
      }
    }

    const browserInfo = {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      language: typeof navigator !== "undefined" ? navigator.language : "",
      screen: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
      cookiesEnabled: typeof navigator !== "undefined" ? navigator.cookieEnabled : false,
      deviceId,
    };

    const fd = new FormData();
    fd.append("fullName", fullName);
    fd.append("studentId", studentId);
    fd.append("phone", phone);
    fd.append("department", department);
    fd.append("cgpa", cgpa);
    fd.append("experienceDetails", experienceDetails);
    fd.append("whyAppropriate", whyAppropriate);
    fd.append("deviceInfo", JSON.stringify(browserInfo));
    fd.append("position", position);
    fd.append("cv", cvFile);

    startTransition(async () => {
      const res = await submitCV(fd);
      if (res.success) {
        setResult(res);
        setStep("done");
      } else {
        setError(res.error);
      }
    });
  };

  // Steps UI
  const steps = [
    { id: "details", label: "Your Details" },
    { id: "upload", label: "Upload CV" },
    { id: "done", label: "Done" },
  ];

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>

      {/* Step Indicator */}
      {step !== "done" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "0", marginBottom: "36px" }}>
          {steps.map((s, i) => {
            const status =
              s.id === step ? "active"
              : (steps.findIndex(x => x.id === step) > i) ? "done"
              : "pending";
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div className={`step-dot ${status}`}>{status === "done" ? "✓" : i + 1}</div>
                  <span style={{
                    fontSize: "12px",
                    color: status === "active" ? "var(--gold)" : "var(--text-muted)",
                    fontWeight: status === "active" ? 600 : 400,
                  }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    width: "80px", height: "1px", margin: "0 8px", marginBottom: "18px",
                    background: steps.findIndex(x => x.id === step) > i
                      ? "var(--gold)" : "rgba(255,255,255,0.1)"
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card" style={{
          padding: "12px 16px", marginBottom: "20px",
          borderColor: "rgba(239,68,68,0.3)",
          background: "rgba(239,68,68,0.08)",
          color: "#f87171", fontSize: "14px", display: "flex", gap: "8px", alignItems: "center"
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Step 1 — Details */}
      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="glass-card animate-fade-in-up"
              style={{ padding: "32px" }}>
          
          {/* Security / Fraud Warning Box */}
          <div className="glass-card" style={{
            padding: "14px 16px", marginBottom: "28px",
            borderColor: "rgba(239, 68, 68, 0.4)",
            background: "rgba(239, 68, 68, 0.05)",
            color: "#fca5a5"
          }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px", display: "flex", gap: "6px", alignItems: "center" }}>
              <span>🛡️</span> Security & Verification Warning
            </h4>
            <p style={{ fontSize: "12.5px", lineHeight: 1.5, margin: 0, color: "var(--text-secondary)" }}>
              To ensure recruitment integrity and prevent unauthorized submissions, device fingerprints, IP checks, and browser signatures are recorded. Submitting fraudulent applications under other students' names will result in immediate disqualification and reference to the university discipline committee.
            </p>
          </div>

          <h2 style={{ fontWeight: 700, fontSize: "22px", marginBottom: "8px" }}>
            Your Details
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
            Fill in your information accurately. Your Student ID is used to verify your semester.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600,
                            color: "var(--text-secondary)", marginBottom: "8px" }}>
                Full Name *
              </label>
              <input className="input-field" type="text" placeholder="e.g. Md. Saad Ahmed"
                value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>

            {/* Student ID */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600,
                            color: "var(--text-secondary)", marginBottom: "8px" }}>
                Student ID *
              </label>
              <input className="input-field" type="text" placeholder="e.g. 242-115-058"
                value={studentId} onChange={e => setStudentId(e.target.value)} required />

              {/* Semester feedback */}
              {studentId.length >= 3 && (
                <div style={{ marginTop: "10px" }}>
                  {semResult.isValid ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                      <span className={`badge ${semResult.isPriority ? "badge-gold" : semResult.isIrregular ? "badge-red" : "badge-blue"}`}>
                        {semResult.isIrregular ? "⛔" : semResult.isPriority ? "⭐" : "📚"}
                        {getSemesterLabel(semResult.semester)}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Admitted: {semResult.admitTermName} {semResult.admitYear}
                      </span>
                      {semResult.isPriority && (
                        <span className="badge badge-gold" style={{ fontSize: "11px" }}>
                          Priority Applicant
                        </span>
                      )}
                      {semResult.isIrregular && (
                        <p style={{ width: "100%", fontSize: "13px", color: "#f87171", marginTop: "4px" }}>
                          ⚠️ Irregular students (above 12th semester) are discouraged to apply.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "#f87171" }}>
                      {semResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Department */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600,
                            color: "var(--text-secondary)", marginBottom: "8px" }}>
                Department *
              </label>
              <input className="input-field" type="text" placeholder="e.g. CSE / EEE / BBA"
                value={department} onChange={e => setDepartment(e.target.value)} required />
            </div>

            {/* CGPA */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600,
                            color: "var(--text-secondary)", marginBottom: "8px" }}>
                Current CGPA *
              </label>
              <input className="input-field" type="number" step="0.01" min="0.00" max="4.00" placeholder="e.g. 3.85"
                value={cgpa} onChange={e => setCgpa(e.target.value)} required />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600,
                            color: "var(--text-secondary)", marginBottom: "8px" }}>
                Phone Number (WhatsApp Active) *
              </label>
              <input className="input-field" type="tel" placeholder="e.g. +8801XXXXXXXXX"
                value={phone} onChange={e => setPhone(e.target.value)} required />
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                📱 Make sure WhatsApp is active on this number
              </p>
            </div>

            {/* Position */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600,
                            color: "var(--text-secondary)", marginBottom: "8px" }}>
                Position Applying For *
              </label>
              <div style={{ position: "relative" }}>
                <select className="select-field" value={position}
                  onChange={e => setPosition(e.target.value as Position)} required>
                  <option value="" disabled>Select a position...</option>
                  {POSITIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <div style={{
                  position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)", pointerEvents: "none", fontSize: "12px"
                }}>▼</div>
              </div>
            </div>

            {/* Experience text area */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600,
                            color: "var(--text-secondary)", marginBottom: "6px" }}>
                Are you currently or previously in any position of any club? Provide details *
              </label>
              <textarea
                className="input-field"
                style={{ minHeight: "100px", resize: "vertical", fontFamily: "inherit", fontSize: "14px", lineHeight: "1.5" }}
                placeholder="List the club name, role held, duration, and details of responsibilities..."
                value={experienceDetails}
                onChange={e => setExperienceDetails(e.target.value)}
                required
              />
            </div>

            {/* Why Appropriate text area */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600,
                            color: "var(--text-secondary)", marginBottom: "6px" }}>
                Why do you think you are appropriate for this post? *
              </label>
              <textarea
                className="input-field"
                style={{ minHeight: "100px", resize: "vertical", fontFamily: "inherit", fontSize: "14px", lineHeight: "1.5" }}
                placeholder="Explain why you are the best fit, highlighting relevant leadership skills and dedication..."
                value={whyAppropriate}
                onChange={e => setWhyAppropriate(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  alert("Copy-paste is disabled for security verification purposes. Please type your response.");
                }}
                required
              />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                🚫 Copy-paste is disabled. Please write details manually.
              </p>
            </div>

          </div>

          {/* Info box: semester priority */}
          <div className="glass-card" style={{
            marginTop: "24px", padding: "14px 16px",
            borderColor: "rgba(79, 142, 247, 0.3)",
            background: "rgba(79, 142, 247, 0.06)"
          }}>
            <p style={{ fontSize: "13px", color: "#7eb3ff", margin: 0 }}>
              ℹ️ Students from <strong>7th to 12th semester</strong> receive priority consideration.
              If you are above the 12th semester, you are discouraged from applying.
            </p>
          </div>

          <button type="submit" className="btn-gold" style={{ marginTop: "28px", width: "100%" }}>
            Continue to CV Upload →
          </button>
        </form>
      )}

      {/* Step 2 — Upload */}
      {step === "upload" && (
        <div className="glass-card animate-fade-in-up" style={{ padding: "32px" }}>
          <button onClick={() => setStep("details")} className="btn-ghost"
                  style={{ marginBottom: "20px", fontSize: "13px" }}>
            ← Back to Details
          </button>

          <h2 style={{ fontWeight: 700, fontSize: "22px", marginBottom: "8px" }}>Upload Your CV</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>
            Applying as: <strong style={{ color: "var(--gold)" }}>{position}</strong>
            {" "} · {getSemesterLabel(semResult.semester)}
          </p>

          <CVUploadZone file={cvFile} onFileChange={setCvFile} />

          <button
            className="btn-gold"
            style={{ marginTop: "24px", width: "100%" }}
            onClick={handleUploadSubmit}
            disabled={!cvFile || isPending}
          >
            {isPending ? (
              <>
                <svg className="animate-spin-slow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Uploading...
              </>
            ) : "Submit Application →"}
          </button>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === "done" && (
        <SuccessCard
          filename={result?.success ? result.filename : existingSubmission?.filename ?? ""}
          submissionId={result?.success ? result.submissionId : existingSubmission?.id ?? ""}
          semester={result?.success ? result.semester : existingSubmission?.semester ?? 0}
          position={position || (existingSubmission?.position ?? "")}
          onReplace={handleReplace}
        />
      )}
    </div>
  );
}
