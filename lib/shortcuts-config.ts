export interface ShortcutItem {
  id: string
  label: string
  description: string
  keys: string[]
  category: "Navigation" | "Global Actions" | "Transactions Table"
  path?: string
  actionId?: string
}

export const SHORTCUTS: ShortcutItem[] = [
  // Navigation (g chords)
  {
    id: "nav-dashboard",
    label: "Dashboard",
    description: "Go to Packed Bento Dashboard",
    keys: ["g", "d"],
    category: "Navigation",
    path: "/dashboard",
  },
  {
    id: "nav-transactions",
    label: "Transactions",
    description: "Go to Transactions ledger",
    keys: ["g", "t"],
    category: "Navigation",
    path: "/transactions",
  },
  {
    id: "nav-budgets",
    label: "Budgets",
    description: "Go to Budgets & templates",
    keys: ["g", "b"],
    category: "Navigation",
    path: "/budgets",
  },
  {
    id: "nav-reports",
    label: "Reports",
    description: "Go to Reports, Analytics & Monthly Review",
    keys: ["g", "r"],
    category: "Navigation",
    path: "/reports",
  },
  {
    id: "nav-coach",
    label: "AI Financial Coach",
    description: "Go to AI Coach & Simulator",
    keys: ["g", "c"],
    category: "Navigation",
    path: "/coach",
  },
  {
    id: "nav-insights",
    label: "AI Insights",
    description: "Go to AI Spending Insights",
    keys: ["g", "i"],
    category: "Navigation",
    path: "/insights",
  },
  {
    id: "nav-net-worth",
    label: "Net Worth",
    description: "Go to Net Worth dashboard & assets",
    keys: ["g", "n"],
    category: "Navigation",
    path: "/net-worth",
  },
  {
    id: "nav-wallets",
    label: "Wallets",
    description: "Go to Wallets & Bank Accounts",
    keys: ["g", "w"],
    category: "Navigation",
    path: "/wallets",
  },
  {
    id: "nav-loans",
    label: "Loans",
    description: "Go to Personal Lending & Borrowing",
    keys: ["g", "l"],
    category: "Navigation",
    path: "/loans",
  },
  {
    id: "nav-search",
    label: "Advanced Search",
    description: "Go to Universal Search hub",
    keys: ["g", "s"],
    category: "Navigation",
    path: "/search",
  },
  {
    id: "nav-planner",
    label: "Financial Planner",
    description: "Go to Forecasting & Scenarios",
    keys: ["g", "p"],
    category: "Navigation",
    path: "/planner",
  },
  {
    id: "nav-calendar",
    label: "Cash Flow Calendar",
    description: "Go to Future Cash Flow Calendar",
    keys: ["g", "e"],
    category: "Navigation",
    path: "/calendar",
  },
  {
    id: "nav-timeline",
    label: "Timeline",
    description: "Go to Chronological Financial Timeline",
    keys: ["g", "m"],
    category: "Navigation",
    path: "/timeline",
  },
  {
    id: "nav-subscriptions",
    label: "Subscriptions",
    description: "Go to Subscription Manager",
    keys: ["g", "u"],
    category: "Navigation",
    path: "/recurring?tab=subscriptions",
  },
  {
    id: "nav-shared",
    label: "Shared Expenses",
    description: "Go to Shared Expenses & Settlements",
    keys: ["g", "x"],
    category: "Navigation",
    path: "/shared-expenses",
  },

  // Global Actions
  {
    id: "action-new-tx",
    label: "New Transaction",
    description: "Open Quick Transaction dialog from anywhere",
    keys: ["c"],
    category: "Global Actions",
    actionId: "quick-add-transaction",
  },
  {
    id: "action-command",
    label: "Universal Command Palette",
    description: "Open global search & command center",
    keys: ["⌘", "K"],
    category: "Global Actions",
    actionId: "open-command-palette",
  },
  {
    id: "action-help",
    label: "Keyboard Shortcuts",
    description: "Display this cheat-sheet",
    keys: ["?"],
    category: "Global Actions",
    actionId: "open-shortcuts-dialog",
  },
  {
    id: "action-dismiss",
    label: "Dismiss / Deselect",
    description: "Close active modal, popover, or clear selection",
    keys: ["Esc"],
    category: "Global Actions",
    actionId: "dismiss",
  },

  // Transactions Table
  {
    id: "table-next",
    label: "Next Transaction",
    description: "Move keyboard cursor down",
    keys: ["j"],
    category: "Transactions Table",
  },
  {
    id: "table-prev",
    label: "Previous Transaction",
    description: "Move keyboard cursor up",
    keys: ["k"],
    category: "Transactions Table",
  },
  {
    id: "table-select",
    label: "Select Row",
    description: "Toggle selection on focused transaction",
    keys: ["x"],
    category: "Transactions Table",
  },
  {
    id: "table-edit",
    label: "Edit Row",
    description: "Open edit dialog for focused transaction",
    keys: ["e"],
    category: "Transactions Table",
  },
  {
    id: "table-delete",
    label: "Delete Selected",
    description: "Initiate deletion for selected transactions",
    keys: ["Delete"],
    category: "Transactions Table",
  },
]
