export type Role = "owner" | "admin" | "member" | "viewer";

export type Capability =
  | "view_transactions"
  | "create_transactions"
  | "edit_transactions"
  | "delete_transactions"
  | "manage_wallets"
  | "manage_budgets"
  | "invite_members"
  | "manage_space_settings"
  | "transfer_ownership"
  | "leave_space"
  | "delete_space";

const CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
  owner: new Set<Capability>([
    "view_transactions", "create_transactions", "edit_transactions", "delete_transactions",
    "manage_wallets", "manage_budgets", "invite_members", "manage_space_settings",
    "transfer_ownership", "leave_space", "delete_space"
  ]),
  admin: new Set<Capability>([
    "view_transactions", "create_transactions", "edit_transactions", "delete_transactions",
    "manage_wallets", "manage_budgets", "invite_members", "manage_space_settings",
    "leave_space"
  ]),
  member: new Set<Capability>([
    "view_transactions", "create_transactions", "edit_transactions", "delete_transactions",
    "leave_space"
  ]),
  viewer: new Set<Capability>([
    "view_transactions", "leave_space"
  ]),
};

export function can(role: Role, capability: Capability): boolean {
  return CAPABILITIES[role]?.has(capability) ?? false;
}

export const canViewTransactions = (role: Role) => can(role, "view_transactions");
export const canCreateTransactions = (role: Role) => can(role, "create_transactions");
export const canManageWallets = (role: Role) => can(role, "manage_wallets");
export const canManageBudgets = (role: Role) => can(role, "manage_budgets");
export const canInviteMembers = (role: Role) => can(role, "invite_members");
export const canManageSpaceSettings = (role: Role) => can(role, "manage_space_settings");
export const canDeleteSpace = (role: Role) => can(role, "delete_space");
export const canTransferOwnership = (role: Role) => can(role, "transfer_ownership");
