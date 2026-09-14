import { TwoFactorForm } from "@/components/auth/two-factor-form"

export const metadata = {
  title: "Two-Factor Verification",
  description: "Provide your secondary authentication code to continue.",
}

export default function TwoFactorPage() {
  return <TwoFactorForm />
}
