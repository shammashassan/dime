export interface NetWorthBreakdown {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  assetsBreakdown: {
    cash: number;
    bank: number;
    investments: number;
    loans: number;
    manualAssets: number;
  };
  liabilitiesBreakdown: {
    creditCards: number;
    loans: number;
    manualLiabilities: number;
  };
  currencyBreakdown: Record<string, { assets: number; liabilities: number; netWorth: number }>;
}

export interface HistoricalNetWorthPoint extends NetWorthBreakdown {
  date: Date;
  dateStr: string;
}
