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
          "/dashboard",
          "/transactions",
          "/wallets",
          "/budgets",
          "/goals",
          "/recurring",
          "/reports",
          "/categories",
          "/settings",
          "/admin",
          "/loans",
          "/net-worth",
          "/contacts",
          "/notifications",
          "/planner",
          "/shared-expenses",
          "/health",
          "/investments",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
