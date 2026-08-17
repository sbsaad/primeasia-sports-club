// lib/export-excel.ts
import * as XLSX from "xlsx";
import type { AdminMemberRow } from "@/actions/admin";

export function exportMembersToExcel(members: AdminMemberRow[]) {
  const data = members.map((m, idx) => {
    let sportsText = "";
    try {
      const parsed = JSON.parse(m.sportsInterests);
      sportsText = Array.isArray(parsed) ? parsed.join(", ") : m.sportsInterests;
    } catch (e) {
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
