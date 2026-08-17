// components/RenewalModal.tsx
"use client";

import { useState, useRef } from "react";
import { renewMembership } from "@/actions/member";
import { parsePaymentReceipt } from "@/lib/receipt-parser";
import {
  RefreshCw,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Scan,
  CreditCard,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  membershipNumber: string;
  fullName: string;
  studentId: string;
  renewalFee?: string;
}

export default function RenewalModal({
  isOpen,
  onClose,
  membershipNumber,
  fullName,
  studentId,
  renewalFee = "200",
}: Props) {
  const [trxId, setTrxId] = useState("");
  const [bkashNumber, setBkashNumber] = useState("");
  const [isScanningSlip, setIsScanningSlip] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningSlip(true);
    setScanMessage("Scanning renewal receipt in browser...");
    setScanSuccess(false);
    setErrorMsg("");

    try {
      const result = await parsePaymentReceipt(file);

      if (result.transactionId) {
        setTrxId(result.transactionId);
      }
      if (result.bkashNumber) {
        setBkashNumber(result.bkashNumber);
      }

      setScanSuccess(true);
      setScanMessage(
        result.transactionId
          ? `✓ Auto-detected TrxID: ${result.transactionId}`
          : "Slip scanned. Please confirm or enter your Transaction ID below."
      );
    } catch (err) {
      console.error("Slip OCR scan error:", err);
      setScanMessage("Could not auto-read slip. Please type your bKash TrxID manually.");
    } finally {
      setIsScanningSlip(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!trxId.trim() || trxId.trim().length < 5) {
      setErrorMsg("Please enter your renewal bKash Transaction ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await renewMembership({
        transactionId: trxId.trim().toUpperCase(),
        bkashNumber: bkashNumber.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to submit renewal.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: "20px",
      }}
    >
      <div
        className="glass-card animate-fade-in-up"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "26px",
          border: "1.5px solid rgba(56, 189, 248, 0.4)",
          background: "linear-gradient(135deg, #0e1e3e 0%, #081328 100%)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8), 0 0 35px rgba(56, 189, 248, 0.25)",
          borderRadius: "20px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div>
            <span className="badge badge-gold" style={{ marginBottom: "6px", display: "inline-flex", gap: "5px" }}>
              <RefreshCw size={12} /> Membership Renewal
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff", margin: 0 }}>
              Renew Member Pass 🔄
            </h2>
            <p style={{ fontSize: "12.5px", color: "#cbd5e1", marginTop: "4px" }}>
              Member: <strong>{fullName}</strong> ({studentId}) · Pass: <strong>{membershipNumber}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <div style={{ fontSize: "52px", marginBottom: "14px" }}>✅</div>
            <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#86efac", marginBottom: "8px" }}>
              Renewal Request Submitted!
            </h3>
            <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "20px" }}>
              Your renewal payment of <strong>{renewalFee} BDT</strong> with TrxID <strong>{trxId}</strong> is under
              review by administrators. Once approved, your membership pass will be re-activated.
            </p>
            <button
              onClick={() => {
                onClose();
                setIsSuccess(false);
              }}
              className="btn-gold"
              style={{ padding: "11px 28px", fontSize: "13.5px" }}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Renewal Info Card */}
            <div
              style={{
                background: "rgba(56, 189, 248, 0.1)",
                border: "1.5px solid rgba(56, 189, 248, 0.35)",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "12px",
              }}
            >
              <div style={{ fontWeight: 800, color: "#38bdf8", marginBottom: "4px" }}>
                Annual Renewal Fee: {renewalFee} BDT
              </div>
              <p style={{ color: "#e2e8f0", margin: 0, lineHeight: 1.4 }}>
                Pay via <strong>bKash App &gt; Education Fee &gt; Primeasia University</strong> (or transfer {renewalFee} BDT) and enter your new TrxID below to extend your pass.
              </p>
            </div>

            {/* Receipt Scan Option */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                onChange={handleSlipUpload}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanningSlip}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1.5px dashed rgba(56, 189, 248, 0.4)",
                  background: "rgba(56, 189, 248, 0.08)",
                  color: "#38bdf8",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                <Scan size={15} />
                {isScanningSlip ? "Scanning Slip..." : "📸 Upload & Auto-Scan Renewal Slip"}
              </button>

              {scanMessage && (
                <div
                  style={{
                    fontSize: "11.5px",
                    marginTop: "6px",
                    color: scanSuccess ? "#86efac" : "#fbbf24",
                    fontWeight: 700,
                  }}
                >
                  {scanMessage}
                </div>
              )}
            </div>

            {/* TrxID Input */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#fbbf24", display: "block", marginBottom: "6px" }}>
                Renewal bKash Transaction ID (TrxID) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DHH4JWP2J2"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                className="input-field"
                style={{ fontSize: "14px", fontFamily: "monospace", fontWeight: 800, textTransform: "uppercase" }}
              />
            </div>

            {errorMsg && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#fca5a5",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertCircle size={14} />
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
                style={{ flex: 1, padding: "11px", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-neon-gold"
                style={{ flex: 1.8, padding: "11px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Sparkles size={15} color="#0b1730" />
                {isSubmitting ? "Submitting..." : `Submit Renewal`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
