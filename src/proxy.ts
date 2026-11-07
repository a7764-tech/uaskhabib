import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { developmentSessionCookieName } from "@/lib/auth-cookie";
const authProxy = withAuth(
  req => {
    const role = req.nextauth.token?.role, p = req.nextUrl.pathname;
    if (p.startsWith("/admin") && role !== "PETUGAS") return NextResponse.redirect(new URL("/", req.url));
    if (p.startsWith("/dashboard") && role !== "PENYEWA") return NextResponse.redirect(new URL("/admin", req.url));
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    ...(process.env.NODE_ENV === "development" && {
      cookies: { sessionToken: { name: developmentSessionCookieName } },
    }),
    callbacks: { authorized: ({ token }) => !!token },
  }
);
export default authProxy;
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
