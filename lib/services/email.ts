import { Resend } from "resend"
import nodemailer from "nodemailer"

// SMTP Configuration (e.g. Gmail SMTP)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD
const isSmtpConfigured = Boolean(smtpUser && smtpPass)

const smtpTransporter = isSmtpConfigured
  ? nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || "gmail",
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== "false",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null

// Resend Configuration
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  // 1. Prioritize Google SMTP if credentials are configured
  if (smtpTransporter && smtpUser) {
    const fromAddress = process.env.EMAIL_FROM || `Dime <${smtpUser}>`
    try {
      const info = await smtpTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
      })
      console.log(`[Google SMTP Success] Email delivered to ${to} (MessageId: ${info.messageId})`)
      return { success: true, id: info.messageId }
    } catch (err) {
      console.error("[Google SMTP Error] Failed to send email:", err)
      console.log(`\n--- Fallback Email Log ---\nTo: ${to}\nSubject: ${subject}\nHTML: ${html}\n-------------------------\n`)
      return { success: false, error: err }
    }
  }

  // 2. Fall back to Resend if RESEND_API_KEY is configured
  if (resend) {
    const defaultFrom = process.env.EMAIL_FROM || "Dime <onboarding@resend.dev>"
    try {
      const { data, error } = await resend.emails.send({
        from: defaultFrom,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
      })
      if (error) {
        console.error("[Resend Error] Failed to send email:", error)
        console.log(`\n--- Fallback Email Log ---\nTo: ${to}\nSubject: ${subject}\nHTML: ${html}\n-------------------------\n`)
        return { success: false, error }
      }
      console.log(`[Resend Success] Email delivered to ${to} (ID: ${data?.id})`)
      return { success: true, id: data?.id }
    } catch (err) {
      console.error("[Resend Exception] Error sending email:", err)
      console.log(`\n--- Fallback Email Log ---\nTo: ${to}\nSubject: ${subject}\nHTML: ${html}\n-------------------------\n`)
      return { success: false, error: err }
    }
  }

  // 3. Dev fallback if neither is configured
  console.log(
    `\n================= [DEV EMAIL LOG - NO EMAIL PROVIDER CONFIGURED] =================\n` +
    `To: ${to}\n` +
    `Subject: ${subject}\n` +
    `HTML:\n${html}\n` +
    `\nℹ️ Note: Set SMTP_USER & SMTP_PASS in .env for Google SMTP, or RESEND_API_KEY for Resend.\n` +
    `===================================================================================\n`
  )
  return { success: true, id: "dev-log" }
}
