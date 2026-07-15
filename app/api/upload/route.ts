import { auth } from "@/lib/auth";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Returns a short-lived, single-use client token so the browser can
 * PUT the PDF file directly to Vercel Blob CDN — no file goes through
 * the server, no Vercel function timeout, real linear upload progress.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pathname } = await request.json() as { pathname: string };
  if (!pathname || typeof pathname !== "string") {
    return NextResponse.json({ error: "pathname required" }, { status: 400 });
  }

  const clientToken = await generateClientTokenFromReadWriteToken({
    pathname,
    maximumSizeInBytes: 5 * 1024 * 1024, // 5 MB
    allowedContentTypes: ["application/pdf"],
    validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return NextResponse.json({ clientToken });
}
