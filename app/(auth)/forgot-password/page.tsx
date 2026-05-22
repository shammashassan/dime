import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata = {
  title: "Forgot Password - Dime",
  description: "Request a password reset link for your Dime account.",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
