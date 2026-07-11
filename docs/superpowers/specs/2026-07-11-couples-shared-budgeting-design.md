# Dime Design Spec — Couples & Shared Budgeting (Spaces)

This document specifies the architecture and implementation design for introducing **Spaces** (Couples & Shared Budgeting) to Dime, powered by Better Auth Organizations and MongoDB.

---

## 1. Architectural Overview & Financial Scope

To support collaboration without sacrificing individual privacy, Dime will transition from direct user-scoping to a unified **Financial Scope** abstraction. All queries, analytics, dashboards, reports, and future modules will query the current active scope rather than branching manually.

### The Scope Model (`types/scope.ts`)

```typescript
export type ScopeType = "personal" | "organization";

export interface FinancialScope {
  type: ScopeType;
  userId: string;                   // Authenticated user's ID
  organizationId: string | null;     // Active organization ID (null for Personal context)
  isPersonal: boolean;
  isOrganization: boolean;
}
```

### Scope Resolver & Query Filter (`lib/scope.ts`)

```typescript
import { cache } from "react";
import { requireApprovedUser } from "@/lib/auth-guard";

/**
 * Resolves and caches the current active FinancialScope for the request lifecycle.
 * Deduplicates sessions across RSCs, actions, and layouts.
 */
export const getFinancialScope = cache(async (): Promise<FinancialScope> => {
  const session = await requireApprovedUser();
  const activeOrgId = session.session.activeOrganizationId || null;

  return {
    type: activeOrgId ? "organization" : "personal",
    userId: session.user.id,
    organizationId: activeOrgId,
    isPersonal: !activeOrgId,
    isOrganization: !!activeOrgId,
  };
});

/**
 * Returns the MongoDB query filter matching the active scope.
 */
export function getScopeFilter(scope: FinancialScope) {
  if (scope.isOrganization) {
    return { organizationId: scope.organizationId };
  }
  // Personal scope: match user's ID and ensure the resource has no organization association
  return {
    ownerUserId: scope.userId,
    $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
  };
}
```

---

## 2. Shared Collaborative Database Models

All collaborative collections (e.g., `wallets`, `transactions`, `budgets`, `recurring_rules`, `goals`, and future modules) will be structured with these mandatory fields:

```typescript
interface CollaborativeMetadata {
  ownerUserId: string;             // Creator / primary owner
  createdBy: string;               // Audit: created by user ID
  updatedBy: string;               // Audit: last updated by user ID
  deletedBy?: string | null;       // Audit: deleted by user ID
  organizationId: string | null;   // Active organization ID (null if personal)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;         // For future soft delete support
  activityId?: string | null;      // Future integration with activity feed
  version: number;                 // Optimistic concurrency control / audit version
}
```

---

## 3. Better Auth Integration

Better Auth will remain the single source of truth for organizations, memberships, invitations, and active organization state.

### Server Config (`lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  // ... existing configs ...
  plugins: [
    // ... other plugins ...
    organization({
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
    }),
  ],
});
```

### Client Config (`lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [
    // ... other plugins ...
    organizationClient(),
  ],
});
```

---

## 4. Centralized Capability Authorization (`lib/permissions.ts`)

To avoid scattering role string checks throughout the codebase, capabilities are stored in immutable collections mapped to roles.

```typescript
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

/**
 * Checks if a specific role possesses a capability.
 */
export function can(role: Role, capability: Capability): boolean {
  return CAPABILITIES[role]?.has(capability) ?? false;
}

// Convenience helpers
export const canViewTransactions = (role: Role) => can(role, "view_transactions");
export const canCreateTransactions = (role: Role) => can(role, "create_transactions");
export const canManageWallets = (role: Role) => can(role, "manage_wallets");
export const canManageBudgets = (role: Role) => can(role, "manage_budgets");
export const canInviteMembers = (role: Role) => can(role, "invite_members");
export const canManageSpaceSettings = (role: Role) => can(role, "manage_space_settings");
export const canDeleteSpace = (role: Role) => can(role, "delete_space");
export const canTransferOwnership = (role: Role) => can(role, "transfer_ownership");
```

---

## 5. Organization Settings Schema

To keep Better Auth's core tables minimal and high-performing, application-specific workspace preferences will be stored in a separate MongoDB collection named `organization_settings`.

```typescript
interface OrganizationSettings {
  _id: ObjectId;
  organizationId: string;        // Foreign key to Better Auth organization
  currency: string;             // ISO 4217 code (e.g. "USD", "INR")
  timezone: string;             // e.g. "UTC", "Asia/Kolkata"
  theme: "light" | "dark" | "system";
  spaceType: "Family" | "Couple" | "Business" | "Travel" | "Roommates" | "Other";
  updatedBy: string;
  updatedAt: Date;
}
```

---

## 6. User Experience & Flows

### Space Switcher Component
Located at the top of the app sidebar:
* **Displays**: The active space name (e.g., "Personal" or "Hassan Household") with a matching icon/avatar.
* **Slug Generation**: When creating an organization, the slug is automatically generated client-side from the input name using standard URL-friendly formatting (e.g. `"Acme Corp"` -> `"acme-corp"`), with slug availability check via `authClient.organization.checkSlug`.
* **Space Creation Form**: Includes a dropdown selector for the **Space Type** (Couple, Family, Business, Travel, Roommates, Other) which is stored in the `organization_settings` record.
* **Manage Spaces**: A dedicated menu entry to view and configure memberships.

### Cache Invalidation & Switching State
Switching spaces must immediately clear stale data and synchronize:
1. Update active organization: `await authClient.organization.setActive({ organizationId })`
2. Clear Next.js router cache: `router.refresh()`
3. Invalidate query tags/paths on the server via a dedicated action to avoid layout waterfalls.
4. Render a fullscreen spinner or skeleton loader overlay during switching to ensure user does not see visual flashes of incorrect data.

### Members list & Invitation screen
* **Members list** displays: Avatar, Display Name, Email, Role, Joined Date, and last active status. Prompt for user confirmation prior to member removal.
* **Rich Invitation Page (`/accept-invitation?id=...`)**:
  * Resolves and displays Organization Name, Inviter Name, Invited Role, and Organization Logo.
  * Prompts unauthenticated invitees to sign in first, preserving the invite ID in parameters to redirect them back post-authentication.

### Danger Zone Settings
Destructive features are grouped inside a red-bordered "Danger Zone" block on the settings screen:
* **Leave Space**: Available to admins, members, and viewers.
* **Transfer Ownership**: Available only to owners. Triggers a selection dialog of active members.
* **Delete Space**: Available only to owners. Prompts for textual name verification before dropping the workspace configurations.

---

## 7. Future-Proofing Extensibility

Because the scoping uses `getFinancialScope()`, the architecture naturally isolates collaborative state. When introducing features like **Shared Wallets, Shared Goals, Shared Budgets, and Loans**:
* No DB schema rewrites will be required. These collections automatically inherit the standard collaborative fields.
* Reporting and forecasting aggregates will compute totals by passing `getScopeFilter(scope)` to MongoDB pipelines.
* A centralized **Activity Feed** can be added by listening to mutations in server actions and recording events under `activityId` keyed by `organizationId`.
