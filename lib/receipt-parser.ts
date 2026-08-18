// lib/receipt-parser.ts
import { createWorker, type Worker } from "tesseract.js";

export interface ParsedReceiptData {
  transactionId?: string;
  studentId?: string;
  bkashNumber?: string;
  amount?: string;
  paymentDate?: string;
  rawText: string;
}

const BANNED_WORDS = new Set([
  "SUCCESSFUL", "SUCCESS", "COMPLETED", "PAYMENT", "PRIMEASIA", "UNIVERSITY", "EDUCATION",
  "OTHERS", "RECEIPT", "STUDENT", "STATEMENT", "REFERENCE", "ACCOUNT", "ACCOUNTS",
  "MERCHANT", "COLLECTION", "TELECOM", "CONFIRMATION", "APPLICATION", "DEPARTMENT",
  "SUBMISSION", "MEMBERSHIP", "BANGLADESH", "MINUTES", "YESTERDAY", "TODAY", "TOMORROW",
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER",
  "OCTOBER", "NOVEMBER", "DECEMBER", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY",
  "SATURDAY", "SUNDAY", "CHARGES", "AMOUNT", "BALANCE", "TOTAL", "COUNTER", "CUSTOMER",
  "WELCOME", "NOTIFICATION", "BATTERY", "PERCENT", "AVAILABLE", "DETAILS", "CHARGE",
  "NUMBER", "MONEY", "TRANSFER", "REQUEST", "APPROVED", "VERIFIED", "REJECTED", "PENDING",
  "INVOICE", "VOUCHER", "BILLER", "BILLING", "COMMISSION", "DISCOUNT", "OPERATOR",
  "STATION", "REGISTRATION", "PASSWORD", "SETTINGS", "UNAVAILABLE", "NETWORK", "ONLINE",
  "INTERNET", "MOBILE", "HOTSPOT", "BLUETOOTH", "LOCATION", "SERVICES", "SECURITY",
  "VERSION", "TERMS", "POLICY", "SYSTEM", "STATUS", "DOWNLOAD", "UPLOAD", "GENERAL",
  "ACADEMIC", "SEMESTER", "GAMES", "SPORTS", "CLUB", "PAUGSC", "PAUSC"
]);

function cleanTrxToken(token: string): string {
  return token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "").toUpperCase().trim();
}

function isValidTrxCandidate(token: string): boolean {
  if (!token || token.length < 7 || token.length > 15) return false;
  const upper = token.toUpperCase();
  if (BANNED_WORDS.has(upper)) return false;

  const hasDigit = /\d/.test(upper);
  const hasLetter = /[A-Z]/.test(upper);

  // If pure digits, ensure it's not a Student ID, phone number, or date
  if (!hasLetter) {
    if (upper.length === 9 && upper.startsWith("2")) return false; // 9-digit Student ID
    if (upper.length === 11 && upper.startsWith("01")) return false; // BD Phone number
    if (upper.length === 8 && (upper.startsWith("202") || upper.startsWith("201"))) return false; // Date
    if (upper.length < 8) return false;
  }

  // Pure words without digits are almost certainly UI/English text
  if (!hasDigit) {
    return false;
  }

  return true;
}

function scoreTrxCandidate(candidate: string, source: "explicit_label" | "near_label" | "sms" | "fallback"): number {
  let score = 0;
  if (source === "explicit_label") score += 100;
  if (source === "near_label") score += 75;
  if (source === "sms") score += 90;
  if (source === "fallback") score += 10;

  // Standard bKash TrxID is exactly 10 characters alphanumeric
  if (candidate.length === 10) score += 40;
  else if (candidate.length >= 8 && candidate.length <= 12) score += 20;

  // Contains both letters and digits (classic bKash format e.g. DHH0JTZHQO, BL75B10K54)
  const hasLetters = /[A-Z]/.test(candidate);
  const hasDigits = /\d/.test(candidate);
  if (hasLetters && hasDigits) {
    score += 35;
    const letterCount = (candidate.match(/[A-Z]/g) || []).length;
    const digitCount = (candidate.match(/\d/g) || []).length;
    if (letterCount >= 2 && digitCount >= 2) score += 15;
  }

  return score;
}

/**
 * Extracts structured receipt details from raw text (OCR or pasted SMS/Receipt)
 */
export function extractReceiptInfo(rawText: string): ParsedReceiptData {
  const clean = rawText.replace(/\r\n/g, "\n");
  const result: ParsedReceiptData = { rawText };

  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  const candidates: { token: string; score: number }[] = [];

  // 1. Explicit Label Regex Matching (Multi-line and same-line, English & Bengali)
  const labelPatterns = [
    /(?:Transaction\s*(?:ID|No|Num|Number)?|Trx\s*(?:ID|No)?|Txn\s*(?:ID|No)?|Trans\s*(?:ID|No)?|Payment\s*ID|লেনদেন\s*(?:আইডি|নং)|ট্রানজেকশন\s*(?:আইডি|নং)|ট্রানজ্যাকশন\s*(?:আইডি|নং)|ট্যাক্স\s*আইডি)[\s:.\-_#|~=]*\n?[\s:.\-_#|~=]*([A-Za-z0-9]{7,15})/gi,
    /\bTrxID\s*[:.\-_]?\s*([A-Za-z0-9]{7,15})\b/gi,
    /\b(?:Trx|Txn)\s*ID\s*[:.\-_]?\s*([A-Za-z0-9]{7,15})\b/gi,
  ];

  for (const pat of labelPatterns) {
    let match;
    while ((match = pat.exec(clean)) !== null) {
      if (match[1]) {
        const cleaned = cleanTrxToken(match[1]);
        if (isValidTrxCandidate(cleaned)) {
          candidates.push({
            token: cleaned,
            score: scoreTrxCandidate(cleaned, "explicit_label"),
          });
        }
      }
    }
  }

  // 2. Line-by-line Proximity Analysis (handles OCR newlines & copy icon artifacts)
  const labelKeywordRegex = /(?:transaction|trx|txn|trans\b|transact|লেনদেন|ট্রানজেকশন|ট্রানজ্যাকশন)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (labelKeywordRegex.test(line)) {
      // Check current line tokens
      const wordsOnLine = line.split(/[\s:.\-_#|~=,]+/);
      for (const w of wordsOnLine) {
        const cleaned = cleanTrxToken(w);
        if (isValidTrxCandidate(cleaned) && !labelKeywordRegex.test(cleaned)) {
          candidates.push({
            token: cleaned,
            score: scoreTrxCandidate(cleaned, "near_label"),
          });
        }
      }

      // Check next 2 lines
      for (let j = 1; j <= 2 && i + j < lines.length; j++) {
        const nextLineWords = lines[i + j].split(/[\s:.\-_#|~=,]+/);
        for (const w of nextLineWords) {
          const cleaned = cleanTrxToken(w);
          if (isValidTrxCandidate(cleaned) && !labelKeywordRegex.test(cleaned)) {
            candidates.push({
              token: cleaned,
              score: scoreTrxCandidate(cleaned, "near_label"),
            });
          }
        }
      }
    }
  }

  // 3. Fallback: Global Alphanumeric Token Scanning with strict filtering
  const allTokens = clean.match(/\b([A-Za-z0-9]{8,12})\b/g) || [];
  for (const token of allTokens) {
    const cleaned = cleanTrxToken(token);
    if (isValidTrxCandidate(cleaned)) {
      candidates.push({
        token: cleaned,
        score: scoreTrxCandidate(cleaned, "fallback"),
      });
    }
  }

  // Select candidate with highest confidence score
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    result.transactionId = candidates[0].token;
  }

  // 4. Student ID Extraction
  // Priority A: Explicit Student ID or Reference label
  const sidPatterns = [
    /(?:Student\s*(?:ID|No|Number)?|StudentID|Roll\s*No|Reference|Ref\b|শিক্ষার্থী\s*আইডি|রোল\s*নং|রেফারেন্স)[\s:.\-_#|~=]*\n?[\s:.\-_#|~=]*(\d{8,12})/i,
    /\bRef\s*[:.\-_]?\s*(\d{8,12})\b/i,
  ];

  for (const pat of sidPatterns) {
    const m = clean.match(pat);
    if (m && m[1]) {
      result.studentId = m[1].trim();
      break;
    }
  }

  // Priority B: Primeasia 9-digit Student ID starting with 2 (e.g. 242003032)
  if (!result.studentId) {
    const sidFallback = clean.match(/\b(2\d{8})\b/);
    if (sidFallback && sidFallback[1]) {
      result.studentId = sidFallback[1].trim();
    }
  }

  // Priority C: 8-digit Student ID starting with 2
  if (!result.studentId) {
    const sid8 = clean.match(/\b(2\d{7})\b/);
    if (sid8 && sid8[1]) {
      result.studentId = sid8[1].trim();
    }
  }

  // 5. Sender bKash Phone Number (01[3-9]XXXXXXXX)
  const phonePatterns = [
    /(?:bKash\s*Account|Sender|From|Phone|Mobile|অ্যাকাউন্ট)[\s:.\-_#|~=]*\n?[\s:.\-_#|~=]*(01[3-9]\d{8})/i,
    /\b(01[3-9]\d{8})\b/,
  ];

  for (const pat of phonePatterns) {
    const m = clean.match(pat);
    if (m && m[1]) {
      result.bkashNumber = m[1].trim();
      break;
    }
  }

  // 6. Amount Extraction
  const amountPatterns = [
    /(?:Amount|Fee|Tk|BDT|টাকা|পরিমাণ)[\s:.\-_#|~=]*\n?[\s:.\-_#|~=]*([\d,.]+)/i,
    /([\d,.]+)\s*(?:Tk|BDT|৳)/i,
  ];

  for (const pat of amountPatterns) {
    const m = clean.match(pat);
    if (m && m[1]) {
      const amtStr = m[1].replace(/,/g, "").trim();
      const num = parseFloat(amtStr);
      if (!isNaN(num) && num > 0 && num < 100000) {
        result.amount = amtStr;
        break;
      }
    }
  }

  return result;
}

/**
 * Preprocesses mobile image locally in canvas with resolution preservation and contrast boost
 */
async function getOptimizedImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(img.src);
          return;
        }

        let width = img.width;
        let height = img.height;

        // Ensure mobile screenshots retain sufficient resolution for crisp OCR text
        // If image is small (< 900px wide), upscale 1.5x for sharper character recognition
        if (width < 900 && height < 1600) {
          width = Math.round(width * 1.5);
          height = Math.round(height * 1.5);
        } else if (width > 1600 || height > 2600) {
          // If ultra high-res (e.g. 12MP camera photo), downscale smoothly
          const maxDim = 1800;
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Preprocess: Green-weighted Grayscale + High Contrast Stretch
        // bKash uses #E2136E (magenta/pink) which has high Red & low Green/Blue.
        // Weighting Green heavily turns pink text dark and contrast enhancement makes text sharp.
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const d = imgData.data;
          const contrast = 35; // Contrast boost factor (-255 to 255)
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

          for (let i = 0; i < d.length; i += 4) {
            // Green-weighted luminance for high bKash pink & dark text separation
            const gray = (d[i] * 0.15 + d[i + 1] * 0.70 + d[i + 2] * 0.15);
            // Apply contrast curve
            const boosted = Math.min(255, Math.max(0, Math.round(factor * (gray - 128) + 128)));

            d[i] = boosted;
            d[i + 1] = boosted;
            d[i + 2] = boosted;
          }
          ctx.putImageData(imgData, 0, 0);
        } catch {
          // If canvas security or getImageData fails, fallback to standard image
        }

        resolve(canvas.toDataURL("image/jpeg", 0.90));
      };
      img.onerror = () => reject(new Error("Failed to load receipt image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Fast client-side OCR scan with timeout protection (no server upload)
 */
export async function parseReceiptImage(
  imageFile: File,
  onProgress?: (status: string) => void
): Promise<ParsedReceiptData> {
  let workerInstance: Worker | null = null;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("OCR scan took longer than 15s")), 15000)
  );

  const scanPromise = async (): Promise<ParsedReceiptData> => {
    onProgress?.("Optimizing image for high-precision scan...");
    const optimizedSrc = await getOptimizedImage(imageFile);

    onProgress?.("Reading text in browser...");
    workerInstance = await createWorker("eng");
    const ret = await workerInstance.recognize(optimizedSrc);
    const text = ret.data.text || "";
    await workerInstance.terminate();
    workerInstance = null;

    return extractReceiptInfo(text);
  };

  try {
    const result = await Promise.race([scanPromise(), timeoutPromise]);
    onProgress?.("Scan complete!");
    return result;
  } catch (err: unknown) {
    if (workerInstance) {
      try {
        const w: Worker = workerInstance;
        await w.terminate();
      } catch {
        // Ignore termination error
      }
    }
    console.warn("Client OCR notice, falling back to manual entry:", err);
    throw err;
  }
}

export const parsePaymentReceipt = parseReceiptImage;
