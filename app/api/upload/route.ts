import { auth } from "@/lib/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// This endpoint generates a client token so the browser can
// upload directly to Vercel Blob CDN — bypassing the server timeout.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname: string) => {
        // Only allow PDF uploads up to 5MB
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          tokenPayload: JSON.stringify({ email: session.user!.email }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Blob upload completed:", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
