import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: "Dime <noreply@dime.finance>",
        to,
        subject,
        html,
      })
      if (error) {
        console.error("Resend error sending email:", error)
      } else {
        console.log("Email sent successfully via Resend:", data)
      }
    } catch (err) {
      console.error("Failed to send email with Resend, falling back to console:", err)
      console.log(`[EMAIL SEND FALLBACK] To: ${to}\nSubject: ${subject}\nHTML: ${html}`)
    }
  } else {
    console.log(`[EMAIL SEND LOG] To: ${to}\nSubject: ${subject}\nHTML: ${html}`)
  }
}
