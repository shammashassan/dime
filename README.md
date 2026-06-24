<p align="center">
  <img src="https://shieldcn.dev/header/glow.svg?title=Dime&subtitle=Personal%20Finance%20Tracker&theme=zinc&logo=wallet" alt="Dime Header Banner" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/shammashassan/dime/stargazers"><img src="https://shieldcn.dev/github/stars/shammashassan/dime.svg?variant=secondary" alt="GitHub Stars" /></a>
  <a href="https://github.com/shammashassan/dime/commits/master"><img src="https://shieldcn.dev/github/last-commit/shammashassan/dime.svg?variant=secondary" alt="Last Commit" /></a>
  <a href="https://github.com/shammashassan/dime/pulls"><img src="https://shieldcn.dev/github/open-prs/shammashassan/dime.svg?variant=secondary" alt="Open PRs" /></a>
  <a href="https://github.com/shammashassan/dime/blob/master/LICENSE"><img src="https://shieldcn.dev/github/license/shammashassan/dime.svg?variant=secondary" alt="License" /></a>
</p>

> ⚠️ Dime is currently under active development. Features and APIs may change between releases.

---

## 🚀 About Dime

Dime is a **production-ready, full-stack personal finance tracker** built to give users total control over their financial data. Each user gets a fully isolated workspace to manage wallets, transactions, categories, budgets, and recurring rules. 

Dime operates on an **invite-only approval flow**. New sign-ups enter a pending queue, and admins can approve, reject, or ban users from a built-in admin dashboard. It is designed to be self-hosted, private, and secure.

---

## ✨ Features

- 👛 **Multi-Currency Wallets**: Create and manage multiple accounts (bank, cash, credit card, savings, investment) with support for custom currencies and automatic cached exchange rate conversion.
- 💸 **Transaction Tracking**: Comprehensive CRUD with support for income, expenses, and wallet-to-wallet transfers. Features server-side pagination, advanced filtering (by category, wallet, tags, date), and CSV export.
- 🎯 **Smart Budgeting**: Establish budget targets by category with flexible periods (daily, weekly, monthly, yearly). Visual progress bars change color (green, amber, red) and alert users when thresholds are breached.
- 🔁 **Recurring Rules**: Automate repeating expenses and income. Run rules instantly or via a secure, cron-triggered endpoint (`/api/cron/process-recurring`).
- 📈 **Interactive Reports**: Analyze spending habits with visual area, bar, and pie charts driven by Server Component queries.
- 🛡️ **Advanced Authentication**: Fully integrated authentication powered by **Better Auth** supporting Email/Password, Usernames, Google OAuth, Magic Links, Passkeys (WebAuthn), and Two-Factor Authentication (TOTP, Email OTP, backup codes).
- 👥 **Admin Dashboard**: Manage user signups, approve pending accounts, ban users, demote/promote administrators, and impersonate sessions for debugging.

---

## 🛠️ Tech Stack

Dime is built with a premium, modern developer stack:

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with React 19 Server Components (RSC)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Native driver with optimized index schemas)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Forms**: React Hook Form + Zod
- **Email Delivery**: [Resend](https://resend.com) (falls back to console log in development)
- **Animations**: [GSAP](https://gsap.com/)

---

## 📈 Activity & Stars

![Star History Chart](https://shieldcn.dev/chart/github/stars/shammashassan/dime.svg?theme=zinc)

---

## ⚡ Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and a MongoDB instance running locally, or a MongoDB Atlas URI ready.

### 2. Environment Setup
Create a `.env` file in the root of the project and populate the following keys:

```env
# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# Better Auth Configuration
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Client App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost

# Resend API (For email verification, magic links, 2FA codes)
RESEND_API_KEY=your_resend_api_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cron Secret (For recurring transaction runner protection)
CRON_SECRET=your_cron_secret
```

### 3. Installation
Install dependencies and run the local development server:

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` or `⌘ + K` | Toggle Global Command Center (Search wallets, categories, features) |
| `Esc` | Close active dialog / popover |

---

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Dime • Built with ❤️ for personal finance and budgeting.</sub>
</p>
