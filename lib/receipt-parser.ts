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

/**
 * Extracts structured receipt details from raw text (OCR or pasted SMS/Receipt)
 */
export function extractReceiptInfo(rawText: string): ParsedReceiptData {
  const clean = rawText.replace(/\r\n/g, "\n");
  const result: ParsedReceiptData = { rawText };

  // 1. Transaction ID
  // e.g. "Transaction ID: DHH0JTZHQO", "TrxID: 7KJFHS7", "TrxID 9J83KLMN45"
  const trxMatch =
    clean.match(/(?:Transaction\s*ID|TrxID|Txn\s*ID|Trans\s*ID)[\s:.\-_]+([A-Za-z0-9]{6,16})/i) ||
    clean.match(/\b([A-Z0-9]{8,12})\b/);
  if (trxMatch && trxMatch[1]) {
    const candidate = trxMatch[1].toUpperCase().trim();
    const banned = ["RECEIPT", "STUDENT", "PAYMENT", "PRIMEASIA", "UNIVERSITY", "EDUCATION", "OTHERS"];
    if (!banned.includes(candidate)) {
      result.transactionId = candidate;
    }
  }

  // 2. Student ID (explicit label or 9/8 digits starting with 2)
  const studentMatch =
    clean.match(/Student\s*ID[\s:.\-_]+(\d{8,12})/i) ||
    clean.match(/\b(2\d{7,8})\b/);
  if (studentMatch && studentMatch[1]) {
    result.studentId = studentMatch[1].trim();
  }

  // 3. Sender bKash Number (01XXXXXXXXX or bKash Account: 01...)
  const phoneMatch =
    clean.match(/bKash\s*Account[\s:.\-_]+(\d{10,13})/i) ||
    clean.match(/(?:01[3-9]\d{8})/);
  if (phoneMatch && phoneMatch[1]) {
    result.bkashNumber = phoneMatch[1].trim();
  } else if (phoneMatch && phoneMatch[0]) {
    result.bkashNumber = phoneMatch[0].trim();
  }

  // 4. Amount
  const amountMatch = clean.match(/(?:Tk|BDT|Amount|Fee)[\s:.]*([\d,.]+)/i);
  if (amountMatch && amountMatch[1]) {
    result.amount = amountMatch[1].replace(/,/g, "");
  }

  return result;
}

/**
 * Downscales and preprocesses image locally in canvas for instant OCR
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

        // Limit dimensions to 1000px max for speed
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;

        if (width > maxDim || height > maxDim) {
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
        ctx.drawImage(img, 0, 0, width, height);

        // Preprocess: Grayscale and slight contrast boost
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const avg = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
          d[i] = avg;
          d[i + 1] = avg;
          d[i + 2] = avg;
        }
        ctx.putImageData(imgData, 0, 0);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
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
    setTimeout(() => reject(new Error("OCR timeout (took longer than 8s)")), 8000)
  );

  const scanPromise = async (): Promise<ParsedReceiptData> => {
    onProgress?.("Optimizing image for fast scan...");
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
    console.warn("Client OCR encountered an issue, falling back to manual entry:", err);
    throw err;
  }
}
