// lib/validations.ts
import { z } from "zod";

export const DEPARTMENTS = [
  "Computer Science & Engineering (CSE)",
  "Business Administration (BBA)",
  "Electrical & Electronic Engineering (EEE)",
  "Textile Engineering (TE)",
  "Pharmacy",
  "Law",
  "English",
  "Architecture",
  "Microbiology",
  "Biochemistry",
  "International Tourism & Hospitality Management (ITHM)",
  "Public Health (MPH)",
  "✍️ Other / Write Manually",
] as const;

export const SPORTS_OPTIONS = [
  { id: "football", name: "Football", icon: "⚽", category: "Outdoor" },
  { id: "cricket", name: "Cricket", icon: "🏏", category: "Outdoor" },
  { id: "badminton", name: "Badminton", icon: "🏸", category: "Racquet" },
  { id: "table_tennis", name: "Table Tennis", icon: "🏓", category: "Indoor" },
  { id: "chess", name: "Chess", icon: "♟️", category: "Board & Mind" },
  { id: "basketball", name: "Basketball", icon: "🏀", category: "Court" },
  { id: "volleyball", name: "Volleyball", icon: "🏐", category: "Court" },
  { id: "esports", name: "E-Sports / FIFA", icon: "🎮", category: "Digital" },
  { id: "athletics", name: "Athletics & Track", icon: "🏃", category: "Fitness" },
  { id: "carrom", name: "Carrom", icon: "🎯", category: "Indoor" },
] as const;

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
  "Unknown",
] as const;

export const JERSEY_SIZES = [
  { size: "S", label: "Small (36-38)" },
  { size: "M", label: "Medium (38-40)" },
  { size: "L", label: "Large (40-42)" },
  { size: "XL", label: "Extra Large (42-44)" },
  { size: "XXL", label: "Double Extra Large (44-46)" },
] as const;

export const DONATION_CATEGORIES = [
  "Tournament & Inter-University Fund",
  "Jersey & Sports Equipment",
  "Training, Practice & Coaching",
  "General Club Expansion",
] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;

export const memberRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be under 100 characters"),
  studentId: z
    .string()
    .min(8, "Student ID must be at least 8 or 9 digits")
    .max(20, "Student ID is too long")
    .regex(/^\d{3}/, "Student ID must start with 3 digits (e.g. 242...)"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[\d+\-\s()]+$/, "Enter a valid phone number"),
  department: z
    .string()
    .min(2, "Please select or type your department name"),
  gender: z.enum(GENDERS, {
    error: "Please select your gender",
  }),
  bloodGroup: z.enum(BLOOD_GROUPS, {
    error: "Please select your blood group",
  }),
  sportsInterests: z
    .array(z.string())
    .min(1, "Please select at least one sport you are interested in"),
  jerseySize: z.enum(["S", "M", "L", "XL", "XXL"], {
    error: "Please select your preferred jersey size",
  }),
  emergencyContact: z
    .string()
    .max(100, "Emergency contact info is too long")
    .optional()
    .default(""),
  bkashNumber: z
    .string()
    .max(15, "bKash number is too long")
    .optional()
    .default(""),
  transactionId: z
    .string()
    .min(6, "Transaction ID (TrxID) must be at least 6 characters")
    .max(30, "Transaction ID is too long")
    .regex(/^[a-zA-Z0-9]+$/, "Transaction ID should only contain letters and numbers (e.g. 9J83KL...)"),
  paymentSlipUrl: z
    .string()
    .optional()
    .default(""),
  isFlagged: z
    .boolean()
    .optional()
    .default(false),
  flaggedReason: z
    .string()
    .optional()
    .default(""),
  receiptStudentId: z
    .string()
    .optional()
    .default(""),
});

export type MemberRegistrationFormValues = z.input<typeof memberRegistrationSchema>;

// Legacy validation schema for existing routes
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
    .min(8, "Student ID must be at least 8 or 9 digits")
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
