// lib/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
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
  bkashNumber: text("bkash_number").notNull().default(""), // Sender bKash number (optional/recorded)
  transactionId: text("transaction_id").notNull(), // bKash TrxID from Education Fee payment
  paymentAmount: text("payment_amount").notNull().default("200"), // Default 200 BDT
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | verified | rejected
  adminNotes: text("admin_notes").notNull().default(""),
  deviceInfo: text("device_info").notNull().default("{}"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const usersRelations = relations(users, ({ many, one }) => ({
  memberRegistrations: many(memberRegistrations),
  cvSubmissions: many(cvSubmissions),
}));

export const memberRegistrationsRelations = relations(memberRegistrations, ({ one }) => ({
  user: one(users, {
    fields: [memberRegistrations.userId],
    references: [users.id],
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
export type CvSubmission = typeof cvSubmissions.$inferSelect;
export type NewCvSubmission = typeof cvSubmissions.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

