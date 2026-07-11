# Couples & Shared Budgeting (Spaces) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement collaborative spaces (Couples & Shared Budgeting) in Dime using Better Auth Organizations, a unified Financial Scope abstraction, server-side slug validation, and a centralized permission system.

**Architecture:** We introduce a `FinancialScope` abstraction that scopes queries and mutations to either a personal context or an organization. Preferences specific to organizations are stored in an `organization_settings` collection. Cache invalidation is handled via `revalidateTag()`, and the UI switches context using skeleton loading overlays.

**Tech Stack:** Next.js 16 (App Router), Better Auth, MongoDB (Native Driver), shadcn/ui.

---

### Task 1: Financial Scope Abstraction

**Files:**
* Create: [types/scope.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/types/scope.ts)
* Create: [lib/scope.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/scope.ts)

- [ ] **Step 1: Create the scope types**
  Create the file `types/scope.ts` with the following contents:
  ```typescript
  export type ScopeType = "personal" | "organization";

  export interface FinancialScope {
    type: ScopeType;
    userId: string;
    organizationId: string | null;
    isPersonal: boolean;
    isOrganization: boolean;
  }
  ```

- [ ] **Step 2: Implement the scope helper functions**
  Create `lib/scope.ts` with the scope resolver and filter builder:
  ```typescript
  import { cache } from "react";
  import { requireApprovedUser } from "@/lib/auth-guard";
  import { FinancialScope } from "@/types/scope";

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

  export function getScopeFilter(scope: FinancialScope) {
    if (scope.isOrganization) {
      return { organizationId: scope.organizationId };
    }
    return {
      ownerUserId: scope.userId,
      $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
    };
  }
  ```

- [ ] **Step 3: Create a validation scratch script**
  Create a scratch file `scratch/validate-scope.ts` to test type resolving:
  ```typescript
  import { getScopeFilter } from "../lib/scope";
  import { FinancialScope } from "../types/scope";

  const mockPersonalScope: FinancialScope = {
    type: "personal",
    userId: "user_123",
    organizationId: null,
    isPersonal: true,
    isOrganization: false,
  };

  const mockOrgScope: FinancialScope = {
    type: "organization",
    userId: "user_123",
    organizationId: "org_abc",
    isPersonal: false,
    isOrganization: true,
  };

  console.log("Personal Filter:", JSON.stringify(getScopeFilter(mockPersonalScope)));
  console.log("Org Filter:", JSON.stringify(getScopeFilter(mockOrgScope)));
  ```

- [ ] **Step 4: Run validation script**
  Run: `npx ts-node scratch/validate-scope.ts`
  Expected Output: Shows the correct database filter objects for personal (with `ownerUserId` and `$or`) and organization scopes.

- [ ] **Step 5: Commit**
  ```bash
  git add types/scope.ts lib/scope.ts
  git commit -m "feat: add unified financial scope model and helper"
  ```

---

### Task 2: Centralized Capability Authorization

**Files:**
* Create: [lib/permissions.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/permissions.ts)

- [ ] **Step 1: Implement the capabilities and permission checker**
  Create `lib/permissions.ts` with immutable capability sets:
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
  ```

- [ ] **Step 2: Create a permission validation script**
  Create a scratch file `scratch/validate-permissions.ts`:
  ```typescript
  import { can, Role, Capability } from "../lib/permissions";

  const checks: { role: Role; cap: Capability; expected: boolean }[] = [
    { role: "owner", cap: "delete_space", expected: true },
    { role: "member", cap: "delete_space", expected: false },
    { role: "viewer", cap: "create_transactions", expected: false },
    { role: "admin", cap: "invite_members", expected: true },
  ];

  checks.forEach(({ role, cap, expected }) => {
    const actual = can(role, cap);
    console.log(`Role [${role}] can [${cap}]? Got: ${actual}, Expected: ${expected}`);
    if (actual !== expected) throw new Error("Permission check mismatch!");
  });
  console.log("All permission checks verified successfully.");
  ```

- [ ] **Step 3: Run permission validation script**
  Run: `npx ts-node scratch/validate-permissions.ts`
  Expected Output: "All permission checks verified successfully."

- [ ] **Step 4: Commit**
  ```bash
  git add lib/permissions.ts
  git commit -m "feat: implement centralized capability permissions engine"
  ```

---

### Task 3: Better Auth Integration & Server-Side Slug Hooks

**Files:**
* Modify: [lib/auth.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/auth.ts)
* Modify: [lib/auth-client.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/auth-client.ts)

- [ ] **Step 1: Integrate Organization plugin with Server-side hook**
  Modify `lib/auth.ts` to register the organization plugin with a server-side unique slug generator:
  ```typescript
  // Import organization plugin at the top:
  import { organization } from "better-auth/plugins"
  import { db } from "@/lib/db/client"

  // Inside betterAuth plugins array:
  plugins: [
    username(),
    magicLink({ ... }),
    twoFactor({ ... }),
    passkey({ ... }),
    admin({ ... }),
    organization({
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7,
      organizationHooks: {
        beforeCreateOrganization: async ({ organization }) => {
          const baseSlug = organization.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          let slug = baseSlug;
          let counter = 1;
          
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
    nextCookies(),
  ]
  ```

- [ ] **Step 2: Register Organization plugin on the Client Client**
  Modify `lib/auth-client.ts` to add the organization plugin:
  ```typescript
  // Import at top:
  import { organizationClient } from "better-auth/client/plugins"

  // Inside createAuthClient plugins:
  plugins: [
    usernameClient(),
    magicLinkClient(),
    twoFactorClient({ ... }),
    passkeyClient(),
    adminClient({ ... }),
    organizationClient(),
  ]
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add lib/auth.ts lib/auth-client.ts
  git commit -m "feat: configure Better Auth Organization plugin with server slug validation"
  ```

---

### Task 4: Organization Settings Schema & Database Helpers

**Files:**
* Create: [lib/actions/organization.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/actions/organization.ts)
* Create: [lib/queries/organization.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/queries/organization.ts)

- [ ] **Step 1: Implement Organization Settings actions**
  Create `lib/actions/organization.ts` to manage settings mutations:
  ```typescript
  "use server";

  import { db } from "@/lib/db/client";
  import { getFinancialScope } from "@/lib/scope";
  import { revalidateTag } from "next/cache";

  export async function updateOrganizationSettings(data: {
    baseCurrency: string;
    locale: string;
    fiscalYearStartMonth: number;
    spaceType: "family" | "couple" | "business" | "travel" | "roommates" | "other";
  }) {
    const scope = await getFinancialScope();
    if (!scope.isOrganization) throw new Error("Not inside an organization space");

    const settingsColl = db.collection("organization_settings");
    const now = new Date();

    const result = await settingsColl.findOneAndUpdate(
      { organizationId: scope.organizationId },
      {
        $set: {
          ...data,
          updatedBy: scope.userId,
          updatedAt: now,
        },
        $setOnInsert: {
          organizationId: scope.organizationId,
        },
        $inc: { version: 1 }
      },
      { upsert: true, returnDocument: "after" }
    );

    revalidateTag(`org-settings-${scope.organizationId}`);
    return { success: true, settings: result };
  }
  ```

- [ ] **Step 2: Implement settings queries**
  Create `lib/queries/organization.ts`:
  ```typescript
  import { db } from "@/lib/db/client";
  import { cache } from "react";

  export const getOrganizationSettings = cache(async (orgId: string) => {
    return db.collection("organization_settings").findOne({ organizationId: orgId });
  });
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add lib/actions/organization.ts lib/queries/organization.ts
  git commit -m "feat: implement organization settings schemas, queries, and actions"
  ```

---

### Task 5: Scoping Database Queries

**Files:**
* Modify: [lib/queries/wallets.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/queries/wallets.ts)
* Modify: [lib/queries/transactions.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/queries/transactions.ts)
* Modify: [lib/queries/budgets.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/queries/budgets.ts)

- [ ] **Step 1: Scope wallet queries**
  Update `lib/queries/wallets.ts` to resolve `getFinancialScope` and `getScopeFilter`:
  ```typescript
  import { getFinancialScope, getScopeFilter } from "@/lib/scope";
  // ... inside query functions ...
  const scope = await getFinancialScope();
  const filter = getScopeFilter(scope);
  const wallets = await db.collection("wallets").find({ ...filter, isArchived: false }).toArray();
  ```

- [ ] **Step 2: Scope transaction queries**
  Update `lib/queries/transactions.ts`:
  ```typescript
  import { getFinancialScope, getScopeFilter } from "@/lib/scope";
  // ... inside query functions ...
  const scope = await getFinancialScope();
  const filter = getScopeFilter(scope);
  // append filter to transaction find operations
  ```

- [ ] **Step 3: Scope budget queries**
  Update `lib/queries/budgets.ts`:
  ```typescript
  import { getFinancialScope, getScopeFilter } from "@/lib/scope";
  // ... inside budget lookups ...
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add lib/queries/wallets.ts lib/queries/transactions.ts lib/queries/budgets.ts
  git commit -m "refactor: enforce Financial Scope on wallets, transactions, and budgets queries"
  ```

---

### Task 6: Scoping Actions & Mutations with Version Increments

**Files:**
* Modify: [lib/actions/wallets.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/actions/wallets.ts)
* Modify: [lib/actions/transactions.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/actions/transactions.ts)

- [ ] **Step 1: Refactor Wallet creation and update actions**
  Modify actions in `lib/actions/wallets.ts` to assign scope parameters and increment version:
  ```typescript
  import { getFinancialScope } from "@/lib/scope";

  // Inside createWallet:
  const scope = await getFinancialScope();
  const newWallet = {
    ...data,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    organizationId: scope.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };
  await db.collection("wallets").insertOne(newWallet);
  ```

- [ ] **Step 2: Refactor Transaction actions**
  Modify actions in `lib/actions/transactions.ts` to include metadata:
  ```typescript
  import { getFinancialScope } from "@/lib/scope";
  
  // Inside createTransaction:
  const scope = await getFinancialScope();
  // Ensure organizationId and audit properties are saved
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add lib/actions/wallets.ts lib/actions/transactions.ts
  git commit -m "refactor: include audit metadata and version increments in mutations"
  ```

---

### Task 7: Space Switcher UI Component

**Files:**
* Create: [components/layout/space-switcher.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/layout/space-switcher.tsx)
* Modify: [components/layout/app-sidebar.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/layout/app-sidebar.tsx)

- [ ] **Step 1: Implement Space Switcher dropdown**
  Create `components/layout/space-switcher.tsx` using shadcn components to toggle spaces and open "Create Space" dialog:
  ```typescript
  "use client"

  import * as React from "react"
  import { authClient } from "@/lib/auth-client"
  import { useRouter } from "next/navigation"
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
  import { Button } from "@/components/ui/button"

  export function SpaceSwitcher() {
    const { data: session } = authClient.useSession()
    const { data: orgs = [] } = authClient.useListOrganizations()
    const router = useRouter()
    const [isPending, startTransition] = React.useTransition()

    const handleSwitch = async (orgId: string | null) => {
      startTransition(async () => {
        await authClient.organization.setActive({ organizationId: orgId })
        router.refresh()
      })
    }

    const currentSpaceName = session?.session.activeOrganizationId
      ? orgs.find(o => o.id === session.session.activeOrganizationId)?.name || "Organization Space"
      : "Personal"

    return (
      <div className="relative">
        {isPending && <div className="absolute inset-0 bg-background/50 pointer-events-none rounded animate-pulse" />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{currentSpaceName}</span>
              <span className="text-xs text-muted-foreground">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Financial Spaces</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleSwitch(null)}>
              Personal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem key={org.id} onClick={() => handleSwitch(org.id)}>
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
  ```

- [ ] **Step 2: Add Switcher to Sidebar**
  Integrate `SpaceSwitcher` into the top header section of `components/layout/app-sidebar.tsx`.

- [ ] **Step 3: Commit**
  ```bash
  git add components/layout/space-switcher.tsx components/layout/app-sidebar.tsx
  git commit -m "feat: implement Space Switcher component and embed it into the App Sidebar"
  ```

---

### Task 8: Space Settings & Danger Zone Settings

**Files:**
* Create: [components/settings/space-settings.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/settings/space-settings.tsx)
* Modify: [app/\(dashboard\)/settings/page.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/app/%28dashboard%29/settings/page.tsx)

- [ ] **Step 1: Create Space Settings Tab view**
  Create `components/settings/space-settings.tsx` with Member management, Invitations, and a Danger Zone containing Leave Space, Transfer Ownership, and Delete Space actions.

- [ ] **Step 2: Embed Space tab in Settings page**
  Modify `/settings` page tabs to render Space Settings when active scope is `"organization"`.

- [ ] **Step 3: Commit**
  ```bash
  git add components/settings/space-settings.tsx app/\(dashboard\)/settings/page.tsx
  git commit -m "feat: build Space Settings UI with general config, member lists, and danger zone"
  ```

---

### Task 9: Rich Invitation Acceptance Page

**Files:**
* Create: [app/\(auth\)/accept-invitation/page.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/app/%28auth%29/accept-invitation/page.tsx)

- [ ] **Step 1: Create accept invitation page view**
  Create `app/(auth)/accept-invitation/page.tsx` that fetches the invitation using `id` searchParam and presents a rich card showing the Org name, Inviter, and buttons to Accept or Reject. Ensure unauthenticated users are redirected back post-sign-in.

- [ ] **Step 2: Commit**
  ```bash
  git add app/\(auth\)/accept-invitation/page.tsx
  git commit -m "feat: implement rich accept invitation page with auth redirects"
  ```

---

### Task 10: Invalidation & Transition States

**Files:**
* Modify: [components/layout/space-switcher.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/layout/space-switcher.tsx)

- [ ] **Step 1: Add cache invalidation tags to switcher**
  Update the switch handler in `components/layout/space-switcher.tsx` to invoke a server action that calls `revalidateTag` on scope collections before reloading.

- [ ] **Step 2: Commit**
  ```bash
  git add components/layout/space-switcher.tsx
  git commit -m "feat: add revalidateTag cache invalidations on space switcher updates"
  ```
