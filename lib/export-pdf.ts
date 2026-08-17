// lib/export-pdf.ts
import { jsPDF } from "jspdf";
import type { AdminMemberRow } from "@/actions/admin";

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
  const cNavyCard = [19, 39, 78];    // #13274e
  const cGold = [217, 119, 6];       // #d97706
  const cGoldLight = [245, 158, 11]; // #f59e0b
  const cGoldPale = [254, 243, 199]; // #fef3c7
  const cTextDark = [15, 23, 42];    // #0f172a
  const cTextMuted = [100, 116, 139];// #64748b
  const cBoxBg = [248, 250, 252];    // #f8fafc
  const cBoxBorder = [226, 232, 240];// #e2e8f0

  // ================= 1. BORDERS & WATERMARK =================
  // Outer double gold border
  doc.setDrawColor(cGoldLight[0], cGoldLight[1], cGoldLight[2]);
  doc.setLineWidth(1.0);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin - 4) * 2);

  doc.setDrawColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.setLineWidth(0.35);
  doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - (margin - 2) * 2);

  // Subtle Watermark Circle in Center
  doc.setDrawColor(245, 235, 215);
  doc.setLineWidth(0.8);
  doc.circle(pageWidth / 2, 140, 52);
  doc.circle(pageWidth / 2, 140, 48);

  // ================= 2. TOP HEADER BANNER =================
  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.roundedRect(margin, margin, contentWidth, 32, 2, 2, "F");

  // Gold accent strip below banner
  doc.setFillColor(cGoldLight[0], cGoldLight[1], cGoldLight[2]);
  doc.rect(margin, margin + 31.5, contentWidth, 1.5, "F");

  // University Header Text
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
    doc.setTextColor(22, 163, 74); // green
  } else if (isRejected) {
    doc.setTextColor(220, 38, 38); // red
  } else {
    doc.setTextColor(217, 119, 6);  // amber
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
  const sec1Height = 52;
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
  doc.text("Email Address:", margin + 95, rY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(data.email || "N/A", margin + 120, rY);

  rY += 8;

  // Row 3: Phone / WhatsApp & Gender
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
  doc.text("Gender:", margin + 95, rY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(data.gender || "Male", margin + 120, rY);

  rY += 8;

  // Row 4: Department (Full Width)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Department:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(data.department || "N/A", margin + 28, rY);

  rY += 8;

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
  doc.text("Blood Group:", margin + 95, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38);
  doc.text(data.bloodGroup || "Unknown", margin + 120, rY);

  // ================= 5. SECTION 2: SPORTS & APPAREL =================
  curY += sec1Height + 5;

  doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.roundedRect(margin, curY, contentWidth, 6, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("2. SPORTS PREFERENCES & APPAREL", margin + 4, curY + 4.2);

  curY += 8;
  const sec2Height = 32;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cBoxBorder[0], cBoxBorder[1], cBoxBorder[2]);
  doc.roundedRect(margin, curY, contentWidth, sec2Height, 1.5, 1.5, "FD");

  let parsedSports = "";
  try {
    const s = JSON.parse(data.sportsInterests);
    parsedSports = Array.isArray(s) ? s.join(", ") : data.sportsInterests;
  } catch (e) {
    parsedSports = data.sportsInterests;
  }

  rY = curY + 6.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Sports Selected:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
  doc.text(parsedSports || "General Athletics", margin + 32, rY);

  rY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Jersey Size:", margin + 5, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(`${data.jerseySize || "M"} (Recorded for future tournaments & club events)`, margin + 32, rY);

  rY += 7.5;

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
  const sec3Height = 36;
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
  doc.setTextColor(226, 19, 110); // bKash Pink
  doc.text(data.transactionId || "N/A", margin + 32, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text("Amount Paid:", margin + 95, rY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(22, 163, 74); // green
  doc.text(`${data.paymentAmount || "200"} BDT`, margin + 120, rY);

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
  doc.text("Submission Date:", margin + 95, rY);

  const regDate = new Date(data.registeredAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(regDate, margin + 120, rY);

  // ================= 7. SIGNATURES =================
  curY += sec3Height + 14;

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

export function downloadAdminRosterPdf(members: AdminMemberRow[]) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(11, 23, 48);
  doc.roundedRect(margin, margin, contentWidth, 22, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PRIMEASIA UNIVERSITY GAMES & SPORTS CLUB (PaUGSC)", pageWidth / 2, margin + 8, { align: "center" });

  doc.setFontSize(9.5);
  doc.setTextColor(245, 158, 11);
  doc.text(
    `OFFICIAL GENERAL MEMBERS ROSTER · Total: ${members.length} Members · Generated: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}`,
    pageWidth / 2,
    margin + 16,
    { align: "center" }
  );

  const colX = [margin + 2, margin + 12, margin + 48, margin + 82, margin + 118, margin + 160, margin + 188, margin + 204, margin + 240];
  let y = margin + 30;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y - 5, contentWidth, 7, 1, 1, "F");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("#", colX[0], y);
  doc.text("Member ID", colX[1], y);
  doc.text("Full Name", colX[2], y);
  doc.text("Student ID", colX[3], y);
  doc.text("Department", colX[4], y);
  doc.text("Phone", colX[5], y);
  doc.text("Blood", colX[6], y);
  doc.text("bKash TrxID", colX[7], y);
  doc.text("Status", colX[8], y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  members.forEach((m, i) => {
    if (y > pageHeight - 15) {
      doc.addPage();
      y = margin + 15;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, contentWidth, 6, "F");
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(i + 1), colX[0], y);
    doc.text(m.membershipNumber, colX[1], y);
    doc.text((m.fullName || "").substring(0, 18), colX[2], y);
    doc.text(m.studentId, colX[3], y);
    doc.text((m.department || "").substring(0, 22), colX[4], y);
    doc.text(m.phone, colX[5], y);
    doc.text(m.bloodGroup || "N/A", colX[6], y);
    doc.text(m.transactionId, colX[7], y);

    if (m.paymentStatus === "verified") {
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
    } else if (m.paymentStatus === "rejected") {
      doc.setTextColor(220, 38, 38);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(217, 119, 6);
      doc.setFont("helvetica", "normal");
    }
    doc.text(m.paymentStatus.toUpperCase(), colX[8], y);
    doc.setFont("helvetica", "normal");

    y += 6;
  });

  doc.save(`PaUGSC_Members_Roster_${new Date().toISOString().slice(0, 10)}.pdf`);
}
