// lib/export-excel.ts
import * as XLSX from "xlsx";
import type { AdminMemberRow, AdminDonationRow } from "@/actions/admin";

export function exportMembersToExcel(members: AdminMemberRow[]) {
  const data = members.map((m, idx) => {
    let sportsText = "";
    try {
      const parsed = JSON.parse(m.sportsInterests);
      sportsText = Array.isArray(parsed) ? parsed.join(", ") : m.sportsInterests;
    } catch {
      sportsText = m.sportsInterests;
    }

    return {
      "SL": idx + 1,
      "Membership ID": m.membershipNumber,
      "Full Name": m.fullName,
      "Student ID": m.studentId,
      "Email": m.email,
      "Phone (WhatsApp)": m.phone,
      "Department": m.department,
      "Semester": m.semester,
      "Gender": m.gender,
      "Blood Group": m.bloodGroup,
      "Sports Interests": sportsText,
      "Jersey Size (For Later)": m.jerseySize,
      "Emergency Contact": m.emergencyContact || "N/A",
      "bKash Sender Phone": m.bkashNumber || "N/A",
      "bKash TrxID": m.transactionId,
      "Payment Amount (BDT)": m.paymentAmount,
      "Payment Status": m.paymentStatus.toUpperCase(),
      "🚩 ID Mismatch Flag": m.isFlagged ? "PROBABLE FAKE / MISMATCH" : "CLEAN",
      "Receipt Scanned Student ID": m.receiptStudentId || "N/A",
      "Flag Reason": m.flaggedReason || "",
      "Admin Notes": m.adminNotes || "",
      "Registered Date": new Date(m.registeredAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 6 },  // SL
    { wch: 18 }, // Membership ID
    { wch: 24 }, // Full Name
    { wch: 14 }, // Student ID
    { wch: 28 }, // Email
    { wch: 16 }, // Phone
    { wch: 32 }, // Department
    { wch: 10 }, // Semester
    { wch: 10 }, // Gender
    { wch: 12 }, // Blood Group
    { wch: 30 }, // Sports Interests
    { wch: 20 }, // Jersey Size
    { wch: 20 }, // Emergency Contact
    { wch: 18 }, // bKash Sender Phone
    { wch: 18 }, // bKash TrxID
    { wch: 14 }, // Payment Amount
    { wch: 16 }, // Payment Status
    { wch: 24 }, // Admin Notes
    { wch: 22 }, // Registered Date
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members 2026");

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `PaUGSC_Members_${timestamp}.xlsx`);
}

/**
 * Exports comprehensive, multi-sheet Financial Audit & Treasury Workbook (.xlsx)
 * Separates verified actual revenue from unverified/pending requests for transparent financial audit.
 */
export function exportFinancialAuditToExcel(
  members: AdminMemberRow[],
  donations: AdminDonationRow[] = [],
  settings?: {
    validityLabel?: string;
    membershipFee?: string;
  }
) {
  const memFee = parseFloat(settings?.membershipFee || "200") || 200;
  const verifiedMembers = members.filter((m) => m.paymentStatus === "verified");
  const pendingMembers = members.filter((m) => m.paymentStatus === "pending" || m.paymentStatus === "pending_renewal");
  const rejectedMembers = members.filter((m) => m.paymentStatus === "rejected");

  const verifiedDonations = donations.filter((d) => d.status === "verified");
  const pendingDonations = donations.filter((d) => d.status === "pending");
  const rejectedDonations = donations.filter((d) => d.status === "rejected");

  const verifiedMembershipTotal = verifiedMembers.length * memFee;
  const pendingMembershipTotal = pendingMembers.length * memFee;

  const verifiedDonationTotal = verifiedDonations.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
  const pendingDonationTotal = pendingDonations.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

  const grandTotalVerifiedTreasury = verifiedMembershipTotal + verifiedDonationTotal;
  const totalPendingRequests = pendingMembershipTotal + pendingDonationTotal;

  // Donation Categories Breakdown
  const categoriesMap: { [cat: string]: { verifiedCount: number; verifiedAmt: number; pendingCount: number; pendingAmt: number } } = {
    "Tournament & Inter-University Fund": { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 },
    "Jersey & Sports Equipment": { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 },
    "Training, Practice & Coaching": { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 },
    "General Club Expansion": { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 },
  };

  for (const d of donations) {
    const cat = d.category || "General Club Expansion";
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { verifiedCount: 0, verifiedAmt: 0, pendingCount: 0, pendingAmt: 0 };
    }
    const amt = parseFloat(d.amount) || 0;
    if (d.status === "verified") {
      categoriesMap[cat].verifiedCount += 1;
      categoriesMap[cat].verifiedAmt += amt;
    } else if (d.status === "pending") {
      categoriesMap[cat].pendingCount += 1;
      categoriesMap[cat].pendingAmt += amt;
    }
  }

  // ================= SHEET 1: TREASURY AUDIT SUMMARY =================
  const summaryData = [
    { "Metric / Category": "--- PRIMEASIA UNIVERSITY GAMES & SPORTS CLUB ---", "Details": "" },
    { "Metric / Category": "OFFICIAL TREASURY & FINANCIAL AUDIT STATEMENT", "Details": `Fiscal Season: ${settings?.validityLabel || "2026-2027"}` },
    { "Metric / Category": "Audit Statement Generated At", "Details": new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }) },
    { "Metric / Category": "Financial Accounting Rule", "Details": "ONLY verified transactions are recognized as Actual Club Revenue." },
    { "Metric / Category": "", "Details": "" },
    { "Metric / Category": "=== GRAND EXECUTIVE SUMMARY ===", "Details": "" },
    { "Metric / Category": "TOTAL VERIFIED CLUB TREASURY (ACTUAL FUNDS)", "Details": `৳${grandTotalVerifiedTreasury.toLocaleString()} BDT` },
    { "Metric / Category": "Total Verified Membership Revenue", "Details": `৳${verifiedMembershipTotal.toLocaleString()} BDT (${verifiedMembers.length} Members @ ৳${memFee})` },
    { "Metric / Category": "Total Verified Donations & Sponsorships", "Details": `৳${verifiedDonationTotal.toLocaleString()} BDT (${verifiedDonations.length} Contributions)` },
    { "Metric / Category": "Total Pending / Unverified Requests (Not Counted in Treasury)", "Details": `৳${totalPendingRequests.toLocaleString()} BDT (${pendingMembers.length + pendingDonations.length} Pending Requests)` },
    { "Metric / Category": "Total Suspicious / Flagged Applications", "Details": `${members.filter((m) => m.isFlagged).length} Flagged Requests` },
    { "Metric / Category": "", "Details": "" },
    { "Metric / Category": "=== FUND STREAM & CATEGORY BREAKDOWN ===", "Details": "" },
    {
      "Metric / Category": "1. Membership Registration Fees",
      "Verified Count": verifiedMembers.length,
      "Verified Revenue (BDT)": verifiedMembershipTotal,
      "Pending Count": pendingMembers.length,
      "Pending Requests (BDT)": pendingMembershipTotal,
      "Audit Classification": "Verified Actual Revenue",
    },
    ...Object.entries(categoriesMap).map(([cat, stats], idx) => ({
      "Metric / Category": `${idx + 2}. ${cat}`,
      "Verified Count": stats.verifiedCount,
      "Verified Revenue (BDT)": stats.verifiedAmt,
      "Pending Count": stats.pendingCount,
      "Pending Requests (BDT)": stats.pendingAmt,
      "Audit Classification": "Verified Contribution Fund",
    })),
    {
      "Metric / Category": "GRAND TOTAL VERIFIED TREASURY",
      "Verified Count": verifiedMembers.length + verifiedDonations.length,
      "Verified Revenue (BDT)": grandTotalVerifiedTreasury,
      "Pending Count": pendingMembers.length + pendingDonations.length,
      "Pending Requests (BDT)": totalPendingRequests,
      "Audit Classification": "100% RECONCILED & VERIFIED",
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 44 }, { wch: 28 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 28 }];

  // ================= SHEET 2: VERIFIED TRANSACTIONS LEDGER =================
  const verifiedTransactions = [
    ...verifiedMembers.map((m) => ({
      date: new Date(m.registeredAt),
      category: "Membership Registration",
      type: "Membership Dues",
      name: m.fullName,
      studentId: m.studentId,
      phone: m.phone,
      email: m.email,
      trxId: m.transactionId,
      amount: memFee,
      status: "VERIFIED",
      verifiedDate: m.updatedAt ? new Date(m.updatedAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }) : "N/A",
      notes: `Membership Pass: ${m.membershipNumber} · Dept: ${m.department}`,
    })),
    ...verifiedDonations.map((d) => ({
      date: new Date(d.donatedAt),
      category: d.category,
      type: "Club Contribution / Patron",
      name: d.donorName,
      studentId: d.donorStudentId,
      phone: d.donorPhone || "N/A",
      email: d.donorEmail,
      trxId: d.transactionId,
      amount: parseFloat(d.amount) || 0,
      status: "VERIFIED",
      verifiedDate: d.verifiedAt ? new Date(d.verifiedAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }) : "N/A",
      notes: d.donorNote ? `Donor Note: "${d.donorNote}"` : "General Contribution",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const ledgerData = verifiedTransactions.map((t, idx) => ({
    "SL": idx + 1,
    "Date": t.date.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }),
    "Income Stream / Fund": t.category,
    "Payment Type": t.type,
    "Payer / Athlete Name": t.name,
    "Student ID": t.studentId,
    "bKash TrxID": t.trxId,
    "Verified Amount (BDT)": t.amount,
    "Phone Number": t.phone,
    "Email Address": t.email,
    "Audit Status": t.status,
    "Verified Date": t.verifiedDate,
    "Notes & References": t.notes,
  }));

  const ledgerSheet = XLSX.utils.json_to_sheet(ledgerData);
  ledgerSheet["!cols"] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 32 },
    { wch: 24 },
    { wch: 26 },
    { wch: 15 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
    { wch: 20 },
    { wch: 40 },
  ];

  // ================= SHEET 3: PENDING & UNVERIFIED REQUESTS =================
  const pendingTransactions = [
    ...pendingMembers.map((m) => ({
      date: new Date(m.registeredAt),
      category: "Membership Registration",
      type: m.paymentStatus === "pending_renewal" ? "Membership Renewal Request" : "New Membership Request",
      name: m.fullName,
      studentId: m.studentId,
      phone: m.phone,
      trxId: m.transactionId,
      amount: memFee,
      status: m.paymentStatus.toUpperCase(),
      flag: m.isFlagged ? `🚩 SUSPECT: ${m.flaggedReason || "ID Mismatch"}` : "Awaiting Verification",
    })),
    ...pendingDonations.map((d) => ({
      date: new Date(d.donatedAt),
      category: d.category,
      type: "Contribution Request",
      name: d.donorName,
      studentId: d.donorStudentId,
      phone: d.donorPhone || "N/A",
      trxId: d.transactionId,
      amount: parseFloat(d.amount) || 0,
      status: "PENDING",
      flag: "Awaiting Verification",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const pendingData = pendingTransactions.map((p, idx) => ({
    "SL": idx + 1,
    "Request Date": p.date.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }),
    "Fund Stream": p.category,
    "Request Type": p.type,
    "Applicant / Donor": p.name,
    "Student ID": p.studentId,
    "Submitted TrxID": p.trxId,
    "Claimed Amount (BDT)": p.amount,
    "Phone": p.phone,
    "Verification Status": p.status,
    "Audit Note": "NOT COUNTED IN ACTUAL TREASURY UNTIL VERIFIED",
    "Security Flag": p.flag,
  }));

  const pendingSheet = XLSX.utils.json_to_sheet(pendingData);
  pendingSheet["!cols"] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 28 },
    { wch: 26 },
    { wch: 24 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 48 },
    { wch: 30 },
  ];

  // ================= SHEET 4: REJECTED & DISPUTED REQUESTS =================
  const rejectedTransactions = [
    ...rejectedMembers.map((m) => ({
      date: new Date(m.registeredAt),
      category: "Membership Registration",
      type: "Rejected Application",
      name: m.fullName,
      studentId: m.studentId,
      phone: m.phone,
      trxId: m.transactionId,
      amount: memFee,
      reason: m.flaggedReason || (m.isFlagged ? "Receipt ID Mismatch" : "Invalid / Duplicate TrxID"),
    })),
    ...rejectedDonations.map((d) => ({
      date: new Date(d.donatedAt),
      category: d.category,
      type: "Rejected Donation",
      name: d.donorName,
      studentId: d.donorStudentId,
      phone: d.donorPhone || "N/A",
      trxId: d.transactionId,
      amount: parseFloat(d.amount) || 0,
      reason: "Unverified / Non-matching bKash TrxID",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const rejectedData = rejectedTransactions.map((r, idx) => ({
    "SL": idx + 1,
    "Date": r.date.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }),
    "Fund Stream": r.category,
    "Record Type": r.type,
    "Name": r.name,
    "Student ID": r.studentId,
    "bKash TrxID": r.trxId,
    "Amount (BDT)": r.amount,
    "Phone": r.phone,
    "Rejection / Flag Reason": r.reason,
    "Status": "REJECTED",
  }));

  const rejectedSheet = XLSX.utils.json_to_sheet(rejectedData);
  rejectedSheet["!cols"] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 28 },
    { wch: 24 },
    { wch: 24 },
    { wch: 15 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 40 },
    { wch: 14 },
  ];

  // ================= WORKBOOK COMPILATION =================
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Treasury Summary");
  XLSX.utils.book_append_sheet(workbook, ledgerSheet, "Verified Ledger");
  XLSX.utils.book_append_sheet(workbook, pendingSheet, "Pending Requests");
  XLSX.utils.book_append_sheet(workbook, rejectedSheet, "Rejected & Disputed");

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `PaUGSC_Financial_Audit_${timestamp}.xlsx`);
}
