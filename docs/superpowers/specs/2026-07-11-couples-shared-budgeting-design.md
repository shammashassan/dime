# Dime Design Spec — Couples & Shared Budgeting (Spaces)

This document specifies the architecture and implementation design for introducing **Spaces** (Couples & Shared Budgeting) to Dime, powered by Better Auth Organizations and MongoDB.

---

## 1. Architectural Overview & Financial Scope

To support collaboration without sacrificing individual privacy, Dime will transition from direct user-scoping to a unified **Financial Scope** abstraction. All queries, analytics, dashboards, reports, exports, forecasting, and search features are **mandated** to use this abstraction.

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

All collaborative collections (e.g., `wallets`, `transactions`, `budgets`, `recurring_rules`, `goals`, and future modules) will be structured with these mandatory fields. 

**Every mutation** (insert, update, delete/soft-delete) is required to populate these audit fields and **increment the version field by 1**.

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
  version: number;                 // Optimistic concurrency control / audit version (incremented by 1 on every update)
}
```

---

## 3. Better Auth Integration

Better Auth will remain the single source of truth for organizations, memberships, invitations, and active organization state.

### Server Config & Server-Side Slug Validation (`lib/auth.ts`)

To ensure security and consistency, organization slugs are **generated and validated on the server** rather than the client.

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/db/client";

export const auth = betterAuth({
  // ... existing configs ...
  plugins: [
    // ... other plugins ...
    organization({
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      organizationHooks: {
        beforeCreateOrganization: async ({ organization, user }) => {
          // Generate unique slug server-side
          const baseSlug = organization.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          let slug = baseSlug;
          let counter = 1;
          
          // Loop until a unique slug is resolved
          while (true) {
            const existing = await db.collection("organization").findOne({ slug });
            if (!existing) break;
            slug = `${baseSlug}-${counter++}`;
          }

          return {
            data: {
              ...organization,
              slug,
            },
          };
        },
      },
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

Note that visual parameters (e.g. `theme`) are excluded here as they are strictly client-side user preferences.

```typescript
export type SpaceType = "family" | "couple" | "business" | "travel" | "roommates" | "other";

interface OrganizationSettings {
  _id: ObjectId;
  organizationId: string;        // Foreign key to Better Auth organization
  baseCurrency: string;          // Primary default currency (ISO 4217, e.g. "USD", "INR")
  locale: string;                // Regional formatting locale (e.g. "en-US", "en-IN")
  fiscalYearStartMonth: number;  // 1-12 (e.g. 4 for April)
  spaceType: SpaceType;          // Lowercase enum value representing space purpose
  updatedBy: string;
  updatedAt: Date;
}
```

---

## 6. User Experience & Flows

### Space Switcher Component
Located at the top of the app sidebar:
* **Displays**: The active space name (e.g., "Personal" or "Hassan Household") with a matching icon/avatar.
* **Slug Generation**: Handled completely server-side inside hooks during organization creation. Slugs are not typed by users.
* **Space Creation Form**: Includes a dropdown selector for the **Space Type** (Couple, Family, Business, Travel, Roommates, Other) which is normalized and saved as a lowercase string in `organization_settings`.
* **Manage Spaces**: A dedicated menu entry to view, join, edit, or leave active memberships.

### Cache Invalidation & Switching State
Space switching must immediately refresh relevant states:
1. Update active organization: `await authClient.organization.setActive({ organizationId })`
2. **`revalidateTag()` is the primary cache invalidation mechanism** used on the server to instantly refresh scope data and invalidate active queries.
3. **UX Transition**: We prefer showing inline **loading overlays or skeleton states** directly over components during the switch transition rather than blocking the user with a disruptive fullscreen spinner.

### Members list & Invitation screen
* **Members list** displays: Avatar, Display Name, Email, Role, Joined Date, and last active status. Prior to member removal, require confirmation.
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
* **Loans & Repayments** will be treated as dedicated `loans` and `loan_repayments` collections (not simple transaction tags) to avoid modeling issues.
* Reporting and forecasting aggregates will compute totals by passing `getScopeFilter(scope)` to MongoDB pipelines.
* A centralized **Activity Feed** can be added by listening to mutations in server actions and recording events under `activityId` keyed by `organizationId`.

