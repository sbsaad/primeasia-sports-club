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

export const cvSubmissions = pgTable("cv_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  fullName: text("full_name").notNull(),
  studentId: text("student_id").notNull(),
  phone: text("phone").notNull(),
  position: text("position").notNull(), // President | Vice President | General Secretary | Treasurer
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
  cvSubmissions: many(cvSubmissions),
}));

export const cvSubmissionsRelations = relations(cvSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [cvSubmissions.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CvSubmission = typeof cvSubmissions.$inferSelect;
export type NewCvSubmission = typeof cvSubmissions.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
