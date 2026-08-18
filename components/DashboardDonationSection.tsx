// components/DashboardDonationSection.tsx
"use client";

import { useState } from "react";
import type { DonationSummary } from "@/actions/donation";
import DonationModal from "./DonationModal";
import RenewalModal from "./RenewalModal";
import {
  HeartHandshake,
  Coins,
  RefreshCw,
} from "lucide-react";

interface Props {
  donationSummary: DonationSummary;
  memberData?: {
    membershipNumber: string;
    fullName: string;
    studentId: string;
    phone: string;
    paymentStatus: string;
    validUntil?: Date | null;
  } | null;
  validityLabel?: string;
  renewalFee?: string;
}

export default function DashboardDonationSection({
  donationSummary,
  memberData,
  validityLabel = "SEASON 2026-2027",
  renewalFee = "200",
}: Props) {
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [selectedDonationCategory] = useState<string>("General Club Expansion");

  const isExpired = memberData?.paymentStatus === "expired" || (memberData?.validUntil && new Date() > new Date(memberData.validUntil));
  const isPendingRenewal = memberData?.paymentStatus === "pending_renewal";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "10px" }}>
      {/* Renewal CTA Banner if Expired or Expiring */}
      {memberData && (isExpired || isPendingRenewal) && (
        <div
          className="glass-card-bright animate-slide-up"
          style={{
            padding: "20px 24px",
            borderColor: isPendingRenewal ? "rgba(245, 158, 11, 0.5)" : "rgba(239, 68, 68, 0.6)",
            background: isPendingRenewal ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            borderRadius: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                background: isPendingRenewal ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isPendingRenewal ? "#fbbf24" : "#f87171",
              }}
            >
              <RefreshCw size={22} className={isPendingRenewal ? "animate-spin-slow" : ""} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "16px", color: isPendingRenewal ? "#fef08a" : "#fca5a5" }}>
                {isPendingRenewal ? "⏳ Membership Renewal Under Verification" : "⚠️ Membership Pass Expired"}
              </div>
              <p style={{ fontSize: "13px", color: "#e2e8f0", margin: "2px 0 0" }}>
                {isPendingRenewal
                  ? "Your renewal payment has been submitted and is awaiting administrator approval."
                  : `Your ${validityLabel} pass has expired. Complete a 1-step renewal to reactivate full tournament and club access.`}
              </p>
            </div>
          </div>

          {!isPendingRenewal && (
            <button
              onClick={() => setIsRenewalOpen(true)}
              className="btn-neon-gold"
              style={{ padding: "10px 22px", fontSize: "13.5px" }}
            >
              <RefreshCw size={15} /> Renew Pass ({renewalFee} BDT)
            </button>
          )}
        </div>
      )}

      {/* Donation & Club Contribution Hub */}
      <div className="glass-card" style={{ padding: "26px 24px", borderRadius: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge badge-gold">
                <HeartHandshake size={12} /> Transparency &amp; Funds
              </span>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff", marginTop: "6px", margin: 0 }}>
              PaUGSC Contribution Hub &amp; Ledger
            </h2>
            <p style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "4px" }}>
              Every contribution directly sponsors university tournament trips, sports apparel, and training kits.
            </p>
          </div>

          <button
            onClick={() => setIsDonationOpen(true)}
            className="btn-gold"
            style={{
              padding: "11px 22px",
              fontSize: "13.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 20px rgba(245, 158, 11, 0.35)",
            }}
          >
            <Coins size={16} /> Contribute to Club
          </button>
        </div>

        {/* Contribution Impact Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "16px", borderRadius: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#fbbf24", textTransform: "uppercase" }}>
              My Total Verified Contribution
            </div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: "#fbbf24", marginTop: "2px" }}>
              ৳{donationSummary.totalVerifiedAmount.toLocaleString()} BDT
            </div>
            <div style={{ fontSize: "11.5px", color: "#e2e8f0", marginTop: "2px" }}>
              {donationSummary.donationsCount} contribution{donationSummary.donationsCount === 1 ? "" : "s"} recorded
            </div>
          </div>

          <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", padding: "16px", borderRadius: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
              Pending Verification
            </div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: "#38bdf8", marginTop: "2px" }}>
              ৳{donationSummary.totalPendingAmount.toLocaleString()} BDT
            </div>
            <div style={{ fontSize: "11.5px", color: "#cbd5e1", marginTop: "2px" }}>
              Awaiting admin review
            </div>
          </div>
        </div>

        {/* Category Breakdown Badges */}
        {Object.keys(donationSummary.categoryBreakdown).length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
              Category Breakdown (Approved)
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {Object.entries(donationSummary.categoryBreakdown).map(([cat, amt]) => (
                <div
                  key={cat}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#ffffff", fontWeight: 700 }}>{cat}:</span>
                  <span style={{ color: "#4ade80", fontWeight: 900 }}>৳{amt.toLocaleString()} BDT</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contribution History Table / Empty State */}
        <div>
          <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#ffffff", marginBottom: "10px" }}>
            Contribution History &amp; Receipts
          </div>

          {donationSummary.donations.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "12px",
                border: "1px dashed rgba(255, 255, 255, 0.12)",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              No contributions recorded yet. Click <strong>Contribute to Club</strong> above to support our sports teams!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {donationSummary.donations.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "#ffffff", fontSize: "13.5px" }}>{d.category}</strong>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          textTransform: "uppercase",
                          background:
                            d.status === "verified"
                              ? "rgba(34, 197, 94, 0.2)"
                              : d.status === "rejected"
                              ? "rgba(239, 68, 68, 0.2)"
                              : "rgba(245, 158, 11, 0.2)",
                          color:
                            d.status === "verified"
                              ? "#86efac"
                              : d.status === "rejected"
                              ? "#fca5a5"
                              : "#fef08a",
                          border:
                            d.status === "verified"
                              ? "1px solid rgba(34, 197, 94, 0.4)"
                              : d.status === "rejected"
                              ? "1px solid rgba(239, 68, 68, 0.4)"
                              : "1px solid rgba(245, 158, 11, 0.4)",
                        }}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                      TrxID: <span style={{ fontFamily: "monospace", color: "#f43f5e" }}>{d.transactionId}</span> ·{" "}
                      {new Date(d.donatedAt).toLocaleDateString()}
                      {d.donorNote && <span style={{ fontStyle: "italic" }}> · &quot;{d.donorNote}&quot;</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: d.status === "verified" ? "#4ade80" : "#fbbf24" }}>
                      ৳{parseFloat(d.amount).toLocaleString()} BDT
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        defaultCategory={selectedDonationCategory}
        donorName={memberData?.fullName}
        donorStudentId={memberData?.studentId}
        donorPhone={memberData?.phone}
      />

      {/* Renewal Modal */}
      {memberData && (
        <RenewalModal
          isOpen={isRenewalOpen}
          onClose={() => setIsRenewalOpen(false)}
          membershipNumber={memberData.membershipNumber}
          fullName={memberData.fullName}
          studentId={memberData.studentId}
          renewalFee={renewalFee}
        />
      )}
    </div>
  );
}
