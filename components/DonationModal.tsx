// components/DonationModal.tsx
"use client";

import { useState, useRef } from "react";
import { submitDonation } from "@/actions/donation";
import { DONATION_CATEGORIES } from "@/lib/validations";
import { parsePaymentReceipt } from "@/lib/receipt-parser";
import {
  HeartHandshake,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Scan,
  Coins,
  MessageSquare,
  Lock,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
  donorName?: string;
  donorStudentId?: string;
  donorPhone?: string;
}

const PRESET_AMOUNTS = ["200", "500", "1000", "2000", "5000"];

export default function DonationModal({
  isOpen,
  onClose,
  defaultCategory = "Tournament & Inter-University Fund",
  donorName,
  donorStudentId,
  donorPhone,
}: Props) {
  const [category, setCategory] = useState(defaultCategory);
  const [amount, setAmount] = useState("500");
  const [customAmount, setCustomAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [donorNote, setDonorNote] = useState("");
  const [phone, setPhone] = useState(donorPhone || "");

  // OCR state
  const [isScanningSlip, setIsScanningSlip] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const effectiveAmount = customAmount ? customAmount : amount;

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningSlip(true);
    setScanMessage("Scanning bKash receipt image in browser...");
    setScanSuccess(false);
    setErrorMsg("");

    try {
      const result = await parsePaymentReceipt(file);

      if (result.transactionId) {
        setTrxId(result.transactionId);
      }
      if (result.amount) {
        setCustomAmount(result.amount);
      }

      setScanSuccess(true);
      setScanMessage(
        result.transactionId
          ? `✓ Auto-detected TrxID: ${result.transactionId}${result.amount ? ` · Amount: ${result.amount} BDT` : ""}`
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

    if (!effectiveAmount || parseFloat(effectiveAmount) < 10) {
      setErrorMsg("Please select or enter a valid contribution amount.");
      return;
    }

    if (!trxId.trim() || trxId.trim().length < 5) {
      setErrorMsg("Please enter your bKash Transaction ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitDonation({
        category,
        amount: effectiveAmount.trim(),
        transactionId: trxId.trim().toUpperCase(),
        donorNote: donorNote.trim(),
        donorPhone: phone.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to submit donation.");
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
          maxWidth: "520px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "26px",
          border: "1.5px solid rgba(245, 158, 11, 0.4)",
          background: "linear-gradient(135deg, #0e1e3e 0%, #081328 100%)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8), 0 0 35px rgba(245, 158, 11, 0.25)",
          borderRadius: "20px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div>
            <span className="badge badge-gold" style={{ marginBottom: "6px", display: "inline-flex", gap: "5px" }}>
              <HeartHandshake size={12} /> PaUGSC Patron & Supporter
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              Contribute to Club Funds 🏆
            </h2>
            <p style={{ fontSize: "12.5px", color: "#cbd5e1", marginTop: "4px" }}>
              Support university athletes, tournament logistics, and sports equipment.
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
            <div style={{ fontSize: "52px", marginBottom: "14px" }}>🎉</div>
            <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#86efac", marginBottom: "8px" }}>
              Contribution Recorded Successfully!
            </h3>
            <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "20px" }}>
              Thank you for contributing <strong>৳{effectiveAmount} BDT</strong> towards{" "}
              <strong>{category}</strong>. Your donation is queued for administrator verification.
            </p>
            <button
              onClick={() => {
                onClose();
                setIsSuccess(false);
              }}
              className="btn-gold"
              style={{ padding: "11px 28px", fontSize: "13.5px" }}
            >
              View My Impact Ledger
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Category Selector */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#fbbf24", display: "block", marginBottom: "6px" }}>
                Select Contribution Fund / Purpose:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {DONATION_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "11.5px",
                      fontWeight: 800,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      border: category === cat ? "1.5px solid #fbbf24" : "1px solid rgba(255, 255, 255, 0.12)",
                      background: category === cat ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      color: category === cat ? "#fef08a" : "#cbd5e1",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Presets */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#fbbf24", display: "block", marginBottom: "6px" }}>
                Amount (BDT):
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setAmount(amt);
                      setCustomAmount("");
                    }}
                    style={{
                      flex: 1,
                      minWidth: "65px",
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: !customAmount && amount === amt ? "1.5px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.12)",
                      background: !customAmount && amount === amt ? "rgba(34, 197, 94, 0.25)" : "rgba(255, 255, 255, 0.05)",
                      color: !customAmount && amount === amt ? "#86efac" : "#ffffff",
                    }}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Or enter custom amount in BDT (e.g. 1500)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="input-field"
                style={{ fontSize: "13px", padding: "10px 14px" }}
              />
            </div>

            {/* bKash Payment Instructions Card */}
            <div
              style={{
                background: "rgba(226, 19, 110, 0.1)",
                border: "1.5px solid rgba(226, 19, 110, 0.4)",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "12px",
              }}
            >
              <div style={{ fontWeight: 800, color: "#f43f5e", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>bKash Payment Instructions:</span>
              </div>
              <p style={{ color: "#e2e8f0", margin: 0, lineHeight: 1.4 }}>
                1. Open bKash App &gt; <strong>Send Money</strong> or <strong>Payment</strong>
                <br />
                2. Enter Club Account / bKash Number &amp; complete your transfer
                <br />
                3. Upload receipt or enter your 10-character <strong>Transaction ID (TrxID)</strong> below.
              </p>
            </div>

            {/* Receipt OCR Auto-Scanner */}
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
                {isScanningSlip ? "Scanning Receipt Image..." : "📸 Upload & Auto-Scan bKash Receipt"}
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
                bKash Transaction ID (TrxID) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DH90ADP2DC"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                className="input-field"
                style={{ fontSize: "14px", fontFamily: "monospace", fontWeight: 800, textTransform: "uppercase" }}
              />
            </div>

            {/* Donor Encouragement Note */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: "6px" }}>
                Message / Encouragement (Optional):
              </label>
              <textarea
                rows={2}
                placeholder="Leave a message for our university sports teams or athletes..."
                value={donorNote}
                onChange={(e) => setDonorNote(e.target.value)}
                className="input-field"
                style={{ fontSize: "12.5px" }}
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
                {isSubmitting ? "Recording..." : `Confirm ৳${effectiveAmount} Donation`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
