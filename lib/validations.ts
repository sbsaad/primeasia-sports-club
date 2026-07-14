// lib/validations.ts
import { z } from "zod";

export const POSITIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
] as const;

export type Position = (typeof POSITIONS)[number];

export const studentFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be under 100 characters"),
  studentId: z
    .string()
    .min(8, "Student ID must be at least 8 characters")
    .max(20, "Student ID is too long")
    .regex(/^\d{3}/, "Student ID must start with 3 digits (e.g. 242...)"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[\d+\-\s()]+$/, "Enter a valid phone number"),
  position: z.enum(POSITIONS, {
    error: "Please select a position",
  }),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
