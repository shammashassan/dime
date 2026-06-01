import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCookieCache, getSessionCookie } from "better-auth/cookies"

const PUBLIC_PATHS = [
  "/sign-in", "/sign-up", "/forgot-password",
  "/reset-password", "/verify-email", "/magic-link",
  "/pending-approval", "/api/auth",
]

export async function proxy(request: NextRequest) {
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

  const session = await getCookieCache(request)

  if (!session) {
    // Fallback: If cache is empty/expired, check if the session cookie itself exists
    const hasToken = getSessionCookie(request)
    if (!hasToken) {
      return NextResponse.redirect(new URL("/sign-in", request.url))
    }
    return NextResponse.next()
  }

  // Securely check if user is approved
  const user = session.user as any
  if (!user.approved && pathname !== "/pending-approval") {
    return NextResponse.redirect(new URL("/pending-approval", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|site\\.webmanifest|.*\\.png).*)"
  ],
}