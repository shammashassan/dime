# Dime Roadmap – Next Major Features

We want Dime to evolve into a premium, modern personal finance platform comparable to Monarch Money, Copilot Money, YNAB, and Lunch Money while remaining simple, fast, privacy-focused, and beautifully designed.

Before implementing any feature, carefully review the existing codebase, database models, server actions, APIs, background jobs, notification system, search infrastructure, analytics, and UI components. Reuse existing architecture and patterns wherever possible. Extend existing models instead of creating duplicate implementations.

---

# ✅ Completed Features

## Core Finance

* ✅ Wallets & Accounts
* ✅ Transactions
* ✅ Categories
* ✅ Budgets
* ✅ Goals

## Collaboration

* ✅ Couples & Shared Budgeting (Spaces)

## Automation

* ✅ Automation Rules Engine

## Money Management

* ✅ Transaction Splitting
* ✅ Loans & Lending (Personal Lending)
* ✅ Recurring Platform (Recurring Transactions)
* ✅ Subscription Manager
* ✅ Bill Manager

## Analytics

* ✅ Reports & Analytics
* ✅ Net Worth Dashboard

---

# 1. Subscription Manager ✅ COMPLETED

Automatically detect and manage recurring subscriptions.

Examples:

* Netflix
* Spotify
* ChatGPT
* Domains
* Hosting
* SaaS
* Gym memberships
* Apple iCloud
* Google One

Features:

* Automatic subscription detection
* Monthly & annual cost
* Renewal calendar
* Upcoming renewals
* Cancellation reminders
* Free trial tracking
* Renewal notifications
* Price increase tracking
* Subscription analytics
* Monthly subscription trends
* Active vs cancelled subscriptions

### Additional Completed Features

* ✅ Subscription detail pages
* ✅ Subscription analytics dashboard
* ✅ Subscription status tracking
* ✅ Upcoming renewal overview
* ✅ Renewal history
* ✅ Manual renewal logging
* ✅ Integration with recurring engine
* ✅ Shared recurring infrastructure
* ✅ Active / Cancelled lifecycle management

Integrations:

* Notifications
* Automation Rules
* Cash Flow Calendar
* Financial Planner
* Reports
* Dashboard Widgets

Status:

**Completed. Future enhancements should focus on subscription price history, automatic merchant detection improvements, and optional bank synchronization.**

---

# 2. Bill Manager ✅ COMPLETED

Track recurring and one-time bills separately from subscriptions.

Examples:

* Electricity
* Water
* Internet
* Rent
* Insurance
* Taxes
* School fees
* Maintenance
* Phone bill

Features:

* Due dates
* Recurring schedules
* Variable bill amounts
* Paid / unpaid status
* Overdue alerts
* Reminder notifications
* Payment history
* Monthly calendar
* Upcoming bills
* Bill categories
* Auto-create recurring bills

### Additional Completed Features

* ✅ Bill instances
* ✅ Bill payment history
* ✅ Bill detail pages
* ✅ Bill status management
* ✅ Upcoming bills overview
* ✅ Overdue tracking
* ✅ Bill analytics
* ✅ Shared recurring infrastructure
* ✅ Variable amount support
* ✅ Manual payment recording

Integrations:

* Notifications
* Calendar
* Automation Rules
* Financial Planner
* Reports

Status:

**Completed. Future enhancements should focus on OCR bill import, email parsing, and automatic bill detection.**

---

# 3. Net Worth Dashboard ✅ COMPLETED

Provide a complete financial overview.

Assets

* Cash
* Wallets
* Bank Accounts
* Investments
* Gold
* Crypto
* Real Estate
* Vehicles
* Money Lent

Liabilities

* Money Borrowed
* Credit Cards
* Personal Loans
* Mortgages
* Other Debts

Display:

* Current Net Worth
* Monthly Growth
* Asset Allocation
* Liability Breakdown
* Historical Charts
* Net Worth Timeline
* Monthly Changes

### Additional Completed Features

* ✅ Dedicated Assets & Liabilities management
* ✅ Manual asset tracking
* ✅ Manual liability tracking
* ✅ Asset valuation history
* ✅ Historical net worth calculation
* ✅ Currency allocation
* ✅ Asset allocation
* ✅ Top Assets
* ✅ Top Liabilities
* ✅ Financial Health panel
* ✅ Net Worth insights
* ✅ Interactive Bento dashboard
* ✅ Asset detail pages
* ✅ Liability detail pages
* ✅ Ownership percentages
* ✅ Multiple asset categories
* ✅ Historical valuation support
* ✅ Dynamic net worth reconstruction
* ✅ Append-only valuation history

Future Integrations

* Investment Portfolio
* Financial Planner
* AI Financial Coach
* Dashboard Widgets
* Reports
* Open Banking

Status:

**Completed. Future enhancements should focus on investment synchronization and automatic market valuation.**

---

# 4. Investment Tracker (Highest Priority)

Track investments manually initially.

Support:

* Stocks
* ETFs
* Mutual Funds
* Crypto
* Gold
* Bonds
* EPF
* PPF
* NPS
* Fixed Deposits

Features:

* Holdings
* Quantity
* Average Buy Price
* Current Value
* Unrealized Gain/Loss
* Allocation Charts
* Portfolio Breakdown
* Investment Notes

### Additional Planned Features

* Buy / Sell transactions
* Cost basis calculation
* Realized gains/losses
* Dividend tracking
* Portfolio performance
* Benchmark comparison
* Investment goals
* Sector allocation
* Country allocation
* Brokerage accounts
* Investment watchlists
* Historical portfolio value
* Portfolio timeline
* Performance attribution
* Investment insights
* Investment reports

Future:

* Live price integrations
* Dividend tracking
* Portfolio performance
* Brokerage synchronization
* Automatic market data
* Tax lot tracking
* Corporate actions
* Multi-currency portfolios
* Portfolio forecasting
* Integration into Net Worth
---

# 5. Shared Expense Settlement

Extend Shared Spaces with expense splitting and reimbursements.

Examples:

Dinner

₹2,400

Paid by Alice

Participants:

* Alice
* Bob
* Charlie

Result:

Bob owes ₹800

Charlie owes ₹800

Features:

* Equal split
* Percentage split
* Custom split
* Itemized split
* Settlement tracking
* Partial settlements
* Automatic reimbursement suggestions
* Outstanding balances
* Space-level settlements

### Additional Planned Features

* Expense approval workflow
* Settlement reminders
* Payment status tracking
* One-click settle balances
* QR payment integration
* Settlement history
* Multi-currency settlements
* Automatic balance simplification
* Group expense analytics
* Member balance dashboard
* Settlement timeline
* Export settlement history

Integrations:

* Shared Spaces
* Contacts
* Loans
* Notifications
* Reports
* Financial Timeline
* Dashboard Widgets

---

# 6. Contacts

Introduce reusable contacts across Dime.

Each Contact should support:

* Name
* Phone
* Email
* Avatar
* Notes

A contact can be referenced by:

* Loans
* Shared expenses
* Future reimbursements
* Payment history
* Financial timeline

Benefits:

* Autocomplete
* Contact history
* Analytics
* Better search
* Reduced duplicate data

### Additional Planned Features

* Contact groups
* Favorite contacts
* Contact statistics
* Money lent summary
* Money borrowed summary
* Shared Spaces participation
* Payment preferences
* Contact activity timeline
* Contact notes history
* Duplicate detection
* Contact search improvements

Future Integrations:

* Open Banking
* Shared Settlements
* AI Financial Coach
* Financial Timeline
* Notifications

---

# 7. Financial Planner (Forecasting)

Transform forecasting into an interactive financial planning tool.

Use:

* Historical spending
* Budgets
* Goals
* Recurring transactions
* Bills
* Subscriptions
* Loans
* Investments
* Income
* Cash Flow

Support interactive scenarios:

* Increase monthly savings
* Reduce spending
* Increase investments
* Pay extra toward loans
* Cancel subscriptions
* Delay purchases

Forecast:

* Future balances
* Cash flow
* Goal completion
* Budget overruns
* Savings growth
* Loan payoff dates
* Net worth growth

Provide:

* Scenario comparison
* Interactive charts
* Recommendations
* What-if simulations

### Additional Planned Features

* Investment forecasting
* Retirement projections
* Net worth forecasting
* Inflation adjustments
* Multiple financial scenarios
* Scenario snapshots
* Compare saved scenarios
* Forecast confidence score
* Emergency fund forecasting
* Subscription impact analysis
* Goal acceleration analysis
* Budget optimization suggestions
* Financial milestone predictions

Integrations:

* Goals
* Budgets
* Reports
* Net Worth
* Investments
* AI Financial Coach
* Dashboard Widgets

---

# 8. Financial Health Score

Generate an overall financial wellness score.

Factors:

* Savings rate
* Budget adherence
* Emergency fund
* Debt ratio
* Spending stability
* Goal progress
* Cash flow
* Income consistency
* Subscription burden
* Loan utilization

Provide actionable recommendations.

### Additional Planned Metrics

* Investment diversification
* Liquidity ratio
* Net worth growth trend
* Cash reserve coverage
* Expense stability
* Budget consistency
* Goal completion rate
* Debt payoff progress
* Financial resilience score

Display:

* Overall score
* Category scores
* Historical score trend
* Improvement suggestions
* Monthly score changes

Integrations:

* Reports
* Dashboard
* AI Financial Coach
* Financial Planner

---

# 9. AI Spending Insights

Automatically generate personalized financial insights.

Examples:

* You spent 18% less on groceries.
* Restaurant spending increased by ₹2,400.
* Entertainment exceeded budget.
* Subscriptions increased this quarter.
* Travel spending is above average.

Highlight anomalies and trends automatically.

### Additional Planned Insights

* Net worth changes
* Savings opportunities
* Budget optimization
* Subscription recommendations
* Goal progress analysis
* Cash flow risks
* Loan payoff recommendations
* Investment allocation suggestions
* Spending anomalies
* Seasonal spending patterns
* Category trend analysis
* Financial habit analysis

Future AI Features

* Weekly summaries
* Monthly financial reviews
* Personalized coaching
* Predictive insights
* Natural language financial summaries

---

# 10. Cash Flow Calendar

Provide a future financial calendar.

Display:

* Income
* Bills
* Loan repayments
* Subscription renewals
* Goals
* Recurring transactions
* Expected balances

Allow users to understand future cash flow at a glance.

### Additional Planned Features

* Investment contributions
* Forecasted balances
* Cash flow deficits
* Upcoming large expenses
* Goal contribution schedule
* Drag-and-drop planning
* Calendar filters
* Daily cash balance projection
* Weekly cash flow summary
* Monthly planning mode
* Scenario-aware calendar
* Calendar exports

Integrations:

* Financial Planner
* Bills
* Subscriptions
* Goals
* Investments
* Reports
* Notifications
* Dashboard Widgets
---

# 11. Advanced Search

Support powerful query operators.

Examples:

merchant:amazon

category:food

wallet:cash

amount>500

amount<1000

date:last month

currency:INR

tag:vacation

person:john

loan:active

subscription:active

bill:overdue

Support combining multiple filters.

### Additional Planned Features

Support searching across every financial entity in Dime.

Examples:

goal:active

goal:completed

investment:stocks

investment:crypto

asset:real-estate

asset:gold

liability:mortgage

space:family

budget:active

rule:enabled

recurring:monthly

transaction:split

status:overdue

date:this year

date:last quarter

amount>=10000

currency:USD

Support:

* Saved searches
* Search history
* Search suggestions
* Instant filtering
* Global command palette integration
* Keyboard shortcuts
* Natural language search (future)
* AI-powered search (future)

Integrations:

* Dashboard
* Reports
* Financial Timeline
* AI Financial Coach
* Open Banking
* Documents Vault

---

# 12. Custom Dashboard Widgets

Allow complete dashboard customization.

Widgets:

* Accounts
* Budgets
* Goals
* Net Worth
* Spending
* Categories
* Cash Flow
* Loans
* Investments
* Bills
* Subscriptions
* Calendar
* Forecast
* Recent Transactions
* AI Insights
* Financial Health
* Upcoming Due Dates

Support:

* Drag & Drop
* Resize
* Hide
* Multiple layouts

### Additional Planned Widgets

* Financial Timeline
* Monthly Review
* Spending Heatmap
* Savings Rate
* Income Breakdown
* Expense Breakdown
* Investment Performance
* Portfolio Allocation
* Goal Progress
* Budget Health
* Cash Flow Forecast
* Upcoming Renewals
* Debt Overview
* Financial Score
* AI Coach Summary
* Recent Activity Feed
* Watchlists
* Quick Actions

Additional Features

* Widget presets
* Personal layouts
* Workspace profiles
* Mobile layouts
* Desktop layouts
* Widget pinning
* Widget favorites
* Full dashboard export

---

# 13. Budget Templates

Provide ready-made budgeting templates.

Examples:

* Student
* Family
* Freelancer
* Business
* Minimalist
* Traveler

Allow users to build and share custom templates.

### Additional Planned Templates

* Emergency Fund
* Debt Payoff
* Newly Married
* College Student
* Digital Nomad
* Home Buyer
* Retirement Planning
* Investment Focused
* Zero-Based Budget
* 50/30/20 Budget
* Envelope Budget

Additional Features

* Community templates
* Duplicate existing budgets
* AI-generated budget templates
* Budget recommendations
* Template marketplace (future)

---

# 14. Spending Heatmaps

GitHub-style heatmaps for:

* Daily spending
* Monthly spending
* Income
* Savings
* Transactions

Clicking a day should drill into transactions.

### Additional Planned Features

* Net Worth heatmap
* Cash flow heatmap
* Budget utilization heatmap
* Investment activity
* Goal contributions
* Bill payments
* Subscription renewals
* Loan repayments

Support:

* Weekly view
* Monthly view
* Yearly view
* Custom ranges
* Category filtering
* Wallet filtering
* Space filtering

Integrations:

* Reports
* Dashboard
* Financial Timeline
* AI Insights

---

# 15. Financial Timeline

Chronological financial activity feed.

Include:

* Salary received
* Bills paid
* Goal achieved
* Loan created
* Loan repaid
* Investments
* Subscription renewals
* Large purchases
* Budget milestones
* Shared expense settlements

Support filtering by event type.

### Additional Planned Events

* Asset created
* Asset valuation updated
* Liability created
* Net Worth milestones
* Automation executed
* Budget exceeded
* Budget reset
* Goal contribution
* Goal completed
* Investment purchased
* Investment sold
* Dividend received
* Financial Health improvements
* AI recommendations
* Forecast milestones
* Bank synchronization events
* Document uploads

Additional Features

* Timeline search
* Timeline bookmarks
* Event reactions
* Export timeline
* Timeline summaries
* AI-generated monthly recap

Integrations:

* Dashboard
* Reports
* Notifications
* AI Coach
* Search

---

# 16. AI Financial Coach

Provide intelligent financial coaching.

Examples:

* You could save ₹3,000 monthly by reducing restaurant spending.
* Your emergency fund covers five months.
* Increase your SIP by ₹2,000 to reach your goal six months earlier.
* Paying an extra ₹5,000 toward your loan saves four months.

Provide recommendations, never financial advice.

### Additional Planned Capabilities

Financial Coaching

* Savings optimization
* Debt payoff strategies
* Budget improvements
* Spending reduction opportunities
* Subscription optimization
* Investment allocation suggestions
* Goal acceleration
* Emergency fund planning
* Retirement planning assistance

AI Summaries

* Weekly review
* Monthly review
* Quarterly review
* Year-end review

Smart Recommendations

* Spending anomalies
* Budget adjustments
* Portfolio diversification
* Cash flow improvements
* Net worth growth suggestions
* Goal prioritization
* Bill optimization
* Financial habit coaching

Future Integrations

* Financial Planner
* Reports
* Dashboard
* Financial Timeline
* Investment Tracker
* Open Banking
* Documents Vault
* Financial Health Score
---

# 17. Open Banking & Account Sync (Future)

Support secure bank integrations where available.

Features:

* Automatic transaction imports
* Account synchronization
* Balance updates
* Duplicate detection
* Manual review
* Institution management

Designed to work as an optional integration layer.

### Additional Planned Features

Supported Accounts

* Checking Accounts
* Savings Accounts
* Credit Cards
* Investment Accounts
* Loan Accounts
* Retirement Accounts
* Business Accounts

Synchronization

* Automatic balance synchronization
* Automatic transaction imports
* Historical transaction imports
* Incremental sync
* Manual refresh
* Background synchronization
* Duplicate prevention
* Conflict resolution

Institution Management

* Multiple institutions
* Multiple accounts
* Account grouping
* Connection health monitoring
* Reauthentication flow
* Institution status

Security

* OAuth support
* Read-only access
* Encrypted credentials
* Permission management
* Institution authorization history

Future

* Investment synchronization
* Automatic recurring detection
* Subscription detection
* Bill detection
* Merchant enrichment
* Categorization improvements
* Exchange rate synchronization

Integrations

* Wallets
* Transactions
* Investments
* Net Worth
* Reports
* Dashboard
* AI Financial Coach
* Automation Rules

---

# 18. Financial Documents Vault

Securely store financial documents.

Examples:

* Insurance
* Tax documents
* Receipts
* Loan agreements
* Investment statements
* Property documents

Features:

* Secure uploads
* Categories
* OCR search
* Expiry reminders
* Document timeline

### Additional Planned Features

Supported Documents

* Identity Documents
* Passport
* Driver's License
* Insurance Policies
* Property Documents
* Bank Statements
* Brokerage Statements
* Tax Returns
* Salary Slips
* Warranty Documents
* Invoices
* Medical Bills

Organization

* Tags
* Collections
* Folder hierarchy
* Linked entities
* Smart search
* OCR indexing

Automation

* Expiry reminders
* Renewal reminders
* AI document classification
* Duplicate detection
* Version history

Security

* Encryption
* Access logs
* Secure sharing
* Watermarking
* Permission controls

Integrations

* Loans
* Investments
* Assets
* Bills
* Reports
* AI Coach

---

# 19. Financial Inbox & Notifications Center (New)

Centralize every financial notification into a unified inbox.

Purpose

Provide a single place where users can review every important financial event instead of relying solely on push notifications.

Notification Types

* Upcoming bills
* Overdue bills
* Subscription renewals
* Budget warnings
* Goal milestones
* Loan repayments
* Investment alerts
* Asset valuation reminders
* Net Worth milestones
* Automation Rule executions
* Shared Space activity
* Financial Planner alerts
* AI recommendations

Features

* Read / unread
* Snooze
* Pin
* Archive
* Filter by type
* Search
* Mark all as read
* Bulk actions
* Notification preferences

Integrations

* Notifications
* Automation Rules
* Bills
* Goals
* Investments
* Net Worth
* Reports
* Dashboard
* AI Coach

---

# 20. Monthly Financial Review (New)

Generate an automatic monthly financial review.

Purpose

Help users understand how their finances changed over the previous month.

Include

* Income summary
* Expense summary
* Savings rate
* Budget performance
* Goal progress
* Net Worth changes
* Loan progress
* Investment performance
* Largest expenses
* Largest income
* Spending trends
* Subscription changes
* Bill summary

Provide

* AI summary
* Financial highlights
* Financial concerns
* Recommendations
* Next month's outlook

Future

* Quarterly review
* Annual review
* Shareable reports
* Printable reports
* PDF export

Integrations

* Reports
* Dashboard
* AI Coach
* Financial Planner

---

# 21. Product Polish & User Experience (New)

Focus on refining the overall user experience and making Dime feel like a premium product.

Features

* Global Command Palette
* Universal Search
* Keyboard Shortcuts
* Bulk Actions
* Improved Empty States
* Better Onboarding
* Responsive Improvements
* Accessibility Improvements
* Performance Optimizations
* Offline Support
* Better Loading States
* Skeleton Screens
* Faster Navigation
* View Preferences
* Saved Filters
* Saved Views

Dashboard

* Better information density
* Bento layouts
* Dashboard personalization
* Widget improvements

Reports

* Better chart interactions
* Export improvements
* Drill-down analytics

General

* Consistent animations
* Improved mobile experience
* Better tablet layouts
* Better desktop layouts
* UI consistency audit

---

# 22. Investment Portfolio Enhancements (Future)

Extend the Investment Tracker into a full portfolio management platform.

Features

* Portfolio performance
* Portfolio timeline
* Sector allocation
* Country allocation
* Asset class allocation
* Dividend history
* Dividend forecasting
* Cost basis tracking
* Tax lot management
* Capital gains reporting
* Investment goals
* Portfolio benchmarking
* Risk analysis
* Diversification score
* Performance attribution

Future

* Broker synchronization
* Live pricing
* Options
* ETFs
* Bonds
* Alternative investments
* Retirement planning integration

Integrations

* Net Worth
* Reports
* Dashboard
* AI Coach
* Financial Planner
* Financial Health Score

---

# Future Considerations

Potential future features after the core roadmap is complete.

* Family Financial Management
* Business Finance Mode
* Invoice Management
* Tax Planning
* Estate Planning
* Retirement Planning
* Insurance Tracking
* Credit Score Tracking
* Credit Report Monitoring
* Financial Marketplace
* Public API
* Plugin System
* Developer SDK
* Webhooks
* Apple Shortcuts
* Wearable Apps
* Desktop Applications

---

# General Requirements

* Follow the existing architecture.
* Reuse existing server actions and utilities.
* Extend existing models instead of duplicating functionality.
* Keep database models normalized.
* Design for long-term scalability.
* Mobile-first responsive UI.
* Use shadcn/ui components.
* Support dark mode.
* Accessible UI.
* Loading skeletons.
* Beautiful empty states.
* Type-safe implementation.
* Proper permissions.
* Integrate with Notifications.
* Integrate with Automation Rules.
* Integrate with Search.
* Integrate with Analytics.
* Integrate with Reports.
* Integrate with Dashboard Widgets.
* Integrate with Shared Spaces where applicable.
* Integrate with Financial Timeline.
* Design every feature so it can be consumed by future AI features and the Financial Planner without requiring schema redesign.

## Architectural Principles

Every new feature should:

* Reuse existing infrastructure where possible.
* Be modular and independently maintainable.
* Prefer extending existing domains over introducing duplicate concepts.
* Keep calculations separate from UI.
* Keep business logic separate from presentation.
* Be designed with future AI integrations in mind.
* Be compatible with Shared Spaces.
* Be compatible with Dashboard Widgets.
* Be compatible with Reports & Analytics.
* Be compatible with Notifications.
* Be compatible with Financial Timeline.
* Be API-first where practical.
* Support localization and multi-currency.
* Remain scalable for future Open Banking and Investment integrations.