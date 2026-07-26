import { getCollection } from "@/lib/db/collections"
import { BillInstance } from "@/types"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"

export async function getBillInstances() {
  const scope = await getFinancialScope()
  const billsColl = await getCollection<BillInstance>("bill_instances")
  
  return billsColl.find({ ...getScopeFilter(scope) }).sort({ dueDate: 1 }).toArray()
}

export async function getBillInstancesByRuleId(ruleId: string) {
  const scope = await getFinancialScope()
  const billsColl = await getCollection<BillInstance>("bill_instances")
  
  return billsColl.find({ ruleId, ...getScopeFilter(scope) }).sort({ dueDate: -1 }).toArray()
}
