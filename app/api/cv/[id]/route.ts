// app/api/cv/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSubmissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { get } from "@vercel/blob";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  // Fetch the submission
  const submissions = await db
    .select({
      id: cvSubmissions.id,
      blobUrl: cvSubmissions.blobUrl,
      filename: cvSubmissions.filename,
      userId: cvSubmissions.userId,
    })
    .from(cvSubmissions)
    .where(eq(cvSubmissions.id, id))
    .limit(1);

  if (submissions.length === 0) {
    return new NextResponse("Submission not found", { status: 404 });
  }

  const submission = submissions[0];

  // Check permissions: Must be an admin OR the owner of the CV
  const isAdmin = ADMIN_EMAILS.includes(email);
  if (!isAdmin) {
    // Check owner
    const dbUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const currentUser = dbUsers[0];
    if (!currentUser || currentUser.id !== submission.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  try {
    // Fetch the private blob using Vercel Blob SDK
    const result = await get(submission.blobUrl, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!result) {
      return new NextResponse("File not found in storage", { status: 404 });
    }

    const { stream, blob } = result;

    return new NextResponse(stream, {
      headers: {
        "Content-Type": blob.contentType || "application/pdf",
        "Content-Disposition": `inline; filename="${submission.filename}"`,
      },
    });
  } catch (err) {
    console.error("Failed to fetch private blob:", err);
    return new NextResponse("Failed to retrieve file", { status: 500 });
  }
}
