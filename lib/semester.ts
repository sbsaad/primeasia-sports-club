// lib/semester.ts
// Semester calculation utility
// Current term is hardcoded to Summer 2026 (code: 262)
// ID format: XYZXXXXXXX where X=year (2 digits), Y=term (1 digit), Z...=rest
// Terms: 1=Spring, 2=Summer, 3=Fall

export type SemesterResult = {
  semester: number;
  admitYear: number;
  admitTerm: number;
  admitTermName: string;
  isPriority: boolean;    // semester 7–12
  isIrregular: boolean;   // semester > 12
  isValid: boolean;
  error?: string;
};

const TERM_NAMES: Record<number, string> = {
  1: "Spring",
  2: "Summer",
  3: "Fall",
};

// Current term: Summer 2026
const CURRENT_YEAR = 26; // last 2 digits of 2026
const CURRENT_TERM = 2;  // Summer

export function calculateSemester(studentId: string): SemesterResult {
  if (!studentId || studentId.length < 3) {
    return {
      semester: 0,
      admitYear: 0,
      admitTerm: 0,
      admitTermName: "",
      isPriority: false,
      isIrregular: false,
      isValid: false,
      error: "Student ID must be at least 3 characters.",
    };
  }

  const prefix = studentId.slice(0, 3);
  const yearStr = prefix.slice(0, 2);
  const termStr = prefix.slice(2, 3);

  const admitYear = parseInt(yearStr, 10);
  const admitTerm = parseInt(termStr, 10);

  if (isNaN(admitYear) || isNaN(admitTerm) || admitTerm < 1 || admitTerm > 3) {
    return {
      semester: 0,
      admitYear: 0,
      admitTerm: 0,
      admitTermName: "",
      isPriority: false,
      isIrregular: false,
      isValid: false,
      error: "Invalid Student ID format. First 3 digits must be YYTTTT (e.g. 242...).",
    };
  }

  // Semester = (yearDiff * 3) + (termDiff) + 1
  const yearDiff = CURRENT_YEAR - admitYear;
  const termDiff = CURRENT_TERM - admitTerm;
  const semester = yearDiff * 3 + termDiff + 1;

  if (semester < 1) {
    return {
      semester,
      admitYear,
      admitTerm,
      admitTermName: TERM_NAMES[admitTerm] ?? "Unknown",
      isPriority: false,
      isIrregular: false,
      isValid: false,
      error: "Student ID indicates a future admission date. Please check your ID.",
    };
  }

  return {
    semester,
    admitYear: 2000 + admitYear,
    admitTerm,
    admitTermName: TERM_NAMES[admitTerm] ?? "Unknown",
    isPriority: semester >= 7 && semester <= 12,
    isIrregular: semester > 12,
    isValid: true,
  };
}

export function getSemesterLabel(semester: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = semester % 100;
  const suffix =
    suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return `${semester}${suffix} Semester`;
}
