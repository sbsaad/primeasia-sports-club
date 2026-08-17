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

  // Colors
  const navy = [10, 22, 40]; // #0a1628
  const gold = [201, 162, 39]; // #c9a227
  const goldLight = [232, 200, 78];
  const darkGray = [30, 41, 59];
  const lightBg = [248, 250, 252];
  const borderGray = [226, 232, 240];

  // Outer decorative border
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Top Header Banner
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(10, 10, pageWidth - 20, 36, "F");

  // Gold accent bar below banner
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(10, 46, pageWidth - 20, 2.5, "F");

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("PRIMEASIA UNIVERSITY", pageWidth / 2, 21, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.text("GAMES & SPORTS CLUB (PaUGSC)", pageWidth / 2, 29, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 215, 240);
  doc.text("OFFICIAL GENERAL MEMBER REGISTRATION SLIP · 2026", pageWidth / 2, 37, { align: "center" });

  // Membership ID Badge Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(15, 53, pageWidth - 30, 16, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`MEMBERSHIP ID: ${data.membershipNumber}`, 20, 63);

  const statusText = data.paymentStatus === "verified" ? "STATUS: VERIFIED MEMBER" : "STATUS: PAYMENT PENDING VERIFICATION";
  doc.setFontSize(9.5);
  if (data.paymentStatus === "verified") {
    doc.setTextColor(22, 163, 74); // green
  } else {
    doc.setTextColor(217, 119, 6); // amber
  }
  doc.text(statusText, pageWidth - 20, 63, { align: "right" });

  // Section 1: Member University Details
  let currentY = 77;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(15, currentY, pageWidth - 30, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1. STUDENT & UNIVERSITY PROFILE", 19, currentY + 5);

  currentY += 10;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(15, currentY, pageWidth - 30, 48, "FD");

  const leftColX = 20;
  const rightColX = pageWidth / 2 + 5;
  let rowY = currentY + 8;

  const renderField = (label: string, value: string, x: number, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${label}:`, x, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(value || "N/A", x + 38, y);
  };

  renderField("Full Name", data.fullName, leftColX, rowY);
  renderField("Student ID", data.studentId, rightColX, rowY);
  rowY += 9;

  renderField("Email", data.email, leftColX, rowY);
  renderField("Phone / WhatsApp", data.phone, rightColX, rowY);
  rowY += 9;

  renderField("Department", data.department, leftColX, rowY);
  renderField("Semester", `Semester ${data.semester}`, rightColX, rowY);
  rowY += 9;

  renderField("Gender", data.gender, leftColX, rowY);
  renderField("Blood Group", data.bloodGroup, rightColX, rowY);

  // Section 2: Sports & Apparel Preferences
  currentY += 56;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(15, currentY, pageWidth - 30, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("2. SPORTS PREFERENCES & CLUB APPAREL", 19, currentY + 5);

  currentY += 10;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setFillColor(255, 255, 255);
  doc.rect(15, currentY, pageWidth - 30, 32, "FD");

  let parsedSports = "";
  try {
    const s = JSON.parse(data.sportsInterests);
    parsedSports = Array.isArray(s) ? s.join(", ") : data.sportsInterests;
  } catch (e) {
    parsedSports = data.sportsInterests;
  }

  rowY = currentY + 8;
  renderField("Sports Interests", parsedSports, leftColX, rowY);
  rowY += 10;
  renderField("Jersey Size", `${data.jerseySize} (For future use / events)`, leftColX, rowY);
  rowY += 8;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 140);
  doc.text("* Note: Jersey size recorded for future sports tournaments. No jersey is being distributed currently.", leftColX, rowY);

  // Section 3: bKash Payment Details
  currentY += 40;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(15, currentY, pageWidth - 30, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("3. bKASH PAYMENT & VERIFICATION", 19, currentY + 5);

  currentY += 10;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(15, currentY, pageWidth - 30, 32, "FD");

  rowY = currentY + 8;
  renderField("Method", "bKash App (Education Fee -> Primeasia)", leftColX, rowY);
  renderField("Amount Paid", `${data.paymentAmount || "200"} BDT`, rightColX, rowY);
  rowY += 9;

  renderField("Transaction ID", data.transactionId, leftColX, rowY);
  renderField("Sender Number", data.bkashNumber || "Recorded via TrxID", rightColX, rowY);
  rowY += 9;

  const regDate = new Date(data.registeredAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
  renderField("Registered At", regDate, leftColX, rowY);

  // Verification Seal / Signatures Section
  currentY += 44;
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(20, currentY + 22, 75, currentY + 22);
  doc.line(pageWidth - 75, currentY + 22, pageWidth - 20, currentY + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("Student Signature", 32, currentY + 27);
  doc.text("Authorized Club Official", pageWidth - 65, currentY + 27);

  // Bottom Notice
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 150, 165);
  doc.text(
    "Primeasia University Games & Sports Club · Star Tower, 12 Kemal Ataturk Avenue, Banani, Dhaka-1213",
    pageWidth / 2,
    pageHeight - 14,
    { align: "center" }
  );

  const safeName = data.fullName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`PaUGSC_Membership_Slip_${safeName}_${data.studentId}.pdf`);
}

export function downloadAdminRosterPdf(members: AdminMemberRow[]) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(10, 22, 40);
  doc.rect(10, 8, pageWidth - 20, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PRIMEASIA UNIVERSITY GAMES & SPORTS CLUB", pageWidth / 2, 17, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(201, 162, 39);
  doc.text(`GENERAL MEMBERS ROSTER · Total: ${members.length} Members · Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth / 2, 25, { align: "center" });

  // Simple Table Rows
  let y = 38;
  const colX = [12, 22, 56, 88, 120, 154, 182, 212, 246, 274];

  doc.setFillColor(235, 240, 250);
  doc.rect(10, y - 5, pageWidth - 20, 7, "F");

  doc.setTextColor(10, 22, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("#", colX[0], y);
  doc.text("Member ID", colX[1], y);
  doc.text("Full Name", colX[2], y);
  doc.text("Student ID", colX[3], y);
  doc.text("Department", colX[4], y);
  doc.text("Phone", colX[5], y);
  doc.text("Blood", colX[6], y);
  doc.text("TrxID", colX[7], y);
  doc.text("Status", colX[8], y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  members.forEach((m, i) => {
    if (y > 190) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(i + 1), colX[0], y);
    doc.text(m.membershipNumber, colX[1], y);
    doc.text(m.fullName.substring(0, 20), colX[2], y);
    doc.text(m.studentId, colX[3], y);
    doc.text(m.department.substring(0, 18), colX[4], y);
    doc.text(m.phone, colX[5], y);
    doc.text(m.bloodGroup, colX[6], y);
    doc.text(m.transactionId, colX[7], y);
    doc.text(m.paymentStatus.toUpperCase(), colX[8], y);

    y += 6;
  });

  doc.save(`PaUGSC_Members_Roster_${new Date().toISOString().slice(0, 10)}.pdf`);
}
