import { auth } from "@/lib/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname: string) => {
        // This function runs on the client's initial request.
        // It has access to the user's session cookies.
        const session = await auth();
        if (!session?.user?.email) {
          throw new Error("Unauthorized: Please sign in to upload your CV.");
        }

        // Dynamically resolve the callback URL to the current request host.
        // This handles cases where Vercel's system variables point to older/disabled domains.
        const requestUrl = new URL(request.url);
        const callbackUrl = `${requestUrl.protocol}//${requestUrl.host}/api/upload`;

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5 MB
          tokenPayload: JSON.stringify({ email: session.user.email }),
          callbackUrl,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is a webhook callback triggered by Vercel's servers.
        // It does NOT have the user's session cookies, which is why we don't check auth here.
        console.log("Blob upload completed successfully:", blob.url, tokenPayload);
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
