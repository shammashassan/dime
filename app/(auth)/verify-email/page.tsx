import { VerifyEmailView } from "@/components/auth/verify-email-view"

export const metadata = {
  title: "Verify Email - Dime",
  description: "Verify your Dime account email address.",
}

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  return <VerifyEmailView token={token || ""} />
}
