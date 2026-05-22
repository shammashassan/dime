import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"
import { magicLinkClient } from "better-auth/client/plugins"
import { twoFactorClient } from "better-auth/client/plugins"
import { adminClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"
import { ac, roles } from "@/lib/access"

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    magicLinkClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/2fa"
      }
    }),
    passkeyClient(),
    adminClient({ ac, roles }),
  ],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
