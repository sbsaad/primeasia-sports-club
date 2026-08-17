import { jsPDF } from "jspdf";
import type { AdminMemberRow, AdminDonationRow } from "@/actions/admin";

export type MemberSlipData = {
  membershipNumber: string;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  department: string;
  semester: number | string;
  gender: string;
  bloodGroup: string;
  sportsInterests: string;
  jerseySize: string;
  emergencyContact?: string;
  bkashNumber?: string;
  transactionId: string;
  paymentAmount: string;
  paymentStatus: string;
  registeredAt: Date | string;
};

/**
 * Generates and downloads the Official Member Registration Slip (A4 Portrait)
 * with dynamic auto-wrapping and auto-scaling to prevent overflowing.
 */
export function downloadMemberSlipPdf(data: MemberSlipData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Premium Certificate Palette
  const cNavy = [11, 23, 48];        // #0b1730
  const cGold = [217, 119, 6];       // #d97706
  const cGoldLight = [245, 158, 11]; // #f59e0b
  const cTextDark = [15, 23, 42];    // #0f172a
  const cTextMuted = [100, 116, 139];// #64748b
  const cBoxBg = [248, 250, 252];    // #f8fafc
  const cBoxBorder = [226, 232, 240];// #e2e8f0

  // ================= 1. BORDERS & WATERMARK =================
  doc.setDrawColor(cGoldLight[0], cGoldLight[1], cGoldLight[2]);
  doc.setLineWidth(1.0);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin - 4) * 2);

  doc.setDrawColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.setLineWidth(0.35);
  doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - (margin - 2) * 2);

  // Watermark circle
  doc.setDrawColor(245, 235, 215);
  doc.setLineWidth(0.8);
  doc.circle(pageWidth / 2, 140, 52);
  doc.circle(pageWidth / 2, 140, 48);

  // ================= 2. TOP HEADER BANNER =================
  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.roundedRect(margin, margin, contentWidth, 32, 2, 2, "F");

  doc.setFillColor(cGoldLight[0], cGoldLight[1], cGoldLight[2]);
  doc.rect(margin, margin + 31.5, contentWidth, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("PRIMEASIA UNIVERSITY", pageWidth / 2, margin + 9, { align: "center" });

  doc.setFontSize(11.5);
  doc.setTextColor(251, 191, 36);
  doc.text("GAMES & SPORTS CLUB (PaUGSC)", pageWidth / 2, margin + 17, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(215, 230, 255);
  doc.text("OFFICIAL GENERAL MEMBER REGISTRATION SLIP · SEASON 2026", pageWidth / 2, margin + 24, { align: "center" });

  doc.setFontSize(7);
  doc.setTextColor(180, 200, 230);
  doc.text("Star Tower, 12 Kemal Ataturk Avenue, Banani, Dhaka-1213", pageWidth / 2, margin + 29, { align: "center" });

  // ================= 3. MEMBERSHIP ID & STATUS BAR =================
  let curY = margin + 37;

  const isVerified = data.paymentStatus === "verified";
  const isRejected = data.paymentStatus === "rejected";

  doc.setFillColor(cBoxBg[0], cBoxBg[1], cBoxBg[2]);
  doc.setDrawColor(cGoldLight[0], cGoldLight[1], cGoldLight[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, curY, contentWidth, 12, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text("MEMBERSHIP ID:", margin + 5, curY + 7.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(cGold[0], cGold[1], cGold[2]);
  doc.text(data.membershipNumber || "PAUSC-2026-0001", margin + 42, curY + 7.5);

  const statusLabel = isVerified
    ? "[ VERIFIED OFFICIAL MEMBER ]"
    : isRejected
    ? "[ PAYMENT REJECTED ]"
    : "[ PAYMENT PENDING VERIFICATION ]";

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  if (isVerified) {
    doc.setTextColor(22, 163, 74);
  } else if (isRejected) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(217, 119, 6);
  }
  doc.text(statusLabel, margin + contentWidth - 5, curY + 7.5, { align: "right" });

  // ================= 4. SECTION 1: STUDENT & ACADEMIC PROFILE =================
  curY += 16;

  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.roundedRect(margin, curY, contentWidth, 6, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("1. STUDENT & ACADEMIC PROFILE", margin + 4, curY + 4.2);

  curY += 8;

  // Auto-wrap Department if long
  const deptLines = doc.splitTextToSize(data.department || "N/A", contentWidth - 36);
  const extraDeptHeight = (deptLines.length - 1) * 4.5;
  const sec1Height = 48 + extraDeptHeight;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cBoxBorder[0], cBoxBorder[1], cBoxBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, sec1Height, 1.5, 1.5, "FD");

  let rY = curY + 6.5;

  // Row 1: Full Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Full Name:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(data.fullName || "Student Name", margin + 28, rY);

  rY += 8;

  // Row 2: Student ID & Email
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Student ID:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(data.studentId || "N/A", margin + 28, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Email Address:", margin + 92, rY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(data.email || "N/A", margin + 118, rY);

  rY += 8;

  // Row 3: Phone & Gender
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Phone / WA:", margin + 5, rY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(data.phone || "N/A", margin + 28, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Gender:", margin + 92, rY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(data.gender || "Male", margin + 118, rY);

  rY += 8;

  // Row 4: Department (Auto-wrapped)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Department:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(deptLines, margin + 28, rY);

  rY += 7 + extraDeptHeight;

  // Row 5: Semester & Blood Group
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Semester:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(cGold[0], cGold[1], cGold[2]);
  doc.text(`Semester ${data.semester}`, margin + 28, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Blood Group:", margin + 92, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38);
  doc.text(data.bloodGroup || "Unknown", margin + 118, rY);

  // ================= 5. SECTION 2: SPORTS & APPAREL =================
  curY += sec1Height + 5;

  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.roundedRect(margin, curY, contentWidth, 6, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("2. SPORTS PREFERENCES & APPAREL", margin + 4, curY + 4.2);

  curY += 8;

  let parsedSports = "";
  try {
    const s = JSON.parse(data.sportsInterests);
    parsedSports = Array.isArray(s) ? s.join(", ") : data.sportsInterests;
  } catch {
    parsedSports = data.sportsInterests;
  }

  // Auto-wrap sports across multiple lines cleanly
  const sportsLines = doc.splitTextToSize(parsedSports || "General Athletics", contentWidth - 36);
  const sportsBlockHeight = (sportsLines.length - 1) * 4.5;
  const sec2Height = 26 + sportsBlockHeight;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cBoxBorder[0], cBoxBorder[1], cBoxBorder[2]);
  doc.roundedRect(margin, curY, contentWidth, sec2Height, 1.5, 1.5, "FD");

  rY = curY + 6.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Sports Selected:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(sportsLines, margin + 32, rY);

  rY += 6.5 + sportsBlockHeight;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Jersey Size:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(`${data.jerseySize || "M"} (Recorded for future tournaments & club events)`, margin + 32, rY);

  rY += 6.5;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("* Note: Jersey size recorded for future use/events. No jersey is being distributed currently.", margin + 5, rY);

  // ================= 6. SECTION 3: BKASH PAYMENT & VERIFICATION =================
  curY += sec2Height + 5;

  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.roundedRect(margin, curY, contentWidth, 6, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("3. bKASH PAYMENT & VERIFICATION", margin + 4, curY + 4.2);

  curY += 8;
  const sec3Height = 34;
  doc.setFillColor(cBoxBg[0], cBoxBg[1], cBoxBg[2]);
  doc.setDrawColor(cBoxBorder[0], cBoxBorder[1], cBoxBorder[2]);
  doc.roundedRect(margin, curY, contentWidth, sec3Height, 1.5, 1.5, "FD");

  rY = curY + 6.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Payment Method:", margin + 5, rY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text("bKash App (Education Fee -> Primeasia University -> Others)", margin + 32, rY);

  rY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("bKash TrxID:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(226, 19, 110);
  doc.text(data.transactionId || "N/A", margin + 32, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Amount Paid:", margin + 92, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(22, 163, 74);
  doc.text(`${data.paymentAmount || "200"} BDT`, margin + 118, rY);

  rY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Sender Phone:", margin + 5, rY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(data.bkashNumber || "Verified via TrxID", margin + 32, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Submission Date:", margin + 92, rY);

  const regDate = new Date(data.registeredAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(regDate, margin + 118, rY);

  // ================= 7. SIGNATURES =================
  curY += sec3Height + 10;

  doc.setDrawColor(cGold[0], cGold[1], cGold[2]);
  doc.setLineWidth(0.4);
  doc.line(margin + 10, curY + 8, margin + 65, curY + 8);
  doc.line(margin + contentWidth - 65, curY + 8, margin + contentWidth - 10, curY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text("Student Signature", margin + 22, curY + 13);
  doc.text("Authorized Club Official", margin + contentWidth - 55, curY + 13);

  // Bottom Notice
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text(
    "Please retain this slip. Bring a printed or digital copy for club verification, jersey distribution, and tournament clearances.",
    pageWidth / 2,
    pageHeight - margin - 2,
    { align: "center" }
  );

  const safeName = (data.fullName || "Student").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`PaUGSC_Membership_Slip_${safeName}_${data.studentId}.pdf`);
}

/**
 * Downloads the Official General Members Roster PDF for Admins (Landscape A4)
 * with full non-truncated department names, student names, auto-wrapping and auto-paging.
 */
export function downloadAdminRosterPdf(members: AdminMemberRow[]) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  const drawHeader = (pageNum: number, totalPages?: number) => {
    doc.setFillColor(11, 23, 48);
    doc.roundedRect(margin, margin, contentWidth, 20, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("PRIMEASIA UNIVERSITY GAMES & SPORTS CLUB (PaUGSC)", pageWidth / 2, margin + 7.5, { align: "center" });

    doc.setFontSize(8.5);
    doc.setTextColor(245, 158, 11);
    const dateStr = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
    doc.text(
      `OFFICIAL GENERAL MEMBERS ROSTER · Total: ${members.length} Members · Generated: ${dateStr}${totalPages ? ` · Page ${pageNum}` : ""}`,
      pageWidth / 2,
      margin + 15,
      { align: "center" }
    );
  };

  drawHeader(1);

  // Column Positions and Widths (Total ~281mm)
  const cols = [
    { label: "#", x: margin + 2, w: 8 },
    { label: "Member ID", x: margin + 10, w: 26 },
    { label: "Full Name", x: margin + 37, w: 46 },
    { label: "Student ID", x: margin + 84, w: 22 },
    { label: "Department", x: margin + 107, w: 62 },
    { label: "Phone", x: margin + 170, w: 25 },
    { label: "Blood", x: margin + 196, w: 12 },
    { label: "bKash TrxID", x: margin + 209, w: 28 },
    { label: "Status", x: margin + 238, w: 22 },
    { label: "Sports", x: margin + 261, w: 20 },
  ];

  const drawTableHeader = (startY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, startY - 4.5, contentWidth, 6.5, 1, 1, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    cols.forEach((col) => {
      doc.text(col.label, col.x, startY);
    });
  };

  let y = margin + 28;
  drawTableHeader(y);
  y += 6;

  let pageIndex = 1;

  members.forEach((m, i) => {
    // Wrap student name and department without truncation
    const nameLines = doc.splitTextToSize(m.fullName || "N/A", 44);
    const deptLines = doc.splitTextToSize(m.department || "N/A", 60);

    let sportsStr = "";
    try {
      const s = JSON.parse(m.sportsInterests);
      sportsStr = Array.isArray(s) ? s.join(", ") : m.sportsInterests;
    } catch {
      sportsStr = m.sportsInterests || "";
    }
    const sportsLines = doc.splitTextToSize(sportsStr || "-", 19);

    const maxLines = Math.max(nameLines.length, deptLines.length, 1);
    const rowHeight = Math.max(5.5, maxLines * 3.8 + 2);

    if (y + rowHeight > pageHeight - 12) {
      doc.addPage();
      pageIndex++;
      drawHeader(pageIndex);
      y = margin + 28;
      drawTableHeader(y);
      y += 6;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3.8, contentWidth, rowHeight, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);

    // Render cells
    doc.text(String(i + 1), cols[0].x, y);
    doc.text(m.membershipNumber || "PAUSC-2026-", cols[1].x, y);
    doc.text(nameLines, cols[2].x, y);
    doc.text(m.studentId || "N/A", cols[3].x, y);
    doc.text(deptLines, cols[4].x, y);
    doc.text(m.phone || "N/A", cols[5].x, y);
    doc.text(m.bloodGroup || "N/A", cols[6].x, y);
    doc.text(m.transactionId || "N/A", cols[7].x, y);

    // Status styling
    if (m.paymentStatus === "verified") {
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
    } else if (m.paymentStatus === "rejected") {
      doc.setTextColor(220, 38, 38);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(217, 119, 6);
      doc.setFont("helvetica", "bold");
    }
    doc.text((m.paymentStatus || "pending").toUpperCase(), cols[8].x, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(sportsLines.slice(0, 1), cols[9].x, y);

    y += rowHeight;
  });

  doc.save(`PaUGSC_Members_Roster_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Downloads the High-Resolution Dual-Sided 3D Holographic ID Card (CR80 Standard / High-Res Printable)
 * Generates both Front and Back side of the card with authentic metallic-gold PaUGSC styling.
 */
export function downloadIdCardPdf(data: MemberSlipData) {
  // CR80 Standard dimensions: 85.60 mm × 53.98 mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [85.6, 54],
  });

  const cardW = 85.6;
  const cardH = 54;

  let parsedSports: string[] = [];
  try {
    const s = JSON.parse(data.sportsInterests);
    parsedSports = Array.isArray(s) ? s : [data.sportsInterests];
  } catch {
    parsedSports = data.sportsInterests ? data.sportsInterests.split(",").map((s) => s.trim()) : [];
  }

  const isVerified = data.paymentStatus === "verified";
  const isRejected = data.paymentStatus === "rejected";

  // =========================================================================
  // PAGE 1: FRONT SIDE (3D Holographic Cyber Navy & Gold Membership Pass)
  // =========================================================================
  
  // Background gradient block
  doc.setFillColor(11, 23, 48); // Deep Cyber Navy
  doc.roundedRect(0, 0, cardW, cardH, 3, 3, "F");

  // Subtle gradient accent
  doc.setFillColor(18, 40, 84);
  doc.roundedRect(1, 1, cardW - 2, cardH - 2, 2.5, 2.5, "F");

  // Metallic Gold Outer Border
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.6);
  doc.roundedRect(1.2, 1.2, cardW - 2.4, cardH - 2.4, 2.5, 2.5, "D");

  // Corner accents
  doc.setDrawColor(254, 240, 138);
  doc.setLineWidth(0.3);
  doc.roundedRect(2, 2, cardW - 4, cardH - 4, 2, 2, "D");

  // Top Bar Header
  // Sports Icon Box
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(3.5, 3.5, 7, 7, 1.5, 1.5, "F");
  doc.setTextColor(11, 23, 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SC", 7, 8.2, { align: "center" });

  // Club Name
  doc.setTextColor(251, 191, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.2);
  doc.text("PaUGSC · OFFICIAL PASS 2026", 12, 5.8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.8);
  doc.text("PRIMEASIA UNIVERSITY", 12, 9.2);

  // Holographic Verification Pill
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  if (isVerified) {
    doc.setFillColor(22, 163, 74);
    doc.roundedRect(cardW - 19, 3.5, 15.5, 4.5, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("✓ VERIFIED", cardW - 11.2, 6.7, { align: "center" });
  } else if (isRejected) {
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(cardW - 19, 3.5, 15.5, 4.5, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("✕ REJECTED", cardW - 11.2, 6.7, { align: "center" });
  } else {
    doc.setFillColor(217, 119, 6);
    doc.roundedRect(cardW - 19, 3.5, 15.5, 4.5, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("⏱ PENDING", cardW - 11.2, 6.7, { align: "center" });
  }

  // Middle Section: Avatar Box + Student Info
  // Avatar Circle / Box
  doc.setFillColor(29, 78, 216);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.roundedRect(3.5, 12.5, 14, 16, 2, 2, "FD");

  doc.setTextColor(254, 240, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const initialLetter = data.fullName ? data.fullName[0].toUpperCase() : "P";
  doc.text(initialLetter, 10.5, 23.5, { align: "center" });

  // Full Name (with wrapping)
  const nameLines = doc.splitTextToSize(data.fullName || "Student Name", 48);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(nameLines.slice(0, 1), 19.5, 16);

  // Student ID (without semester)
  doc.setFontSize(6.2);
  doc.setTextColor(56, 189, 248); // Cyan
  doc.text(`ID: ${data.studentId || "24200000"}`, 19.5, 20.5);

  // Department Name (cleanly wrapped to 48mm)
  const deptLines = doc.splitTextToSize(data.department || "Primeasia University", 48);
  doc.setTextColor(203, 213, 225); // Slate light
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.2);
  doc.text(deptLines.slice(0, 2), 19.5, 24.5);

  // Gold Microchip Graphic
  doc.setFillColor(234, 179, 8);
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(0.2);
  doc.roundedRect(cardW - 12.5, 13.5, 9, 6.5, 1, 1, "FD");
  doc.setFillColor(161, 98, 7);
  doc.rect(cardW - 10.5, 14.8, 5, 3.8, "F");

  // Sports Tags Bar
  let tagX = 3.5;
  parsedSports.slice(0, 3).forEach((sport) => {
    const sText = sport.length > 12 ? sport.slice(0, 11) + "…" : sport;
    const tagW = Math.min(22, sText.length * 1.8 + 4);
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(tagX, 31, tagW, 4, 1, 1, "F");
    doc.setTextColor(11, 23, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.8);
    doc.text(sText, tagX + tagW / 2, 33.8, { align: "center" });
    tagX += tagW + 2;
  });

  if (parsedSports.length > 3) {
    const moreText = `+${parsedSports.length - 3} more`;
    doc.setFillColor(56, 189, 248);
    doc.roundedRect(tagX, 31, 13, 4, 1, 1, "F");
    doc.setTextColor(11, 23, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.8);
    doc.text(moreText, tagX + 6.5, 33.8, { align: "center" });
  }

  // Bottom Bar: Membership Code & TrxID
  doc.setFillColor(11, 23, 48);
  doc.rect(1.5, 37.5, cardW - 3, 15, "F");
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.line(2, 37.5, cardW - 2, 37.5);

  doc.setFontSize(4.8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.text("MEMBERSHIP CODE", 4, 42);

  doc.setFontSize(7.5);
  doc.setTextColor(254, 240, 138); // Yellow
  doc.text(data.membershipNumber || "PAUSC-2026-0001", 4, 47.5);

  doc.setFontSize(4.8);
  doc.setTextColor(148, 163, 184);
  doc.text("PASS VALIDITY", cardW - 4, 42, { align: "right" });

  doc.setFontSize(6.8);
  doc.setTextColor(56, 189, 248); // Cyan
  doc.text("SEASON 2026-2027", cardW - 4, 47.5, { align: "right" });

  // =========================================================================
  // PAGE 2: BACK SIDE (Verification Details, QR Code, Rules & Signatures)
  // =========================================================================
  doc.addPage([85.6, 54], "landscape");

  // Background
  doc.setFillColor(11, 23, 48);
  doc.roundedRect(0, 0, cardW, cardH, 3, 3, "F");

  doc.setFillColor(15, 32, 67);
  doc.roundedRect(1, 1, cardW - 2, cardH - 2, 2.5, 2.5, "F");

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.roundedRect(1.2, 1.2, cardW - 2.4, cardH - 2.4, 2.5, 2.5, "D");

  // Back Top Bar
  doc.setFontSize(5.5);
  doc.setTextColor(254, 240, 138);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL MEMBER CLEARANCE · 2026", 4, 5.8);

  doc.setFontSize(5.5);
  doc.setTextColor(56, 189, 248);
  doc.text("BLOOD: ", cardW - 18, 5.8);
  doc.setTextColor(239, 68, 68);
  doc.text(data.bloodGroup || "N/A", cardW - 8, 5.8);

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.25);
  doc.line(2, 7.5, cardW - 2, 7.5);

  // 4-Grid Stats Box
  const gridY = 9.5;
  const boxW = (cardW - 10) / 2;
  const boxH = 9;

  // Box 1: Jersey Size
  doc.setFillColor(11, 23, 48);
  doc.roundedRect(3.5, gridY, boxW, boxH, 1, 1, "F");
  doc.setFontSize(4.5);
  doc.setTextColor(148, 163, 184);
  doc.text("JERSEY SIZE", 5, gridY + 3.2);
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.jerseySize || "M"} (For Tournament Use)`, 5, gridY + 7.2);

  // Box 2: Club Status
  doc.setFillColor(11, 23, 48);
  doc.roundedRect(3.5 + boxW + 3, gridY, boxW, boxH, 1, 1, "F");
  doc.setFontSize(4.5);
  doc.setTextColor(148, 163, 184);
  doc.text("CLUB STATUS", 3.5 + boxW + 4.5, gridY + 3.2);
  doc.setFontSize(6.2);
  doc.setTextColor(74, 222, 128); // Green
  doc.setFont("helvetica", "bold");
  doc.text("Active Athlete (Certified)", 3.5 + boxW + 4.5, gridY + 7.2);

  // Box 3: Phone
  doc.setFillColor(11, 23, 48);
  doc.roundedRect(3.5, gridY + boxH + 2, boxW, boxH, 1, 1, "F");
  doc.setFontSize(4.5);
  doc.setTextColor(148, 163, 184);
  doc.text("PHONE / WHATSAPP", 5, gridY + boxH + 5.2);
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(data.phone || "N/A", 5, gridY + boxH + 9.2);

  // Box 4: Issued Date
  doc.setFillColor(11, 23, 48);
  doc.roundedRect(3.5 + boxW + 3, gridY + boxH + 2, boxW, boxH, 1, 1, "F");
  doc.setFontSize(4.5);
  doc.setTextColor(148, 163, 184);
  doc.text("REGISTRATION DATE", 3.5 + boxW + 4.5, gridY + boxH + 5.2);
  doc.setFontSize(5.8);
  doc.setTextColor(254, 240, 138);
  doc.setFont("helvetica", "bold");
  const issueDateStr = new Date(data.registeredAt).toLocaleDateString("en-GB");
  doc.text(issueDateStr, 3.5 + boxW + 4.5, gridY + boxH + 9.2);

  // QR Code Graphic & Notice Block
  const qrY = 32.5;

  // QR Code Box Placeholder
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(3.5, qrY, 14, 14, 1, 1, "F");
  doc.setFillColor(11, 23, 48);
  // QR pattern blocks
  doc.rect(4.5, qrY + 1, 3.5, 3.5, "F");
  doc.rect(13, qrY + 1, 3.5, 3.5, "F");
  doc.rect(4.5, qrY + 9.5, 3.5, 3.5, "F");
  doc.rect(9.5, qrY + 5.5, 2.5, 2.5, "F");
  doc.rect(13.5, qrY + 7.5, 2, 4, "F");

  // Disclaimer text
  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.4);
  const disclaimer =
    "This official card certifies registered membership of Primeasia University Games and Sports Club (PaUGSC) for season 2026. Carry this pass for inter-university tournaments, training, and jersey distribution.";
  const disLines = doc.splitTextToSize(disclaimer, 42);
  doc.text(disLines, 19.5, qrY + 3.5);

  // Star Tower Address
  doc.setTextColor(251, 191, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.2);
  doc.text("Primeasia University · Star Tower, 12 Kemal Ataturk Ave, Banani, Dhaka", 19.5, qrY + 12.5);

  // Official Signature Stamp
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.25);
  doc.line(cardW - 20, cardH - 5, cardW - 3.5, cardH - 5);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(3.8);
  doc.text("Club Authority", cardW - 12, cardH - 2.8, { align: "center" });

  const safeName = (data.fullName || "Student").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`PaUGSC_Official_ID_Card_${safeName}_${data.studentId}.pdf`);
}

/**
 * Downloads the Official Treasury & Financial Audit Statement PDF (Landscape A4)
 * Provides executive financial summary, fund stream breakdown, itemized verified ledger,
 * and official university signatory blocks.
 */
export function downloadFinancialAuditPdf(
  members: AdminMemberRow[],
  donations: AdminDonationRow[] = [],
  settings?: {
    validityLabel?: string;
    membershipFee?: string;
  }
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  const memFee = parseFloat(settings?.membershipFee || "200") || 200;
  const verifiedMembers = members.filter((m) => m.paymentStatus === "verified");
  const pendingMembers = members.filter((m) => m.paymentStatus === "pending" || m.paymentStatus === "pending_renewal");

  const verifiedDonations = donations.filter((d) => d.status === "verified");
  const pendingDonations = donations.filter((d) => d.status === "pending");

  const verifiedMembershipTotal = verifiedMembers.length * memFee;
  const pendingMembershipTotal = pendingMembers.length * memFee;

  const verifiedDonationTotal = verifiedDonations.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
  const pendingDonationTotal = pendingDonations.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

  const grandTotalVerifiedTreasury = verifiedMembershipTotal + verifiedDonationTotal;
  const totalPendingRequests = pendingMembershipTotal + pendingDonationTotal;

  // Fund Breakdown Mapping
  const categoriesMap: { [cat: string]: { verifiedCount: number; verifiedAmt: number; pendingAmt: number } } = {
    "Membership Registration": { verifiedCount: verifiedMembers.length, verifiedAmt: verifiedMembershipTotal, pendingAmt: pendingMembershipTotal },
    "Tournament & Inter-University Fund": { verifiedCount: 0, verifiedAmt: 0, pendingAmt: 0 },
    "Jersey & Sports Equipment": { verifiedCount: 0, verifiedAmt: 0, pendingAmt: 0 },
    "Training, Practice & Coaching": { verifiedCount: 0, verifiedAmt: 0, pendingAmt: 0 },
    "General Club Expansion": { verifiedCount: 0, verifiedAmt: 0, pendingAmt: 0 },
  };

  for (const d of donations) {
    const cat = d.category || "General Club Expansion";
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { verifiedCount: 0, verifiedAmt: 0, pendingAmt: 0 };
    }
    const amt = parseFloat(d.amount) || 0;
    if (d.status === "verified") {
      categoriesMap[cat].verifiedCount += 1;
      categoriesMap[cat].verifiedAmt += amt;
    } else if (d.status === "pending") {
      categoriesMap[cat].pendingAmt += amt;
    }
  }

  // Unified verified ledger transactions sorted newest first
  const verifiedTransactions = [
    ...verifiedMembers.map((m) => ({
      date: new Date(m.registeredAt),
      stream: "Membership Registration",
      name: m.fullName,
      studentId: m.studentId,
      trxId: m.transactionId,
      amount: memFee,
      ref: m.membershipNumber,
    })),
    ...verifiedDonations.map((d) => ({
      date: new Date(d.donatedAt),
      stream: d.category,
      name: d.donorName,
      studentId: d.donorStudentId,
      trxId: d.transactionId,
      amount: parseFloat(d.amount) || 0,
      ref: d.donorNote ? `Note: "${d.donorNote.slice(0, 16)}"` : "Donation",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Header Renderer
  const drawAuditHeader = (pageNum: number, totalPages?: number) => {
    doc.setFillColor(11, 23, 48);
    doc.roundedRect(margin, margin, contentWidth, 20, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("PRIMEASIA UNIVERSITY GAMES & SPORTS CLUB (PaUGSC)", pageWidth / 2, margin + 7.5, { align: "center" });

    doc.setFontSize(8.5);
    doc.setTextColor(245, 158, 11);
    const dateStr = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
    doc.text(
      `OFFICIAL TREASURY & FINANCIAL AUDIT STATEMENT · Season: ${settings?.validityLabel || "2026-2027"} · Generated: ${dateStr}${totalPages ? ` · Page ${pageNum}` : ""}`,
      pageWidth / 2,
      margin + 15,
      { align: "center" }
    );
  };

  drawAuditHeader(1);

  let curY = margin + 23;

  // 1. Notice of Financial Integrity Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, contentWidth, 8.5, 1, 1, "FD");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.text(
    "FINANCIAL INTEGRITY RULE: Only payments with status 'VERIFIED' are counted as Actual Club Treasury. Pending requests are cataloged separately.",
    margin + 4,
    curY + 5.5
  );

  curY += 11;

  // 2. Executive 4-KPI Metric Cards
  const kpiW = (contentWidth - 9) / 4;
  const kpiH = 18;

  // KPI 1: Grand Verified Treasury
  doc.setFillColor(240, 253, 244); // Light Green
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, curY, kpiW, kpiH, 1.5, 1.5, "FD");
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL VERIFIED TREASURY", margin + 4, curY + 5);
  doc.setFontSize(12);
  doc.text(`${grandTotalVerifiedTreasury.toLocaleString()} BDT`, margin + 4, curY + 11.5);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`${verifiedTransactions.length} Verified Transactions`, margin + 4, curY + 15.5);

  // KPI 2: Membership Fees
  doc.setFillColor(254, 252, 232); // Light Yellow
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + kpiW + 3, curY, kpiW, kpiH, 1.5, 1.5, "FD");
  doc.setFontSize(6.5);
  doc.setTextColor(133, 77, 14);
  doc.setFont("helvetica", "bold");
  doc.text("VERIFIED MEMBERSHIP DUES", margin + kpiW + 7, curY + 5);
  doc.setFontSize(11);
  doc.text(`${verifiedMembershipTotal.toLocaleString()} BDT`, margin + kpiW + 7, curY + 11.5);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`${verifiedMembers.length} Members @ ${memFee} BDT`, margin + kpiW + 7, curY + 15.5);

  // KPI 3: Donations & Patrons
  doc.setFillColor(240, 249, 255); // Light Blue
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + (kpiW + 3) * 2, curY, kpiW, kpiH, 1.5, 1.5, "FD");
  doc.setFontSize(6.5);
  doc.setTextColor(3, 105, 161);
  doc.setFont("helvetica", "bold");
  doc.text("DONATIONS & CONTRIBUTIONS", margin + (kpiW + 3) * 2 + 4, curY + 5);
  doc.setFontSize(11);
  doc.text(`${verifiedDonationTotal.toLocaleString()} BDT`, margin + (kpiW + 3) * 2 + 4, curY + 11.5);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`${verifiedDonations.length} Verified Donations`, margin + (kpiW + 3) * 2 + 4, curY + 15.5);

  // KPI 4: Pending Requests
  doc.setFillColor(254, 242, 242); // Light Red
  doc.setDrawColor(248, 113, 113);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin + (kpiW + 3) * 3, curY, kpiW, kpiH, 1.5, 1.5, "FD");
  doc.setFontSize(6.5);
  doc.setTextColor(153, 27, 27);
  doc.setFont("helvetica", "bold");
  doc.text("PENDING REQUESTS (NOT IN TREASURY)", margin + (kpiW + 3) * 3 + 4, curY + 5);
  doc.setFontSize(11);
  doc.text(`${totalPendingRequests.toLocaleString()} BDT`, margin + (kpiW + 3) * 3 + 4, curY + 11.5);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`${pendingMembers.length + pendingDonations.length} Pending Review`, margin + (kpiW + 3) * 3 + 4, curY + 15.5);

  curY += kpiH + 6;

  // 3. Fund Stream Summary Table
  doc.setFillColor(11, 23, 48);
  doc.rect(margin, curY, contentWidth, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("INCOME STREAM & FUND ALLOCATION BREAKDOWN", margin + 3, curY + 4.2);

  curY += 6;

  // Sub-headers
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, curY, contentWidth, 5.5, "F");
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.text("Category / Fund Stream", margin + 4, curY + 3.8);
  doc.text("Verified Count", margin + 100, curY + 3.8);
  doc.text("Verified Actual (BDT)", margin + 140, curY + 3.8);
  doc.text("Pending Requests (BDT)", margin + 195, curY + 3.8);
  doc.text("Treasury Share (%)", margin + 245, curY + 3.8);

  curY += 5.5;

  Object.entries(categoriesMap).forEach(([cat, stats], i) => {
    const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, curY, contentWidth, 5.5, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.text(cat, margin + 4, curY + 3.8);
    doc.text(String(stats.verifiedCount), margin + 105, curY + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52); // Green
    doc.text(`${stats.verifiedAmt.toLocaleString()} BDT`, margin + 140, curY + 3.8);

    doc.setTextColor(153, 27, 27); // Red
    doc.setFont("helvetica", "normal");
    doc.text(`${stats.pendingAmt.toLocaleString()} BDT`, margin + 195, curY + 3.8);

    const share = grandTotalVerifiedTreasury > 0 ? ((stats.verifiedAmt / grandTotalVerifiedTreasury) * 100).toFixed(1) : "0.0";
    doc.setTextColor(15, 23, 42);
    doc.text(`${share}%`, margin + 250, curY + 3.8);

    curY += 5.5;
  });

  // Grand Total Summary Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, curY, contentWidth, 6, "F");
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, curY, margin + contentWidth, curY);
  doc.setTextColor(11, 23, 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.text("GRAND TOTAL RECONCILED TREASURY", margin + 4, curY + 4.2);
  doc.text(String(verifiedTransactions.length), margin + 105, curY + 4.2);
  doc.setTextColor(22, 101, 52);
  doc.text(`${grandTotalVerifiedTreasury.toLocaleString()} BDT`, margin + 140, curY + 4.2);
  doc.setTextColor(153, 27, 27);
  doc.text(`${totalPendingRequests.toLocaleString()} BDT`, margin + 195, curY + 4.2);
  doc.setTextColor(11, 23, 48);
  doc.text("100.0%", margin + 250, curY + 4.2);

  curY += 10;

  // 4. Itemized Verified Ledger Table
  doc.setFillColor(11, 23, 48);
  doc.rect(margin, curY, contentWidth, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`ITEMIZED VERIFIED TRANSACTIONS LEDGER (${verifiedTransactions.length} Verified Entries)`, margin + 3, curY + 4.2);

  curY += 6;

  // Ledger Table Headers
  const ledgerCols = [
    { label: "#", x: margin + 2, w: 8 },
    { label: "Date", x: margin + 10, w: 22 },
    { label: "Fund / Stream", x: margin + 32, w: 55 },
    { label: "Payer / Athlete", x: margin + 87, w: 50 },
    { label: "Student ID", x: margin + 137, w: 25 },
    { label: "bKash TrxID", x: margin + 162, w: 32 },
    { label: "Amount (BDT)", x: margin + 194, w: 28 },
    { label: "Reference / Pass", x: margin + 222, w: 58 },
  ];

  doc.setFillColor(226, 232, 240);
  doc.rect(margin, curY, contentWidth, 5.5, "F");
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  ledgerCols.forEach((c) => doc.text(c.label, c.x, curY + 3.8));

  curY += 5.5;

  let pageIndex = 1;
  const rowH = 6;

  verifiedTransactions.forEach((t, idx) => {
    // Check if new page is needed
    if (curY + rowH > pageHeight - margin - 22) {
      doc.addPage([297, 210], "landscape");
      pageIndex++;
      drawAuditHeader(pageIndex);
      curY = margin + 24;

      // Repeat Table Headers on next page
      doc.setFillColor(226, 232, 240);
      doc.rect(margin, curY, contentWidth, 5.5, "F");
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      ledgerCols.forEach((c) => doc.text(c.label, c.x, curY + 3.8));
      curY += 5.5;
    }

    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, curY, contentWidth, rowH, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(idx + 1), ledgerCols[0].x, curY + 4);

    doc.text(t.date.toLocaleDateString("en-GB"), ledgerCols[1].x, curY + 4);

    doc.setTextColor(15, 23, 42);
    doc.text(t.stream.length > 30 ? t.stream.slice(0, 29) + "…" : t.stream, ledgerCols[2].x, curY + 4);

    doc.setFont("helvetica", "bold");
    doc.text(t.name.length > 25 ? t.name.slice(0, 24) + "…" : t.name, ledgerCols[3].x, curY + 4);

    doc.setFont("helvetica", "normal");
    doc.text(t.studentId, ledgerCols[4].x, curY + 4);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(226, 19, 110);
    doc.text(t.trxId, ledgerCols[5].x, curY + 4);

    doc.setTextColor(22, 101, 52);
    doc.text(`${t.amount.toLocaleString()} BDT`, ledgerCols[6].x, curY + 4);

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(t.ref.length > 32 ? t.ref.slice(0, 31) + "…" : t.ref, ledgerCols[7].x, curY + 4);

    curY += rowH;
  });

  // Signatory Blocks at bottom of final page
  const sigY = pageHeight - margin - 15;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);

  const sigBlockW = (contentWidth - 30) / 4;
  for (let s = 0; s < 4; s++) {
    const sX = margin + s * (sigBlockW + 10);
    doc.line(sX, sigY, sX + sigBlockW, sigY);
  }

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 23, 48);
  doc.text("Club President", margin + sigBlockW / 2, sigY + 4, { align: "center" });
  doc.text("General Secretary / Treasurer", margin + sigBlockW + 10 + sigBlockW / 2, sigY + 4, { align: "center" });
  doc.text("Club Faculty Advisor", margin + (sigBlockW + 10) * 2 + sigBlockW / 2, sigY + 4, { align: "center" });
  doc.text("University Accounts & Audit", margin + (sigBlockW + 10) * 3 + sigBlockW / 2, sigY + 4, { align: "center" });

  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`PaUGSC_Financial_Audit_Report_${dateSlug}.pdf`);
}

