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
  return CAPABILITIES[role].has(capability);
}

// Shorthand helpers
export const canViewTransactions = (role: Role): boolean => can(role, "view_transactions");
export const canCreateTransactions = (role: Role): boolean => can(role, "create_transactions");
export const canEditTransactions = (role: Role): boolean => can(role, "edit_transactions");
export const canDeleteTransactions = (role: Role): boolean => can(role, "delete_transactions");
export const canManageWallets = (role: Role): boolean => can(role, "manage_wallets");
export const canManageBudgets = (role: Role): boolean => can(role, "manage_budgets");
export const canInviteMembers = (role: Role): boolean => can(role, "invite_members");
export const canManageSpaceSettings = (role: Role): boolean => can(role, "manage_space_settings");
export const canDeleteSpace = (role: Role): boolean => can(role, "delete_space");
export const canTransferOwnership = (role: Role): boolean => can(role, "transfer_ownership");
export const canLeaveSpace = (role: Role): boolean => can(role, "leave_space");
