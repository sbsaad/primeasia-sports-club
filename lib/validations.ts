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
  department: z
    .string()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Department must be under 100 characters"),
  cgpa: z
    .string()
    .refine((val) => {
      const parsed = parseFloat(val);
      return !isNaN(parsed) && parsed >= 2.5 && parsed <= 4.0;
    }, "CGPA must be at least 2.5 (Minimum requirement is 2.5)"),
  experienceDetails: z
    .string()
    .min(5, "Please provide more details (minimum 5 characters)")
    .max(1000, "Experience details must be under 1000 characters"),
  whyAppropriate: z
    .string()
    .min(5, "Please provide more details (minimum 5 characters)")
    .max(1000, "Response must be under 1000 characters"),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
