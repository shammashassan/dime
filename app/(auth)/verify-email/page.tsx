import { Suspense } from "react"
import { VerifyEmailView } from "@/components/auth/verify-email-view"
import VerifyEmailLoading from "./loading"

export const metadata = {
  title: "Verify Email",
  description: "Verify your Dime account email address.",
}

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

async function VerifyEmailContent({ searchParams }: PageProps) {
  const { token } = await searchParams
  return <VerifyEmailView token={token || ""} />
}

export default function VerifyEmailPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent searchParams={searchParams} />
    </Suspense>
  )
}
