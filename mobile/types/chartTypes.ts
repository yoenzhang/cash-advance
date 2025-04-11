export interface SpendingData {
  date: Date;
  amount: number;
  category?: string;
}

export interface AggregatedSpendingData {
  period: string; // e.g., 'Jan 2025', '2025-W01', '2025-01-01'
  amount: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface MonthlyBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface RepaymentData {
  date: Date;
  onTime: number;
  late: number;
}

export interface AggregatedRepaymentData {
  period: string;
  onTime: number;
  late: number;
}

export interface DailySpendingDetail {
  date: string;
  description: string;
  amount: number;
}

export interface HeatmapDataPoint {
  week: number;
  dayOfWeek: number;
  amount: number;
  dateString: string;
}

// Interface for SpendingComparisonChart
export interface SpendingComparisonDataPoint {
  category: string;
  currentAmount: number;
  previousAmount: number;
}

// For Metrics Calculation
export interface MetricCalculationData {
  filteredSpending: SpendingData[];
  aggregatedRepayment: AggregatedRepaymentData[];
  categoryData: CategoryData[];
  startDate: Date;
  endDate: Date;
}

// Maybe other shared types if needed
