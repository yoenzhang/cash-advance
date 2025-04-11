import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApplication } from '../context/ApplicationContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, 
  ScatterChart, Scatter, ZAxis, ReferenceLine, ReferenceArea // Import ScatterChart related components
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { downloadCSV } from '../utils/exportUtils'; // Import the CSV utility

// Types for our data
interface SpendingData {
  date: Date;
  amount: number;
}

interface AggregatedSpendingData {
  period: string;
  amount: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface MonthlyBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface RepaymentData {
  date: Date;
  onTime: number;
  late: number;
}

interface AggregatedRepaymentData {
  period: string;
  onTime: number;
  late: number;
}

// Detailed data for drill-down
interface DailySpendingDetail {
  date: string;
  description: string;
  amount: number;
}

// Data for Heatmap
interface HeatmapDataPoint {
  week: number; // Week number within the range/year
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  amount: number;
  dateString: string; // For tooltip
}

// Define structure for advanced metric definitions
interface AdvancedMetricDefinition {
  key: string;
  name: string;
  description: string;
  calculate: (data: MetricCalculationData) => number | null;
  format: (value: number | null) => string;
}

// Data passed to metric calculation functions
interface MetricCalculationData {
  filteredSpending: SpendingData[];
  aggregatedRepayment: AggregatedRepaymentData[];
  categoryData: CategoryData[]; // Note: Currently period-agnostic
  startDate: Date;
  endDate: Date;
}

// Add interface for the spending comparison data
interface SpendingComparisonData {
  period: string;
  spending: number;
  earnings: number;
  netEarnings: number;
  isPremiumEligible: boolean;
  isCurrentMonth: boolean;
  date: Date;
}

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'composed' | 'heatmap'; // Add heatmap
type AggregationPeriod = 'monthly' | 'weekly' | 'daily';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
// Heatmap colors - light to dark
const HEATMAP_COLORS = ['#cce5ff', '#99caff', '#66b0ff', '#3395ff', '#007bff']; 
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LOCALSTORAGE_METRICS_KEY = 'insightsAdvancedMetricsSelection';

// Helper to get week number within the year
const getWeekOfYear = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24)) / 7);
};

// Helper to format date for aggregation keys
const formatDateKey = (date: Date, period: AggregationPeriod): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const week = getWeekOfYear(date); // Use week of year

  switch (period) {
    case 'daily':
      return date.toISOString().split('T')[0];
    case 'weekly':
      return `${year}-W${week.toString().padStart(2, '0')}`;
    case 'monthly':
    default:
      return `${MONTHS[month]} ${year}`;
  }
};

// Helper to get date range label
const getDateRangeLabel = (start: Date, end: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
};

// Available Advanced Metrics Definition
const availableAdvancedMetrics: AdvancedMetricDefinition[] = [
  {
    key: 'avgTransactionValue',
    name: 'Avg. Transaction Value',
    description: 'Average amount spent per day within the period.',
    calculate: ({ filteredSpending }) => {
      if (!filteredSpending || filteredSpending.length === 0) return null;
      const total = filteredSpending.reduce((sum, item) => sum + item.amount, 0);
      const uniqueDays = new Set(filteredSpending.map(d => d.date.toDateString())).size;
       return uniqueDays > 0 ? total / uniqueDays : null;
    },
    format: (value) => value !== null ? `$${value.toFixed(2)}` : 'N/A',
  },
  {
    key: 'highestSpendingCategory',
    name: 'Highest Spending Category',
    description: 'The category with the most spending (based on overall category data).',
    calculate: ({ categoryData }) => {
       if (!categoryData || categoryData.length === 0) return null;
       const highest = categoryData.reduce((max, item) => item.value > max.value ? item : max, categoryData[0]);
       return highest.value;
    },
    format: (value) => value !== null ? `$${value.toLocaleString()}` : 'N/A', // Simplified format
  },
  {
    key: 'latePaymentCount',
    name: 'Late Payments',
    description: 'Total number of late payments recorded in the period.',
    calculate: ({ aggregatedRepayment }) => {
      if (!aggregatedRepayment) return null;
      return aggregatedRepayment.reduce((sum, item) => sum + item.late, 0);
    },
    format: (value) => value !== null ? `${value}` : 'N/A',
  },
   {
     key: 'onTimeRepaymentRate',
     name: 'On-Time Repayment Rate',
     description: 'Percentage of repayments made on time in the period.',
     calculate: ({ aggregatedRepayment }) => {
       if (!aggregatedRepayment) return null;
       const totalOnTime = aggregatedRepayment.reduce((sum, item) => sum + item.onTime, 0);
       const totalLate = aggregatedRepayment.reduce((sum, item) => sum + item.late, 0);
       const totalRepayments = totalOnTime + totalLate;
       return totalRepayments > 0 ? (totalOnTime / totalRepayments) * 100 : null;
     },
     format: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
   },
  // Add more metrics here...
];

const Insights: React.FC = () => {
  const { user } = useAuth();
  const { applications } = useApplication();
  const [loading, setLoading] = useState<boolean>(true);
  
  // Raw daily data state
  const [rawSpendingData, setRawSpendingData] = useState<SpendingData[]>([]);
  const [rawRepaymentData, setRawRepaymentData] = useState<RepaymentData[]>([]);
  
  // Aggregated data for charts
  const [aggregatedSpendingData, setAggregatedSpendingData] = useState<AggregatedSpendingData[]>([]);
  const [aggregatedRepaymentData, setAggregatedRepaymentData] = useState<AggregatedRepaymentData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]); // State for heatmap data
  
  const [creditUtilization, setCreditUtilization] = useState<number>(0);
  const [averageRepaymentTime, setAverageRepaymentTime] = useState<number>(0);
  const [totalAdvances, setTotalAdvances] = useState<number>(0);
  
  // Date Range State
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3); // Default to last 3 months for heatmap visibility
    date.setDate(1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod>('monthly');

  // Chart type state
  const [spendingChartType, setSpendingChartType] = useState<ChartType>('bar');
  const [categoryChartType, setCategoryChartType] = useState<ChartType>('pie');
  const [repaymentChartType, setRepaymentChartType] = useState<ChartType>('bar');
  const [monthlyChartType, setMonthlyChartType] = useState<ChartType>('pie');

  // Drill-down state
  const [drillDownData, setDrillDownData] = useState<DailySpendingDetail[] | null>(null);
  const [drillDownPeriod, setDrillDownPeriod] = useState<string | null>(null);

  // Calculate cumulative data for line charts
  const [cumulativeSpendingData, setCumulativeSpendingData] = useState<AggregatedSpendingData[]>([]);

  // State for Advanced Metrics Selection
  const [selectedAdvancedMetrics, setSelectedAdvancedMetrics] = useState<string[]>(() => {
    try {
      const savedSelection = localStorage.getItem(LOCALSTORAGE_METRICS_KEY);
      return savedSelection ? JSON.parse(savedSelection) : []; // Default to empty array
    } catch (error) {
      console.error("Error reading metrics selection from localStorage:", error);
      return [];
    }
  });

  // New state for Net Balance Tracker
  const [currentMonthSavings, setCurrentMonthSavings] = useState<number>(0);
  const [previousMonthSavings, setPreviousMonthSavings] = useState<number>(0);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
  const [userPercentile, setUserPercentile] = useState<number>(0);

  // Add state for spending comparison data
  const [spendingComparisonData, setSpendingComparisonData] = useState<SpendingComparisonData[]>([]);

  // Memoize filtered data to avoid recalculating on every render
  const filteredSpending = useMemo(() => {
      return rawSpendingData.filter(d => d.date >= startDate && d.date <= endDate);
  }, [rawSpendingData, startDate, endDate]);

  const filteredRepayment = useMemo(() => {
      return rawRepaymentData.filter(d => d.date >= startDate && d.date <= endDate);
  }, [rawRepaymentData, startDate, endDate]);

  // Memoize the data object passed to metric calculations
  const metricCalculationData = useMemo((): MetricCalculationData => ({
      filteredSpending,
      aggregatedRepayment: aggregatedRepaymentData, // Use the state here
      categoryData, // Use category state
      startDate,
      endDate,
  }), [filteredSpending, aggregatedRepaymentData, categoryData, startDate, endDate]);

  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label, coordinate }: any) => {
    if (active && payload && payload.length) {
      // Specific tooltip for heatmap
      if (payload[0].payload.dateString) { 
        const point = payload[0].payload as HeatmapDataPoint;
        return (
          <div className="custom-tooltip">
             {point.dateString}: ${point.amount.toLocaleString()}
          </div>
        );
      }
      
      // Existing tooltip logic
      const value = payload[0].value;
      const name = payload[0].name; 
      let displayValue = typeof value === 'number' ? `$${value.toLocaleString()}` : value;
      
      let text = `${label} : ${displayValue}`;
      if (name && payload.length > 1) {
         text = `${label}<br/>${payload.map((p: any) => `${p.name}: ${typeof p.value === 'number' ? p.value.toLocaleString() : p.value}`).join('<br/>')}`;
      } else if (name) {
         text = `${label}<br/>${name}: ${displayValue}`;
      }

      return (
        <div className="custom-tooltip" dangerouslySetInnerHTML={{ __html: text }}></div>
      );
    }
    return null;
  };

  // Generate Raw Fake Data (e.g., for the last year)
  useEffect(() => {
    setLoading(true);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const generatedSpending: SpendingData[] = [];
    const generatedRepayment: RepaymentData[] = [];

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      // Generate daily spending (make weekends potentially lower)
      const dayOfWeek = d.getDay();
      const baseAmount = (dayOfWeek === 0 || dayOfWeek === 6) ? 30 : 50;
      generatedSpending.push({
        date: new Date(d),
        amount: baseAmount + Math.floor(Math.random() * 100) 
      });

      // Generate daily repayment stats 
      if (Math.random() > 0.7) { 
         generatedRepayment.push({
           date: new Date(d),
           onTime: Math.random() > 0.2 ? Math.floor(Math.random() * 2) + 1 : 0, 
           late: Math.random() > 0.8 ? 1 : 0 
         });
      }
    }
    
    setRawSpendingData(generatedSpending);
    setRawRepaymentData(generatedRepayment);

    // Set initial category data 
     const demoCategoryData: CategoryData[] = [
       { name: 'Groceries', value: Math.floor(Math.random() * 1000) + 500 },
       { name: 'Housing', value: Math.floor(Math.random() * 1500) + 1000 },
       { name: 'Transport', value: Math.floor(Math.random() * 500) + 200 },
       { name: 'Utilities', value: Math.floor(Math.random() * 400) + 150 },
       { name: 'Entertainment', value: Math.floor(Math.random() * 300) + 100 }
     ];
     setCategoryData(demoCategoryData);

    // Set other metrics 
    setCreditUtilization(60 + Math.floor(Math.random() * 15)); 
    setAverageRepaymentTime(15 + Math.floor(Math.random() * 10)); 
    setTotalAdvances(applications?.length || 0); 

    // Net balance data will be calculated by updateNetBalanceFromComparison 
    // after spending comparison data is generated

    setLoading(false);
  }, [applications]); 

  // Aggregate data based on date range and period
  useEffect(() => {
    if (!rawSpendingData.length && !rawRepaymentData.length) return;

    // Use memoized filtered data
    if (!filteredSpending.length && !filteredRepayment.length && (startDate !== endDate)) {
       // If range is valid but no data, still proceed to set empty aggregates
       setAggregatedSpendingData([]);
       setAggregatedRepaymentData([]);
       setHeatmapData([]);
       setCumulativeSpendingData([]);
       // Update monthly breakdown based on the *last month* in the range
       updateMonthlyBreakdown(MONTHS[endDate.getMonth()]); 
       setDrillDownData(null); 
       return; // Skip aggregation if no data in range
    }

    setLoading(true); // May want finer-grained loading state later

    // Aggregate spending
    const spendingMap = new Map<string, number>();
    filteredSpending.forEach(item => {
      const key = formatDateKey(item.date, aggregationPeriod);
      spendingMap.set(key, (spendingMap.get(key) || 0) + item.amount);
    });
    const aggSpending: AggregatedSpendingData[] = Array.from(spendingMap, ([period, amount]) => ({ period, amount }));
    
    // Aggregate repayment 
    const repaymentMap = new Map<string, { onTime: number, late: number }>();
     filteredRepayment.forEach(item => {
       const key = formatDateKey(item.date, aggregationPeriod);
       const current = repaymentMap.get(key) || { onTime: 0, late: 0 };
       repaymentMap.set(key, {
         onTime: current.onTime + item.onTime,
         late: current.late + item.late
       });
     });
     const aggRepayment: AggregatedRepaymentData[] = Array.from(repaymentMap, ([period, data]) => ({ period, ...data }));

    // Sort aggregated data 
    aggSpending.sort((a, b) => a.period.localeCompare(b.period)); 
    aggRepayment.sort((a, b) => a.period.localeCompare(b.period));

    setAggregatedSpendingData(aggSpending);
    setAggregatedRepaymentData(aggRepayment); // Set state used by advanced metrics calculation

    // Process data for Heatmap
    const heatmapPoints: HeatmapDataPoint[] = filteredSpending.map(item => {
      return {
        week: getWeekOfYear(item.date),
        dayOfWeek: item.date.getDay(), // 0 = Sunday
        amount: item.amount,
        dateString: item.date.toISOString().split('T')[0]
      };
    });
    setHeatmapData(heatmapPoints);

    // Calculate cumulative spending
    let cumulativeAmount = 0;
    const cumulativeData = aggSpending.map(item => {
      cumulativeAmount += item.amount;
      return {
        period: item.period,
        amount: cumulativeAmount
      };
    });
    setCumulativeSpendingData(cumulativeData);
    
    // Generate spending comparison data
    generateSpendingComparisonData(aggSpending);
    
    // Update monthly breakdown based on the *last month* in the range
    updateMonthlyBreakdown(MONTHS[endDate.getMonth()]); 

    setLoading(false); 
    if(drillDownData) setDrillDownData(null); // Clear drill-down when underlying data changes

  }, [filteredSpending, filteredRepayment, startDate, endDate, aggregationPeriod]); // Depend on memoized filtered data

  // Generate spending comparison data
  const generateSpendingComparisonData = useCallback((spendingData: AggregatedSpendingData[]) => {
    // Filter to only get monthly data
    const monthlyData = spendingData.filter(item => {
      // Check if period format is like "Jan 2023"
      return /^[A-Za-z]{3} \d{4}$/.test(item.period);
    });

    // Get current month/year as string (e.g. "Jan 2023")
    const today = new Date();
    const currentMonthYear = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
    
    // Create comparison data with more dramatic variations
    const comparisonData: SpendingComparisonData[] = monthlyData.map((item, index) => {
      // Parse period string to Date for sorting
      const [month, year] = item.period.split(' ');
      const monthIndex = MONTHS.indexOf(month);
      const date = new Date(parseInt(year), monthIndex, 1);
      
      // Use a consistent seed for deterministic randomness
      const seed = month.charCodeAt(0) + monthIndex + parseInt(year);
      
      // Make April the qualifying month for Bree+ Free (special case)
      const isApril = month === 'Apr';
      
      let earnings: number;
      let spending: number = item.amount;
      let netEarnings: number;
      
      if (isApril) {
        // April: Just above threshold for Bree+ Free qualification
        earnings = spending + 120 + (seed % 30); // Ensure April is above threshold
        netEarnings = earnings - spending;
      } else {
        // Create a pattern for other months
        // 0: Heavily negative (spending far exceeds earnings)
        // 1: Moderately negative
        // 2: Slightly negative
        // 3: Close to threshold but below
        // 4: Comfortably above threshold (but make fewer months like this)
        const patternType = (month === 'Mar' || month === 'May') ? 3 : (index % 5); // Make months adjacent to April close to qualifying
        
        switch (patternType) {
          case 0: // Heavily negative months (spending far exceeds earnings)
            earnings = spending * 0.6 + (seed % 50); // 40% less than spending plus small variation
            netEarnings = earnings - spending; // Will be significantly negative
            break;
            
          case 1: // Moderately negative months
            earnings = spending * 0.8 + (seed % 40); // 20% less than spending plus small variation
            netEarnings = earnings - spending; // Will be moderately negative
            break;
            
          case 2: // Slightly below threshold
            earnings = spending + 50 + (seed % 40); // Close to spending plus small variation
            netEarnings = earnings - spending; // Will be positive but below threshold
            break;
            
          case 3: // Just barely below threshold (for months adjacent to April)
            earnings = spending + 80 + (seed % 15); // Just below threshold
            netEarnings = earnings - spending; // Will be just below 100
            break;
            
          case 4: // Comfortably above threshold
          default:
            earnings = spending + 180 + (seed % 100); // Well above threshold
            netEarnings = earnings - spending; // Will be well above 100
            break;
        }
      }
      
      // Ensure all values are properly rounded for display
      spending = Math.round(spending);
      earnings = Math.round(earnings);
      netEarnings = Math.round(earnings - spending); // Recalculate to ensure exact match
      
      // Premium eligibility is when net (earnings - spending) is at least $100
      return {
        period: item.period,
        spending: spending,
        earnings: earnings,
        netEarnings: netEarnings,
        isPremiumEligible: netEarnings >= 100,
        isCurrentMonth: item.period === currentMonthYear,
        date: date
      };
    });
    
    // Sort data chronologically
    comparisonData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Update Net Balance Tracker data based on this data
    updateNetBalanceFromComparison(comparisonData);
    
    setSpendingComparisonData(comparisonData);
  }, [MONTHS]);

  // Add a function to update Net Balance data from spending comparison data
  const updateNetBalanceFromComparison = (comparisonData: SpendingComparisonData[]) => {
    if (!comparisonData.length) return;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentMonthStr = `${MONTHS[currentMonth]} ${currentYear}`;
    
    // Find current month's data
    const currentMonthData = comparisonData.find(item => item.period === currentMonthStr);
    
    // Find previous month's data
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthStr = `${MONTHS[prevMonth]} ${prevYear}`;
    const prevMonthData = comparisonData.find(item => item.period === prevMonthStr);
    
    // Calculate lifetime savings (sum of all positive net earnings)
    const lifetimeSavingsValue = comparisonData
      .filter(item => item.netEarnings > 0)
      .reduce((sum, item) => sum + item.netEarnings, 0);
    
    // Update state with values from spending comparison data
    if (currentMonthData) {
      setCurrentMonthSavings(currentMonthData.netEarnings);
    }
    
    if (prevMonthData) {
      setPreviousMonthSavings(prevMonthData.netEarnings);
    }
    
    setLifetimeSavings(lifetimeSavingsValue);
    
    // Calculate how many months are eligible out of total
    const eligibleMonths = comparisonData.filter(item => item.isPremiumEligible).length;
    const percentile = Math.round((eligibleMonths / comparisonData.length) * 100);
    setUserPercentile(percentile);
  };

  // Update monthly breakdown 
  const updateMonthlyBreakdown = useCallback((monthKey: string) => { 
    const seed = monthKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0); 
    const randomFactor = (seed % 100) / 100; 

    const demoMonthlyBreakdown: MonthlyBreakdown[] = [
      { category: 'Groceries', amount: 800 + Math.floor(randomFactor * 300), percentage: 0 },
      { category: 'Housing', amount: 1300 + Math.floor(randomFactor * 400), percentage: 0 },
      { category: 'Transport', amount: 300 + Math.floor(randomFactor * 200), percentage: 0 },
      { category: 'Utilities', amount: 200 + Math.floor(randomFactor * 200), percentage: 0 },
      { category: 'Entertainment', amount: 100 + Math.floor(randomFactor * 200), percentage: 0 }
    ];
    
    const total = demoMonthlyBreakdown.reduce((sum, item) => sum + item.amount, 0);
    const withPercentages = demoMonthlyBreakdown.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.amount / total) * 100) : 0
    }));
    
    setMonthlyBreakdown(withPercentages);
  }, []);

  // Handle Date Range Change
  const handleDateChange = useCallback((dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start && end && start <= end) { // Add validation: start <= end
      setStartDate(start);
      setEndDate(end);
    } else if (start) { 
        setStartDate(start);
        // If only start is selected, maybe set end to start?
        // setEndDate(start); 
    }
  }, []);
  
  // Handle Aggregation Period Change
   const handleAggregationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
     setAggregationPeriod(e.target.value as AggregationPeriod);
   }, []);

  // Handle Drill Down Click
  const handleBarClick = useCallback((data: any, index: number) => {
    if (!data || !data.activePayload || !data.activePayload.length) {
      setDrillDownData(null);
      setDrillDownPeriod(null);
      return;
    }
    
    const clickedPeriod = data.activePayload[0].payload.period;
    setDrillDownPeriod(clickedPeriod);

    // Simulate fetching/filtering detailed data for the clicked period
    let detailedData: DailySpendingDetail[] = [];
    
    rawSpendingData.forEach(item => {
      let itemPeriodKey: string | null = null;
      try {
         // *** Important: Use the SAME aggregation period as the chart was based on ***
         itemPeriodKey = formatDateKey(item.date, aggregationPeriod); 
      } catch (e) { console.error("Error formatting date key:", e); }

      if (itemPeriodKey === clickedPeriod) {
        const descriptions = ["Coffee Shop", "Grocery Store", "Online Purchase", "Restaurant", "Gas Station", "Bill Payment"];
        detailedData.push({
          date: item.date.toISOString().split('T')[0],
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          amount: item.amount
        });
      }
    });

    detailedData.sort((a, b) => a.date.localeCompare(b.date));
    setDrillDownData(detailedData);

    const drillDownElement = document.getElementById('drill-down-section');
    drillDownElement?.scrollIntoView({ behavior: 'smooth' });
  }, [rawSpendingData, aggregationPeriod]);

  // Handle Toggling Advanced Metrics
  const handleMetricToggle = useCallback((metricKey: string, isChecked: boolean) => {
    const newSelection = isChecked
      ? [...selectedAdvancedMetrics, metricKey]
      : selectedAdvancedMetrics.filter(key => key !== metricKey);
      
    setSelectedAdvancedMetrics(newSelection);
    
    // Save to localStorage
    try {
      localStorage.setItem(LOCALSTORAGE_METRICS_KEY, JSON.stringify(newSelection));
    } catch (error) {
      console.error("Error saving metrics selection to localStorage:", error);
    }
  }, [selectedAdvancedMetrics]);

  // Render Spending Comparison Chart
  const renderSpendingComparisonChart = useCallback(() => {
    // Find the minimum and maximum values for better Y-axis scaling
    const allValues = spendingComparisonData.flatMap(item => [
      item.spending, 
      item.earnings, 
      item.netEarnings
    ]);
    const minValue = Math.min(...allValues, 0); // Include 0 as a minimum
    const maxValue = Math.max(...allValues, 150); // Make sure we show above the threshold
    
    // Find periods where user is below threshold
    const belowThresholdPeriods = spendingComparisonData
      .filter(item => item.netEarnings < 100)
      .map(item => item.period);
    
    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart 
          data={spendingComparisonData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }} // Added bottom margin for legend spacing
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis 
            tickFormatter={(value) => `$${value}`} 
            domain={[minValue < 0 ? minValue - 10 : 0, maxValue + 20]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} /> {/* Increased legend height */}
          
          {/* Premium threshold reference line - removed the label */}
          <ReferenceLine 
            y={100} 
            stroke="#4361ee" 
            strokeDasharray="5 5" 
            strokeWidth={2}
          />
          
          {/* Reference areas for below threshold periods */}
          {belowThresholdPeriods.map((period, i) => (
            <ReferenceArea 
              key={`below-threshold-${i}`}
              x1={period} 
              x2={period} 
              y1={0} 
              y2={100}
              strokeOpacity={0.3}
              fill="#f72585" 
              fillOpacity={0.1}
            />
          ))}
          
          <Line 
            type="monotone" 
            dataKey="spending" 
            name="Monthly Spending" 
            stroke="#f72585" 
            strokeWidth={2} 
            dot={(props) => {
              const { cx, cy, payload } = props;
              return payload.isCurrentMonth ? (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={6} 
                  fill="#f72585" 
                  stroke="#fff" 
                  strokeWidth={2} 
                />
              ) : (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={4} 
                  fill="#f72585" 
                />
              );
            }}
          />
          <Line 
            type="monotone" 
            dataKey="earnings" 
            name="Monthly Earnings" 
            stroke="#4cc9f0" 
            strokeWidth={2} 
            dot={(props) => {
              const { cx, cy, payload } = props;
              return payload.isCurrentMonth ? (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={6} 
                  fill="#4cc9f0" 
                  stroke="#fff" 
                  strokeWidth={2} 
                />
              ) : (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={4} 
                  fill="#4cc9f0" 
                />
              );
            }}
          />
          {/* Net Earnings line with special styling for below threshold points */}
          <Line 
            type="monotone" 
            dataKey="netEarnings" 
            name="Net Earnings" 
            stroke="#3a0ca3" 
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const isBelowThreshold = payload.netEarnings < 100;
              
              // For current month
              if (payload.isCurrentMonth) {
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={6} 
                    fill={isBelowThreshold ? "#f72585" : "#3a0ca3"}
                    stroke="#fff" 
                    strokeWidth={2} 
                  />
                );
              }
              
              // For other months
              return isBelowThreshold ? (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={5} 
                  fill="#f72585" 
                  stroke="#3a0ca3"
                  strokeWidth={1}
                />
              ) : (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={4} 
                  fill="#3a0ca3" 
                />
              );
            }}
          />
          
          {/* Manually add the Bree+ Free line to legend */}
          <Line 
            dataKey={() => null} // No actual data, just for legend
            name="Bree+ Free Threshold" 
            stroke="#4361ee" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            dot={false}
            activeDot={false}
            legendType="line"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }, [spendingComparisonData]);

  // Render chart based on selected type
  const renderSpendingChart = useCallback((): React.ReactElement => {
    const dataToUse = aggregatedSpendingData; 
    const cumulativeData = cumulativeSpendingData; 

    switch (spendingChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataToUse} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#4361ee" radius={[4, 4, 0, 0]} cursor="pointer" /> 
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataToUse} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="amount" stroke="#4361ee" strokeWidth={2} activeDot={{ r: 8, style: { cursor: 'pointer' } }}/>
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dataToUse} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#4361ee" fill="#4361ee" fillOpacity={0.3} activeDot={{ r: 6, style: { cursor: 'pointer' } }}/>
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dataToUse} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="amount" yAxisId="left" barSize={20} fill="#4361ee" name="Spending" cursor="pointer" />
              <Line type="monotone" yAxisId="right" data={cumulativeData} dataKey="amount" stroke="#ff7300" name="Cumulative" strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'heatmap':
          // Calculate domain for heatmap color scale
          const amounts = heatmapData.map(p => p.amount);
          const minAmount = Math.min(...amounts, 0);
          const maxAmount = Math.max(...amounts, 1); // Ensure max is at least 1
          const weekDomain = [Math.min(...heatmapData.map(d => d.week)), Math.max(...heatmapData.map(d => d.week))];

          return (
            <ResponsiveContainer width="100%" height={200}> 
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="week" 
                  name="Week" 
                  domain={['dataMin - 1', 'dataMax + 1']} // Add padding to week axis
                  tickFormatter={(weekNum) => `W${weekNum}`}
                  interval={0} // Show all ticks potentially
                  angle={-30} // Angle ticks if needed
                  dx={-5}     // Adjust position
                  dy={10}
                  tickCount={15} // Limit tick count
                  allowDuplicatedCategory={false} // Avoid duplicate week labels
                />
                <YAxis 
                  type="number" 
                  dataKey="dayOfWeek"
                  name="Day" 
                  domain={[-1, 7]} // Pad domain for better spacing
                  tickFormatter={(dayNum) => DAYS_OF_WEEK[dayNum] || ''} 
                  ticks={[0, 1, 2, 3, 4, 5, 6]} // Explicitly set ticks
                  interval={0}
                />
                <ZAxis 
                  type="number" 
                  dataKey="amount" 
                  name="Spending"
                  domain={[minAmount, maxAmount]} 
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Daily Spending" data={heatmapData} shape="square">
                    {heatmapData.map((entry, index) => {
                      // Determine fill color based on amount and ZAxis range/colors
                      const ratio = maxAmount > minAmount ? (entry.amount - minAmount) / (maxAmount - minAmount) : 0;
                      const colorIndex = Math.min(HEATMAP_COLORS.length - 1, Math.floor(ratio * HEATMAP_COLORS.length));
                      const fillColor = HEATMAP_COLORS[colorIndex];
                      return <Cell key={`cell-${index}`} fill={fillColor} />;
                    })}
                </Scatter>
                 {/* Optional: Add Legend for heatmap colors */}
                 <Legend 
                   verticalAlign="bottom" 
                   layout="horizontal"
                   align="center"
                   payload={HEATMAP_COLORS.map((color, index) => ({
                     value: `Level ${index + 1}`,
                     type: 'square',
                     color: color,
                   }))}
                 />
              </ScatterChart>
            </ResponsiveContainer>
          );
      default: 
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataToUse} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#4361ee" cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  }, [aggregatedSpendingData, cumulativeSpendingData, heatmapData, spendingChartType, handleBarClick]);
  
  const renderCategoryChart = useCallback((): React.ReactElement => {
    switch (categoryChartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 20, right: 30, left: 90, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      default: 
        return renderCategoryChart();
    }
  }, [categoryData, categoryChartType]);
  
  const renderRepaymentChart = useCallback((): React.ReactElement => {
    switch (repaymentChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregatedRepaymentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis allowDecimals={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Legend />
              <Bar dataKey="onTime" name="On-time" stackId="a" fill="#4cc9f0" />
              <Bar dataKey="late" name="Late" stackId="a" fill="#f72585" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={aggregatedRepaymentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis allowDecimals={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Legend />
              <Line type="monotone" dataKey="onTime" name="On-time" stroke="#4cc9f0" strokeWidth={2} />
              <Line type="monotone" dataKey="late" name="Late" stroke="#f72585" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={aggregatedRepaymentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis allowDecimals={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Legend />
              <Area type="monotone" dataKey="onTime" name="On-time" stackId="1" stroke="#4cc9f0" fill="#4cc9f0" fillOpacity={0.6} />
              <Area type="monotone" dataKey="late" name="Late" stackId="1" stroke="#f72585" fill="#f72585" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );
      default: 
        return renderRepaymentChart();
    }
  }, [aggregatedRepaymentData, repaymentChartType]);
  
  const renderMonthlyChart = useCallback((): React.ReactElement => {
    switch (monthlyChartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={monthlyBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="amount">
                {monthlyBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}> 
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="category" width={80} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {monthlyBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      default: 
        return renderMonthlyChart();
    }
  }, [monthlyBreakdown, monthlyChartType]);

  if (loading && (!aggregatedSpendingData.length || !aggregatedRepaymentData.length || !heatmapData.length)) {
    return <div className="loading">Loading insights...</div>;
  }

  return (
    <div className="insights-page">
      <h1>Financial Insights</h1>
      <p className="subtitle">Track your financial performance and spending patterns</p>
      
      {/* Date Range Selector */}
       <div className="card date-range-card">
         <div className="date-range-controls">
           <div className="date-picker-container">
             <label htmlFor="date-range">Select Date Range:</label>
             <DatePicker
               selectsRange={true}
               startDate={startDate}
               endDate={endDate}
               onChange={handleDateChange}
               isClearable={false} 
               maxDate={new Date()} 
               dateFormat="yyyy/MM/dd"
               className="date-picker-input" 
               wrapperClassName="date-picker-wrapper"
             />
           </div>
           <div className="aggregation-selector-container">
             <label htmlFor="aggregation-period">Aggregate Charts By:</label>
             <select 
               id="aggregation-period" 
               value={aggregationPeriod} 
               onChange={handleAggregationChange}
               className="aggregation-dropdown"
               disabled={spendingChartType === 'heatmap'} // Disable aggregation for heatmap
             >
               <option value="monthly">Monthly</option>
               <option value="weekly">Weekly</option>
               <option value="daily">Daily</option>
             </select>
           </div>
         </div>
         <p className="selected-range-label">Showing data for: {getDateRangeLabel(startDate, endDate)}</p>
       </div>

      {/* Key metrics cards */}
      <div className="insights-grid">
        <div className="card metric-card" style={{ 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div className="card-title">Current Bree+ Eligibility</div>
          {spendingComparisonData.length > 0 && spendingComparisonData.find(item => item.isCurrentMonth)?.isPremiumEligible ? (
            <>
              <div className="metric-value">
                ${Math.max(0, (spendingComparisonData.find(item => item.isCurrentMonth)?.netEarnings || 0) - 100)}
              </div>
              <div className="card-subtitle">
                <span className="threshold-status positive">
                  above Bree+ Free threshold
                </span>
                <div className="benefits-info">
                  You're eligible for a 20% larger Advance Payment and a longer repayment period of 60 days
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="metric-value">
                ${Math.abs(100 - (spendingComparisonData.find(item => item.isCurrentMonth)?.netEarnings || 0))}
              </div>
              <div className="card-subtitle">
                <span className="threshold-status negative">
                  away from Bree+ Free
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="card metric-card">
          <div className="card-title">📈 Net Balance Tracker</div>
          <div className="net-balance-content">
            <div className="savings-row">
              <span className="savings-label">Monthly net earnings:</span>
              <span className="savings-value">
                {currentMonthSavings >= 0 
                  ? `You saved $${currentMonthSavings.toFixed(2)} this month` 
                  : `You spent $${Math.abs(currentMonthSavings).toFixed(2)} more than you earned`
                }
                {currentMonthSavings > previousMonthSavings ? 
                  <span className="savings-delta positive">(+${(currentMonthSavings - previousMonthSavings).toFixed(0)} from last month)</span> : 
                  <span className="savings-delta negative">(-${(previousMonthSavings - currentMonthSavings).toFixed(0)} from last month)</span>
                }
              </span>
            </div>
            <div className="savings-row">
              <span className="savings-label">Lifetime net earnings:</span>
              <span className="savings-value">${lifetimeSavings.toFixed(2)}</span>
            </div>
            <div className="percentile-badge">
              You're eligible for Bree+ Free in {userPercentile}% of months
            </div>
          </div>
        </div>
      </div>
      
      {/* Spending Comparison Chart - Moved to top of charts section */}
      <div className="card mt-4">
        <div className="chart-header">
          <h2>Spending vs Earnings</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => {
                const exportData = spendingComparisonData.map(item => ({
                  period: item.period,
                  spending: item.spending,
                  earnings: item.earnings,
                  netEarnings: item.netEarnings,
                  premiumEligible: item.isPremiumEligible ? 'Yes' : 'No'
                }));
                downloadCSV(exportData, `spending-earnings-comparison-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`);
              }} 
              style={{ padding: '5px 10px' }} 
              disabled={!spendingComparisonData || spendingComparisonData.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="chart-container">
          {renderSpendingComparisonChart()}
          <p className="chart-hint" style={{ marginTop: '16px' }}>
            The horizontal line at $100 shows the Bree+ Free premium threshold. 
            When your spending (red) approaches or exceeds your earnings (blue), your Net Earnings (purple) 
            fall below this threshold (highlighted in red areas), and you lose free premium eligibility.
          </p>
        </div>
      </div>
      
      {/* Drill Down Section */}
      {drillDownData && drillDownPeriod && (
        <div id="drill-down-section" className="card mt-4 drill-down-card">
          <h2>Spending Details for {drillDownPeriod}</h2>
          {drillDownData.length > 0 ? (
            <table className="drill-down-table">
              <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                {drillDownData.map((item, index) => (
                  <tr key={index}><td>{item.date}</td><td>{item.description}</td><td>${item.amount.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No detailed spending data available for this period.</p>
          )}
           <button onClick={() => { setDrillDownData(null); setDrillDownPeriod(null); }} className="close-drilldown-btn">Close Details</button>
        </div>
      )}

      {/* Remaining Charts Section */}
      <div className="charts-section">
        {/* Category Chart */}
        <div className="card mt-4">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Spending by Category</h2>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="chart-controls">
                  <label htmlFor="category-chart-type">Chart Type: </label>
                  <select id="category-chart-type" value={categoryChartType} onChange={(e) => setCategoryChartType(e.target.value as ChartType)} className="chart-type-dropdown">
                    <option value="pie">Pie Chart</option>
                    <option value="bar">Bar Chart</option>
                  </select>
                </div>
                 <button 
                    onClick={() => downloadCSV(categoryData, `category-spending-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`)} 
                    style={{ padding: '5px 10px' }} 
                    disabled={!categoryData || categoryData.length === 0}
                >
                     Export CSV
                 </button>
             </div>
          </div>
           <p className="chart-hint">(Categories shown for the entire selected period)</p>
          <div className="chart-container">
            {renderCategoryChart()}
          </div>
        </div>
        
        {/* Repayment Performance Chart */}
        <div className="card mt-4">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Repayment Performance {`(by ${aggregationPeriod.replace('ly', '')})`}</h2>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="chart-controls">
                  <label htmlFor="repayment-chart-type">Chart Type: </label>
                  <select id="repayment-chart-type" value={repaymentChartType} onChange={(e) => setRepaymentChartType(e.target.value as ChartType)} className="chart-type-dropdown">
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                  </select>
                </div>
                 <button 
                    onClick={() => downloadCSV(aggregatedRepaymentData, `repayment-performance-${aggregationPeriod}-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`)} 
                    style={{ padding: '5px 10px' }} 
                    disabled={!aggregatedRepaymentData || aggregatedRepaymentData.length === 0}
                 >
                     Export CSV
                 </button>
             </div>
          </div>
          <div className="chart-container">
            {renderRepaymentChart()}
          </div>
        </div>
      </div>
      
      {/* Monthly Spending Breakdown Section */}
      <div className="card mt-5">
        <div className="monthly-breakdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h2>Breakdown for {MONTHS[endDate.getMonth()]} {endDate.getFullYear()}</h2> 
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div className="chart-controls"> 
                 <label htmlFor="monthly-chart-type">Chart Type: </label>
                 <select id="monthly-chart-type" value={monthlyChartType} onChange={(e) => setMonthlyChartType(e.target.value as ChartType)} className="chart-type-dropdown">
                   <option value="pie">Donut Chart</option>
                   <option value="bar">Bar Chart</option>
                 </select>
               </div>
                {monthlyBreakdown.length > 0 && (
                    <button 
                        onClick={() => downloadCSV(monthlyBreakdown, `monthly-breakdown-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`)} 
                        style={{ padding: '5px 10px' }}
                    >
                        Export CSV
                    </button>
                )}
            </div>
        </div>
        
        <div className="monthly-breakdown-content">
          <div className="monthly-charts">
            <div className="monthly-pie-chart"> 
               {renderMonthlyChart()}
            </div>
            
            <div className="monthly-breakdown-table">
              <table className="breakdown-table">
                <thead><tr><th>Category</th><th>Amount</th><th>Percentage</th></tr></thead>
                <tbody>
                  {monthlyBreakdown.map((item, index) => (
                    <tr key={index}><td><span className="category-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>{item.category}</td><td>${item.amount.toLocaleString()}</td><td>{item.percentage}%</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td><strong>Total</strong></td><td><strong>${monthlyBreakdown.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</strong></td><td>{monthlyBreakdown.reduce((sum, item) => sum + item.percentage, 0) > 0 ? '100%' : '0%'}</td></tr></tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- Advanced Metrics Section --- */}
      {selectedAdvancedMetrics.length > 0 && (
          <div className="advanced-metrics-section mt-5">
              <h2>Advanced Metrics</h2>
              <div className="insights-grid advanced-metrics-grid">
                  {availableAdvancedMetrics
                      .filter(metric => selectedAdvancedMetrics.includes(metric.key))
                      .map(metric => {
                          const value = metric.calculate(metricCalculationData);
                          let displayValue = metric.format(value);

                          // Special formatting for highestSpendingCategory to include the name
                          if (metric.key === 'highestSpendingCategory' && value !== null) {
                             const category = categoryData.find((c: CategoryData) => c.value === value);
                             displayValue = `${category?.name || 'Unknown'}: ${metric.format(value)}`;
                          }

                          return (
                              <div key={metric.key} className="card metric-card advanced-metric-card">
                                  <div className="card-title">{metric.name}</div>
                                  <div className="metric-value">{displayValue}</div> 
                                  <div className="card-subtitle">{metric.description}</div>
                              </div>
                          );
                      })}
              </div>
          </div>
      )}

       {/* --- Metric Customization Panel --- */}
       <div className="card mt-5 metric-settings-panel">
           <h2>Customize Advanced Metrics</h2>
           <p>Select the advanced metrics you want to display:</p>
           <div className="metric-checkbox-group">
               {availableAdvancedMetrics.map(metric => (
                   <div key={metric.key} className="checkbox-item">
                       <input
                           type="checkbox"
                           id={`metric-${metric.key}`}
                           checked={selectedAdvancedMetrics.includes(metric.key)}
                           onChange={(e) => handleMetricToggle(metric.key, e.target.checked)}
                       />
                       <label htmlFor={`metric-${metric.key}`}>
                           <strong>{metric.name}</strong>: {metric.description}
                       </label>
                   </div>
               ))}
           </div>
       </div>

      {/* Financial Tips */}
      <div className="card mt-4">
        <h2>Personalized Tips</h2>
        <ul className="tips-list">
          <li><span className="tip-icon">💡</span><div><h4>Optimize Your Credit Utilization</h4><p>Keeping your utilization below 70% can help maintain financial flexibility.</p></div></li>
          <li><span className="tip-icon">⏱️</span><div><h4>Early Repayments</h4><p>Repaying advances earlier can improve your repayment score and may qualify you for higher limits.</p></div></li>
          <li><span className="tip-icon">📊</span><div><h4>Consistent Usage</h4><p>Regular and responsible use of cash advances can help build a stronger financial profile.</p></div></li>
        </ul>
      </div>
    </div>
  );
};

export default Insights; 