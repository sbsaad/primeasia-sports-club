// lib/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleId: text("google_id").unique().notNull(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberRegistrations = pgTable("member_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  membershipNumber: text("membership_number").unique().notNull(), // e.g. PAUSC-2026-0001
  fullName: text("full_name").notNull(),
  studentId: text("student_id").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  department: text("department").notNull(),
  semester: integer("semester").notNull(),
  gender: text("gender").notNull().default("Male"), // Male | Female | Other
  bloodGroup: text("blood_group").notNull().default("Unknown"),
  sportsInterests: text("sports_interests").notNull().default("[]"), // JSON string array of sports
  jerseySize: text("jersey_size").notNull().default("M"), // S | M | L | XL | XXL (For later use)
  emergencyContact: text("emergency_contact").notNull().default(""),
  bkashNumber: text("bkash_number").notNull().default(""), // Sender bKash number
  transactionId: text("transaction_id").notNull(), // bKash TrxID
  paymentSlipUrl: text("payment_slip_url").notNull().default(""), // Vercel Blob URL
  paymentAmount: text("payment_amount").notNull().default("200"), // Default 200 BDT
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | verified | rejected | expired | pending_renewal
  isFlagged: boolean("is_flagged").notNull().default(false), // True if ID mismatch or fraud suspected
  flaggedReason: text("flagged_reason").notNull().default(""),
  receiptStudentId: text("receipt_student_id").notNull().default(""),
  validUntil: timestamp("valid_until"), // Expiration date of active membership
  renewalCount: integer("renewal_count").notNull().default(0),
  renewalHistory: text("renewal_history").notNull().default("[]"), // JSON log: [{ renewalDate, trxId, amount, verifiedAt, validUntil }]
  adminNotes: text("admin_notes").notNull().default(""),
  deviceInfo: text("device_info").notNull().default("{}"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  memberRegistrationId: uuid("member_registration_id").references(() => memberRegistrations.id, { onDelete: "set null" }),
  donorName: text("donor_name").notNull(),
  donorStudentId: text("donor_student_id").notNull(),
  donorEmail: text("donor_email").notNull(),
  donorPhone: text("donor_phone").notNull(),
  category: text("category").notNull().default("General Club Expansion"), // "Tournament & Event Fund" | "Jersey & Sports Gear" | "Training & Equipment" | "General Club Expansion"
  amount: text("amount").notNull(), // e.g. "500", "1000", "2000"
  transactionId: text("transaction_id").notNull(),
  paymentSlipUrl: text("payment_slip_url").notNull().default(""),
  donorNote: text("donor_note").notNull().default(""),
  status: text("status").notNull().default("pending"), // "pending" | "verified" | "rejected"
  adminNotes: text("admin_notes").notNull().default(""),
  donatedAt: timestamp("donated_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
});

// Legacy table preserved for historical CV data
export const cvSubmissions = pgTable("cv_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  fullName: text("full_name").notNull(),
  studentId: text("student_id").notNull(),
  phone: text("phone").notNull(),
  position: text("position").notNull(),
  semester: integer("semester").notNull(),
  department: text("department").notNull().default(""),
  cgpa: text("cgpa").notNull().default(""),
  experienceDetails: text("experience_details").notNull().default(""),
  whyAppropriate: text("why_appropriate").notNull().default(""),
  deviceInfo: text("device_info").notNull().default(""),
  blobUrl: text("blob_url").notNull(),
  filename: text("filename").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  memberRegistrations: many(memberRegistrations),
  donations: many(donations),
  cvSubmissions: many(cvSubmissions),
}));

export const memberRegistrationsRelations = relations(memberRegistrations, ({ one, many }) => ({
  user: one(users, {
    fields: [memberRegistrations.userId],
    references: [users.id],
  }),
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  user: one(users, {
    fields: [donations.userId],
    references: [users.id],
  }),
  memberRegistration: one(memberRegistrations, {
    fields: [donations.memberRegistrationId],
    references: [memberRegistrations.id],
  }),
}));

export const cvSubmissionsRelations = relations(cvSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [cvSubmissions.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MemberRegistration = typeof memberRegistrations.$inferSelect;
export type NewMemberRegistration = typeof memberRegistrations.$inferInsert;
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
export type CvSubmission = typeof cvSubmissions.$inferSelect;
export type NewCvSubmission = typeof cvSubmissions.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
