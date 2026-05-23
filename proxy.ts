import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
  "/sign-in", "/sign-up", "/forgot-password",
  "/reset-password", "/verify-email", "/magic-link",
  "/pending-approval", "/api/auth",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/", request.url))
  }
  const isPublic =

    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/site.webmanifest" ||
    pathname.endsWith(".png")

  if (isPublic) return NextResponse.next()

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token")

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|site\\.webmanifest|.*\\.png).*)"
  ],
}