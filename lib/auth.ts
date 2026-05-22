import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { nextCookies } from "better-auth/next-js"
import { username } from "better-auth/plugins/username"
import { magicLink } from "better-auth/plugins/magic-link"
import { twoFactor } from "better-auth/plugins/two-factor"
import { admin } from "better-auth/plugins/admin"
import { passkey } from "@better-auth/passkey"
import { ac, roles } from "@/lib/access"
import { db } from "@/lib/db/client"
import { sendEmail } from "@/lib/email"
import { initDatabase } from "@/lib/db/indexes"
import { APIError } from "better-auth/api"


// Run database indexing and seeding in the background
void initDatabase()

export const auth = betterAuth({
  appName: "Dime",
  database: mongodbAdapter(db),
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 256,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 30,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({ to: user.email, subject: "Reset your Dime password", html: `<a href="${url}">Reset Password</a>` })
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, subject: "Verify your Dime email", html: `<a href="${url}">Verify Email</a>` })
    },
    sendOnSignUp: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-client-secret",
    },
  },

  user: {
    additionalFields: {
      approved: { type: "boolean", defaultValue: false, required: false },
    },
    deleteUser: { enabled: true },
    changeEmail: { enabled: true },
  },

  plugins: [
    username(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({ to: email, subject: "Your Dime sign-in link", html: `<a href="${url}">Sign in to Dime</a>` })
      },
    }),
    twoFactor({
      issuer: "Dime",
      totpOptions: { digits: 6, period: 30 },
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          await sendEmail({ to: user.email, subject: "Your Dime verification code", html: `<p>Your code: <strong>${otp}</strong></p>` })
        },
        period: 5,
        allowedAttempts: 5,
        storeOTP: "encrypted",
      },
      backupCodeOptions: { amount: 10, length: 10, storeBackupCodes: "encrypted" },
      twoFactorCookieMaxAge: 600,
      trustDeviceMaxAge: 30 * 24 * 60 * 60,
    }),
    passkey({
      rpID: process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost",
      rpName: "Dime",
      origin: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    }),
    admin({ defaultRole: "user", adminRoles: ["admin"], impersonationSessionDuration: 60 * 60, ac, roles }),
    nextCookies(),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              approved: false,
            },
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await db.collection("user").findOne({ id: session.userId })
          if (user && !user.approved) {
            throw new APIError("UNAUTHORIZED", {
              message: "PENDING_APPROVAL",
            })
          }
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5, strategy: "jwe" },
  },

  account: { accountLinking: { enabled: true }, encryptOAuthTokens: true },

  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/api/auth/sign-in/email": { window: 60, max: 5 },
      "/api/auth/sign-up/email": { window: 60, max: 3 },
      "/api/auth/magic-link/send": { window: 60, max: 3 },
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"], disableIpTracking: false },
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
})

export type Session = typeof auth.$Infer.Session
