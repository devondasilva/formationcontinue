import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");
  const isCoachRoute = req.nextUrl.pathname.startsWith("/coach");

  if (isAdminRoute && (!session || session.role !== "admin")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", "/admin");
    return NextResponse.redirect(loginUrl);
  }
  if (isDashboardRoute && (!session || session.role !== "learner")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(loginUrl);
  }
  if (isCoachRoute && (!session || session.role !== "coach")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", "/coach");
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/coach/:path*"],
};
