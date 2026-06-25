import { NextRequest, NextResponse } from "next/server"
import { getCookieCache, getSessionCookie } from "better-auth/cookies"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Safety fallback check matching the clean static bypass rules from the volt app
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Catches all files with extensions (.ico, .xml, .png, etc.)

  if (isStaticAsset) {
    return NextResponse.next()
  }

  let session = null
  try {
    session = await getCookieCache(request)
  } catch (error) {
    // Catch invalid base64 or other malformed cookie errors to prevent app crash
    console.error("Failed to read cookie cache in proxy:", error)
  }

  const isPublicPath =
    pathname === "/" ||
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email" ||
    pathname === "/magic-link" ||
    pathname === "/pending-approval" ||
    pathname === "/privacy" ||
    pathname === "/terms"

  if (!session) {
    // Fallback check: if the cookie cache is empty/expired, check if the session cookie itself exists
    const sessionCookie = getSessionCookie(request)

    if (sessionCookie) {
      // Allow the request to proceed. The Server Components / Page will validate it
      // and automatically rebuild/refresh the client's cookie cache.
      return NextResponse.next()
    }

    if (isPublicPath) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  // Session exists, handle redirects
  const user = session.user as { approved?: boolean; role?: string }
  const approved = user.approved
  const role = user.role

  if (!approved) {
    if (pathname !== "/pending-approval" && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/pending-approval", request.url))
    }
    return NextResponse.next()
  }

  // Approved user
  if (pathname === "/" || pathname === "/pending-approval" || pathname === "/sign-in" || pathname === "/sign-up") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Ultra-clean lookahead regex pattern optimization to match the volt app
  matcher: [
    "/((?!api(?:/|$)|_next/static|_next/image|.*\\..*).*)",
  ],
}