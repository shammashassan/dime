import { Wallet, Transaction, Loan, LoanRepayment, Asset, AssetValuation } from "@/types";
import { NetWorthBreakdown, HistoricalNetWorthPoint } from "./types";

// Reusable backtracking helpers
export function getWalletBalanceAt(
  transactions: Transaction[],
  wallet: Wallet,
  date: Date
): number {
  let balance = wallet.balance;
  const walletIdStr = wallet._id.toString();

  // Replay transactions that occurred after the target date in reverse
  for (const tx of transactions) {
    if (tx.walletId !== walletIdStr || new Date(tx.date) <= date) continue;

    if (tx.type === "expense") {
      balance += tx.amount; // Revert expense: add back
    } else if (tx.type === "income") {
      balance -= tx.amount; // Revert income: subtract
    } else if (tx.type === "transfer") {
      if (tx.transferType === "debit") {
        balance += tx.amount; // Revert transfer debit: add back
      } else if (tx.transferType === "credit") {
        balance -= tx.amount; // Revert transfer credit: subtract
      }
    }
  }
  return balance;
}

export function getLoanBalanceAt(
  loan: Loan,
  repayments: LoanRepayment[],
  date: Date
): number {
  const loanDate = new Date(loan.date);
  if (date < loanDate) return 0; // Loan wasn't active yet

  const loanIdStr = loan._id.toString();
  let balance = loan.remainingAmount;

  // Re-add repayments that occurred after the target date
  for (const rep of repayments) {
    if (rep.loanId !== loanIdStr || new Date(rep.date) <= date) continue;
    balance += rep.amount;
  }

  return balance;
}

export function getAssetValueAt(
  valuations: AssetValuation[],
  asset: Asset,
  date: Date
): number {
  const assetIdStr = asset._id.toString();
  let latestValuation: AssetValuation | null = null;

  // Find the latest valuation on or before the target date
  for (const v of valuations) {
    if (v.assetId !== assetIdStr) continue;
    const valDate = new Date(v.date);
    if (valDate <= date) {
      if (!latestValuation || valDate > new Date(latestValuation.date)) {
        latestValuation = v;
      }
    }
  }

  if (!latestValuation) return 0;
  return Math.round(latestValuation.value * (asset.ownershipPercentage / 100));
}

export function calculateCurrentNetWorth(params: {
  wallets: Wallet[];
  loans: Loan[];
  assets: Asset[];
  convert: (amount: number, from: string) => number;
}): NetWorthBreakdown {
  const { wallets, loans, assets, convert } = params;

  let totalAssets = 0;
  let totalLiabilities = 0;

  const assetsBreakdown = { cash: 0, bank: 0, investments: 0, loans: 0, manualAssets: 0 };
  const liabilitiesBreakdown = { creditCards: 0, loans: 0, manualLiabilities: 0 };
  const currencyBreakdown: Record<string, { assets: number; liabilities: number; netWorth: number }> = {};

  const trackCurrency = (amount: number, currency: string, isAsset: boolean) => {
    const uCurr = currency.toUpperCase();
    if (!currencyBreakdown[uCurr]) {
      currencyBreakdown[uCurr] = { assets: 0, liabilities: 0, netWorth: 0 };
    }
    if (isAsset) {
      currencyBreakdown[uCurr].assets += amount;
      currencyBreakdown[uCurr].netWorth += amount;
    } else {
      currencyBreakdown[uCurr].liabilities += amount;
      currencyBreakdown[uCurr].netWorth -= amount;
    }
  };

  // 1. Process Wallets
  for (const w of wallets) {
    if (w.isArchived) continue;
    
    const balance = w.balance;
    const converted = convert(balance, w.currency);

    if (w.type === "credit_card") {
      const liabilityValue = -balance; // positive value representing the debt
      totalLiabilities += convert(liabilityValue, w.currency);
      liabilitiesBreakdown.creditCards += convert(liabilityValue, w.currency);
      trackCurrency(liabilityValue, w.currency, false);
    } else {
      totalAssets += converted;
      trackCurrency(balance, w.currency, true);

      if (w.type === "cash") assetsBreakdown.cash += converted;
      else if (w.type === "investment") assetsBreakdown.investments += converted;
      else if (w.type === "lent") assetsBreakdown.loans += converted; // custom lent wallet
      else assetsBreakdown.bank += converted; // bank / savings
    }
  }

  // 2. Process Loans
  for (const l of loans) {
    if (l.status === "cancelled") continue;

    const remaining = l.remainingAmount;
    const converted = convert(remaining, l.currency);

    if (l.type === "lent") {
      totalAssets += converted;
      assetsBreakdown.loans += converted;
      trackCurrency(remaining, l.currency, true);
    } else {
      totalLiabilities += converted;
      liabilitiesBreakdown.loans += converted;
      trackCurrency(remaining, l.currency, false);
    }
  }

  // 3. Process Manual Assets
  for (const a of assets) {
    if (a.status !== "active") continue;

    const ownedValue = Math.round(a.currentValue * (a.ownershipPercentage / 100));
    const converted = convert(ownedValue, a.currency);

    if (a.kind === "asset") {
      totalAssets += converted;
      trackCurrency(ownedValue, a.currency, true);
      if (a.category === "cash") assetsBreakdown.cash += converted;
      else if (a.category === "investment" || a.category === "gold" || a.category === "crypto") assetsBreakdown.investments += converted;
      else assetsBreakdown.manualAssets += converted;
    } else {
      totalLiabilities += converted;
      liabilitiesBreakdown.manualLiabilities += converted;
      trackCurrency(ownedValue, a.currency, false);
    }
  }

  return {
    netWorth: totalAssets - totalLiabilities,
    totalAssets,
    totalLiabilities,
    assetsBreakdown,
    liabilitiesBreakdown,
    currencyBreakdown
  };
}

export function calculateNetWorthHistory(params: {
  wallets: Wallet[];
  transactions: Transaction[];
  loans: Loan[];
  repayments: LoanRepayment[];
  assets: Asset[];
  valuations: AssetValuation[];
  convert: (amount: number, from: string) => number;
  dates: Date[];
}): HistoricalNetWorthPoint[] {
  const { wallets, transactions, loans, repayments, assets, valuations, convert, dates } = params;

  // Sort transactions descending for faster backtracking
  const sortedTxs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return dates.map((date) => {
    // 1. Wallets at point-in-time
    const dateWallets = wallets.map(w => ({
      ...w,
      balance: getWalletBalanceAt(sortedTxs, w, date)
    }));

    // 2. Loans at point-in-time
    const dateLoans = loans.map(l => ({
      ...l,
      remainingAmount: getLoanBalanceAt(l, repayments, date)
    }));

    // 3. Assets at point-in-time
    const dateAssets = assets.map(a => ({
      ...a,
      currentValue: getAssetValueAt(valuations, a, date)
    }));

    const breakdown = calculateCurrentNetWorth({
      wallets: dateWallets,
      loans: dateLoans,
      assets: dateAssets,
      convert
    });

    const dateStr = `${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear().toString().slice(-2)}`;

    return {
      ...breakdown,
      date,
      dateStr
    };
  });
}
