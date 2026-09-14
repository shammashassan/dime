import { ObjectId } from "mongodb"

export type SearchEntityType =
  | "transaction"
  | "wallet"
  | "budget"
  | "goal"
  | "loan"
  | "contact"
  | "recurring"
  | "investment"
  | "asset"
  | "liability"
  | "page"

export interface SearchOperators {
  merchant?: string
  category?: string
  wallet?: string
  minAmount?: number // in integer cents
  maxAmount?: number // in integer cents
  exactAmount?: number // in integer cents
  currency?: string
  tag?: string
  person?: string
  type?: "income" | "expense" | "transfer"
  status?: string
  startDate?: Date
  endDate?: Date
  entityTypes?: SearchEntityType[]
  isSplit?: boolean
  frequency?: string
  kind?: "subscription" | "bill" | "recurring"
  assetClass?: string
}

export interface ActiveFilterBadge {
  key: string
  label: string
  value: string
}

export interface ParsedSearchQuery {
  rawQuery: string
  textQuery: string
  operators: SearchOperators
  activeBadges: ActiveFilterBadge[]
}

export interface SearchResultItem {
  id: string
  entityType: SearchEntityType
  title: string
  subtitle?: string
  amount?: number // lowest currency units (cents/paise)
  currency?: string
  date?: string // ISO date or display date
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  url: string
  iconName: string
  matchReason?: string
}

export interface UniversalSearchResults {
  totalCount: number
  items: SearchResultItem[]
  countsByEntity: Record<SearchEntityType, number>
  parsedQuery: ParsedSearchQuery
}

export interface SavedSearch {
  _id?: ObjectId
  userId: string
  organizationId: string | null
  name: string
  query: string
  icon?: string
  createdAt: Date
  updatedAt: Date
}

export interface SerializedSavedSearch {
  id: string
  name: string
  query: string
  createdAt: string
  updatedAt: string
}
