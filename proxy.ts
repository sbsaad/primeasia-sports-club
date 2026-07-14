// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthed = !!session?.user?.email;
  const isAdmin = isAuthed &&
    ADMIN_EMAILS.includes(session!.user!.email!.toLowerCase());

  // Protect /upload and /dashboard
  if (
    (pathname.startsWith("/upload") || pathname.startsWith("/dashboard")) &&
    !isAuthed
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protect /admin — must be authenticated AND in admin list
  if (pathname.startsWith("/admin")) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/upload/:path*", "/dashboard/:path*", "/admin/:path*"],
};
