/**
 * HTML Email Templates for Dime
 */

export function getPasswordResetEmailHtml(resetUrl: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hello,"

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0d0e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ededed;
    }
    .wrapper {
      width: 100%;
      background-color: #0c0d0e;
      padding: 40px 16px;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background-color: #16171a;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #10b981;
      margin-bottom: 24px;
      display: inline-block;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 15px;
      line-height: 24px;
      color: #a1a1aa;
      margin: 0 0 20px;
    }
    .btn-container {
      margin: 28px 0;
      text-align: left;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 10px;
    }
    .footer {
      font-size: 12px;
      line-height: 18px;
      color: #71717a;
      margin-top: 32px;
      border-top: 1px solid #27272a;
      padding-top: 20px;
    }
    .link-fallback {
      font-size: 13px;
      word-break: break-all;
      color: #10b981;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">Dime</div>
      <h1>Reset your password</h1>
      <p>${greeting}</p>
      <p>We received a request to reset the password for your Dime account. Click the button below to choose a new password:</p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>

      <p style="font-size: 13px; color: #71717a;">
        This link is valid for <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
      </p>

      <div class="footer">
        <p style="margin: 0 0 8px;">If the button above does not work, paste this URL into your browser:</p>
        <a href="${resetUrl}" class="link-fallback">${resetUrl}</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}
