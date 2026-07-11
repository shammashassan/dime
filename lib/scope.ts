import { cache } from "react";
import { requireApprovedUser } from "@/lib/auth-guard";
import { FinancialScope } from "@/types/scope";

export const getFinancialScope = cache(async (): Promise<FinancialScope> => {
  const session = await requireApprovedUser();
  const activeOrgId = (session.session as { activeOrganizationId?: string | null }).activeOrganizationId || null;

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
    userId: scope.userId,
    $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
  };
}

