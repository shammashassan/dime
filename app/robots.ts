import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dime-tracker.vercel.app"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/2fa",
          "/pending-approval",
          "/accept-invitation",
          "/admin",
          "/budgets",
          "/calendar",
          "/categories",
          "/coach",
          "/contacts",
          "/dashboard",
          "/goals",
          "/health",
          "/insights",
          "/investments",
          "/loans",
          "/net-worth",
          "/notifications",
          "/planner",
          "/recurring",
          "/reports",
          "/search",
          "/settings",
          "/shared-expenses",
          "/timeline",
          "/transactions",
          "/wallets",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
