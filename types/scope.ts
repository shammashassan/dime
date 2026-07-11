export type ScopeType = "personal" | "organization";

export interface FinancialScope {
  type: ScopeType;
  userId: string;
  organizationId: string | null;
  isPersonal: boolean;
  isOrganization: boolean;
}
