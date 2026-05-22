import { createAccessControl } from "better-auth/plugins/access"

export const ac = createAccessControl({
  user: [
    "create", "list", "get", "update",
    "set-role", "ban", "impersonate", "delete",
    "set-password", "approve", "reject",
  ],
  session: ["list", "revoke"],
})

export const roles = {
  admin: ac.newRole({
    user: [
      "create", "list", "get", "update",
      "set-role", "ban", "impersonate", "delete",
      "set-password", "approve", "reject",
    ],
    session: ["list", "revoke"],
  }),
  user: ac.newRole({
    user: [],
    session: [],
  }),
}
