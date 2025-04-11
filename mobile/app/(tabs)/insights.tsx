import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Assuming context setup exists similar to frontend
// import { useAuth } from '@/context/AuthContext'; 
// import { useApplication } from '@/context/ApplicationContext';

// --- D3 and SVG Imports ---
import * as d3 from 'd3';
import Svg, { G, Rect, Line, Text as SvgText, Path, Circle } from 'react-native-svg'; // Use SvgText to avoid conflict

// --- Import Shared Types ---
import type { 
    SpendingData,
    AggregatedSpendingData,
    CategoryData,
    MonthlyBreakdown,
    RepaymentData,
    AggregatedRepaymentData,
    DailySpendingDetail,
    HeatmapDataPoint,
    MetricCalculationData,
    SpendingComparisonDataPoint
} from '@/types/chartTypes'; // Use alias path

// --- Import Components ---
import SpendingComparisonChart from '@/components/SpendingComparisonChart';
import SpendingTrendsChart from '@/components/charts/SpendingTrendsChart';
import CategoryChart from '../../components/charts/CategoryChart';
import RepaymentChart from '../../components/charts/RepaymentChart';
import MonthlyBreakdownChart from '../../components/charts/MonthlyBreakdownChart';

// Define types locally for now
type InsightsChartType = 'bar' | 'line' | 'pie' | 'area' | 'composed' | 'heatmap';
type AggregationPeriod = 'monthly' | 'weekly' | 'daily';

interface AdvancedMetricDefinition {
  key: string;
  name: string;
  description: string;
  calculate: (data: MetricCalculationData) => number | null | string; // Allow string for named results
  format: (value: number | null | string) => string;
}

// Constants 
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
const HEATMAP_COLORS = ['#cce5ff', '#99caff', '#66b0ff', '#3395ff', '#007bff'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LOCALSTORAGE_METRICS_KEY = 'insightsAdvancedMetricsSelectionMobile';

// Helper Functions 
const getWeekOfYear = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24)) / 7);
};

const formatDateKey = (date: Date, period: AggregationPeriod): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  switch (period) {
    case 'daily': return date.toISOString().split('T')[0];
    case 'weekly': 
      const dayOfWeek = date.getDay();
      const startOfWeek = new Date(date); 
      startOfWeek.setDate(day - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      return `${startOfWeek.getFullYear()}-W${getWeekOfYear(startOfWeek).toString().padStart(2, '0')}`;
    case 'monthly': default: return `${MONTHS[month]} ${year}`;
  }
};

const getDateRangeLabel = (start: Date, end: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
};

// Helper to calculate date differences
const diffInDays = (d1: Date, d2: Date): number => Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
const diffInWeeks = (d1: Date, d2: Date): number => {
    const startWeek = getWeekOfYear(d1);
    const startYear = d1.getFullYear();
    const endWeek = getWeekOfYear(d2);
    const endYear = d2.getFullYear();
    // Rough calculation, can be refined
    if (endYear === startYear) return endWeek - startWeek + 1;
    const weeksInStartYear = 52 - startWeek + 1; // Assuming 52 weeks/year
    const weeksInEndYear = endWeek;
    const weeksInBetween = (endYear - startYear - 1) * 52;
    return weeksInStartYear + weeksInBetween + weeksInEndYear;
};
const diffInMonths = (d1: Date, d2: Date): number => {
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 1 : months + 1; // At least 1 month
};

// Advanced Metrics Definitions
const availableAdvancedMetrics: AdvancedMetricDefinition[] = [
    {
      key: 'avgTransactionValue', name: 'Avg. Daily Spending', description: 'Avg daily spend in period.',
      calculate: ({ filteredSpending, startDate, endDate }: MetricCalculationData) => {
        if (!filteredSpending?.length) return null;
        const total = filteredSpending.reduce((s: number, i: SpendingData) => s + i.amount, 0);
        const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000*60*60*24)) + 1;
        return diffDays > 0 ? total / diffDays : null;
      },
      format: (v) => typeof v === 'number' ? `$${v.toFixed(2)}` : 'N/A',
    },
    {
      key: 'highestSpendingCategory', name: 'Top Category', description: 'Category with most spending.',
      calculate: ({ categoryData }: MetricCalculationData) => categoryData?.length ? categoryData.reduce((m: CategoryData, i: CategoryData) => i.value > m.value ? i : m, categoryData[0])?.name : null,
      format: (v) => v ? `${v}` : 'N/A',
    },
    {
      key: 'highestSpendingAmount', name: 'Top Category Amt', description: 'Amount in top category.',
      calculate: ({ categoryData }: MetricCalculationData) => categoryData?.length ? categoryData.reduce((m: CategoryData, i: CategoryData) => i.value > m.value ? i : m, categoryData[0])?.value : null,
      format: (v) => typeof v === 'number' ? `$${v.toLocaleString()}` : 'N/A',
    },
    {
      key: 'latePaymentCount', name: 'Late Payments', description: 'Total late payments.',
      calculate: ({ aggregatedRepayment }: MetricCalculationData) => aggregatedRepayment ? aggregatedRepayment.reduce((s: number, i: AggregatedRepaymentData) => s + i.late, 0) : null,
      format: (v) => v !== null ? `${v}` : 'N/A',
    },
    {
       key: 'onTimeRepaymentRate', name: 'On-Time Rate', description: '% on-time repayments.',
       calculate: ({ aggregatedRepayment }: MetricCalculationData) => {
         if (!aggregatedRepayment) return null;
         const onTime = aggregatedRepayment.reduce((s: number, i: AggregatedRepaymentData) => s + i.onTime, 0);
         const late = aggregatedRepayment.reduce((s: number, i: AggregatedRepaymentData) => s + i.late, 0);
         const total = onTime + late;
         return total > 0 ? (onTime / total) * 100 : null;
       },
       format: (v) => typeof v === 'number' ? `${v.toFixed(1)}%` : 'N/A',
     },
];

// --- Chart Type Options for Dropdowns ---
const spendingChartTypeOptions = [
    { label: 'Bar', value: 'bar' },
    { label: 'Line', value: 'line' },
    { label: 'Area', value: 'area' },
    { label: 'Composed', value: 'composed' },
    // { label: 'Heatmap', value: 'heatmap' } // If heatmap is added to SpendingTrendsChart
];

const categoryChartTypeOptions = [
    { label: 'Donut', value: 'pie' }, // Use 'pie' as value internally
    { label: 'Bar', value: 'bar' },
];

const repaymentChartTypeOptions = [
    { label: 'Bar', value: 'bar' },
    { label: 'Line', value: 'line' },
    { label: 'Area', value: 'area' },
];

const monthlyChartTypeOptions = [
    { label: 'Donut', value: 'pie' },
    { label: 'Bar', value: 'bar' },
];

const Insights = () => {
  // State variables 
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [rawSpendingData, setRawSpendingData] = useState<SpendingData[]>([]);
  const [rawRepaymentData, setRawRepaymentData] = useState<RepaymentData[]>([]);
  const [aggregatedSpendingData, setAggregatedSpendingData] = useState<AggregatedSpendingData[]>([]);
  const [aggregatedRepaymentData, setAggregatedRepaymentData] = useState<AggregatedRepaymentData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [cumulativeSpendingData, setCumulativeSpendingData] = useState<AggregatedSpendingData[]>([]);
  const [comparisonData, setComparisonData] = useState<SpendingComparisonDataPoint[]>([]);
  const [totalAdvances, setTotalAdvances] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date>(new Date(2025, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<false | 'start' | 'end'>(false);
  const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod>('monthly');
  const [spendingChartType, setSpendingChartType] = useState<InsightsChartType>('bar');
  const [categoryChartType, setCategoryChartType] = useState<InsightsChartType>('pie');
  const [repaymentChartType, setRepaymentChartType] = useState<InsightsChartType>('bar');
  const [monthlyChartType, setMonthlyChartType] = useState<InsightsChartType>('pie');
  const [drillDownData, setDrillDownData] = useState<DailySpendingDetail[] | null>(null);
  const [drillDownPeriod, setDrillDownPeriod] = useState<string | null>(null);
  const [selectedAdvancedMetrics, setSelectedAdvancedMetrics] = useState<string[]>([]);

   // Data Fetching (Mock)
   const fetchData = useCallback(async () => {
    console.log("Fetching insights data...");
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const today = new Date(); const oneYearAgo = new Date(); oneYearAgo.setFullYear(today.getFullYear() - 1);
    const genSpend: SpendingData[] = []; const genRepay: RepaymentData[] = [];
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const day = d.getDay(); const amt = (day === 0 || day === 6) ? 30 : 50;
      genSpend.push({ date: new Date(d), amount: amt + Math.floor(Math.random() * 100), category: ['Groc','Util','Transp'][Math.floor(Math.random()*3)] });
      if (Math.random() > 0.7) { genRepay.push({ date: new Date(d), onTime: Math.random() > 0.2 ? Math.floor(Math.random() * 2) + 1 : 0, late: Math.random() > 0.8 ? 1 : 0 }); }
    }
    const demoCat: CategoryData[] = [{ n:'Groc', v:500+Math.random()*1000 }, { n:'Housing', v:1000+Math.random()*1500 }, { n:'Transp', v:200+Math.random()*500 }, { n:'Util', v:150+Math.random()*400 }, { n:'Ent', v:100+Math.random()*300 }].map(o => ({ name: o.n, value: Math.floor(o.v) }));
    
    // Mock Comparison Data Generation
    const mockComparison: SpendingComparisonDataPoint[] = [
        { category: 'Groc', currentAmount: 450, previousAmount: 400 },
        { category: 'Housing', currentAmount: 1200, previousAmount: 1150 },
        { category: 'Transp', currentAmount: 250, previousAmount: 300 },
        { category: 'Util', currentAmount: 180, previousAmount: 160 },
        { category: 'Ent', currentAmount: 120, previousAmount: 150 },
    ];
    setComparisonData(mockComparison);

    setRawSpendingData(genSpend); setRawRepaymentData(genRepay); setCategoryData(demoCat); setTotalAdvances(Math.floor(Math.random() * 20));
    setLoading(false); setInitialLoad(false);
    console.log("Finished fetching insights data.");
  }, []);

  // Initial Load Effect
  useEffect(() => {
    fetchData();
    const loadSelectedMetrics = async () => {
      try { const saved = await AsyncStorage.getItem(LOCALSTORAGE_METRICS_KEY); setSelectedAdvancedMetrics(saved ? JSON.parse(saved) : ['avgTransactionValue', 'onTimeRepaymentRate']); }
      catch (e) { console.error("Err metrics:", e); setSelectedAdvancedMetrics(['avgTransactionValue', 'onTimeRepaymentRate']); }
    };
    loadSelectedMetrics();
  }, [fetchData]);

  // Memoized Filters
  const filteredSpending = useMemo(() => rawSpendingData.filter(d => d.date >= startDate && d.date <= endDate), [rawSpendingData, startDate, endDate]);
  const filteredRepayment = useMemo(() => rawRepaymentData.filter(d => d.date >= startDate && d.date <= endDate), [rawRepaymentData, startDate, endDate]);

  // Data Aggregation Effect
  useEffect(() => {
    if (initialLoad || !rawSpendingData.length) return;
    setLoading(true);
    const spendMap = new Map<string, number>(); filteredSpending.forEach(i => { const k = formatDateKey(i.date, aggregationPeriod); spendMap.set(k, (spendMap.get(k) || 0) + i.amount); });
    const aggSpend: AggregatedSpendingData[] = Array.from(spendMap, ([p, a]) => ({ period:p, amount:a })).sort((a, b) => a.period.localeCompare(b.period));
    const repayMap = new Map<string, { onTime: number, late: number }>(); filteredRepayment.forEach(i => { const k = formatDateKey(i.date, aggregationPeriod); const c = repayMap.get(k) || { onTime: 0, late: 0 }; repayMap.set(k, { onTime: c.onTime + i.onTime, late: c.late + i.late }); });
    const aggRepay: AggregatedRepaymentData[] = Array.from(repayMap, ([p, d]) => ({ period:p, ...d })).sort((a, b) => a.period.localeCompare(b.period));
    const heatPts: HeatmapDataPoint[] = filteredSpending.map(i => ({ week: getWeekOfYear(i.date), dayOfWeek: i.date.getDay(), amount: i.amount, dateString: i.date.toISOString().split('T')[0] }));
    let cumAmt = 0; const cumData = aggSpend.map(i => { cumAmt += i.amount; return { period: i.period, amount: cumAmt }; });
    setAggregatedSpendingData(aggSpend); setAggregatedRepaymentData(aggRepay); setHeatmapData(heatPts); setCumulativeSpendingData(cumData);
    if (endDate instanceof Date && !isNaN(endDate.valueOf())) { updateMonthlyBreakdown(MONTHS[endDate.getMonth()]); }
    if(drillDownData) setDrillDownData(null); if(drillDownPeriod) setDrillDownPeriod(null);
    setLoading(false);
  }, [filteredSpending, filteredRepayment, aggregationPeriod, initialLoad, rawSpendingData.length, endDate]); 

  // Update Monthly Breakdown
  const updateMonthlyBreakdown = useCallback((monthKey: string) => {
    const seed = monthKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0); const r = (seed % 100) / 100;
    const demo: Omit<MonthlyBreakdown, 'percentage'>[] = [{ c:'Groceries', a:800+r*300 }, { c:'Housing', a:1300+r*400 }, { c:'Transport', a:300+r*200 }, { c:'Utilities', a:200+r*200 }, { c:'Entertainment', a:100+r*200 }].map(o => ({ category: o.c, amount: Math.floor(o.a) }));
    const total = demo.reduce((s, i) => s + i.amount, 0);
    const final: MonthlyBreakdown[] = demo.map(i => ({ ...i, percentage: total > 0 ? Math.round((i.amount / total) * 100) : 0 }));
    setMonthlyBreakdown(final);
  }, []); 

  // Event Handlers
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
        if (showDatePicker === 'start') { setStartDate(selectedDate > endDate ? endDate : selectedDate); }
        else if (showDatePicker === 'end') { setEndDate(selectedDate < startDate ? startDate : selectedDate); }
    }
  };
  const handleAggregationChange = (value: AggregationPeriod) => { setAggregationPeriod(value); };
  const handleChartTypeChange = (chart: keyof typeof chartTypeSetters, type: InsightsChartType) => { chartTypeSetters[chart](type); };
  const chartTypeSetters: Record<string, React.Dispatch<React.SetStateAction<InsightsChartType>>> = { spending: setSpendingChartType, category: setCategoryChartType, repayment: setRepaymentChartType, monthly: setMonthlyChartType };
  const handleBarClick = useCallback((/* datum */) => {
    console.log("Bar click - needs implementation");
    const clickedPeriod = "placeholder"; 
    if (!clickedPeriod || aggregationPeriod === 'daily') { setDrillDownData(null); setDrillDownPeriod(null); return; }
    setDrillDownPeriod(clickedPeriod);
    let details: DailySpendingDetail[] = [];
    rawSpendingData.forEach(item => {
      let key: string | null = null; try { key = formatDateKey(item.date, aggregationPeriod); } catch (e) { console.error("Err key:", e); }
      if (key === clickedPeriod) {
        const desc = ["Coffee", "Groceries", "Online", "Restaurant", "Gas", "Bill"];
        details.push({ date: item.date.toISOString().split('T')[0], description: desc[Math.floor(Math.random() * desc.length)], amount: item.amount });
      }
    });
    setDrillDownData(details.sort((a, b) => a.date.localeCompare(b.date)));
    console.log("Drill down:", details);
  }, [rawSpendingData, aggregationPeriod]);
  const handleMetricToggle = useCallback(async (metricKey: string) => {
    const newSelection = selectedAdvancedMetrics.includes(metricKey) ? selectedAdvancedMetrics.filter(k => k !== metricKey) : [...selectedAdvancedMetrics, metricKey];
    setSelectedAdvancedMetrics(newSelection);
    try { await AsyncStorage.setItem(LOCALSTORAGE_METRICS_KEY, JSON.stringify(newSelection)); } catch (e) { console.error("Err save metric:", e); }
  }, [selectedAdvancedMetrics]);

  // Memoized metric data
   const metricCalculationData = useMemo((): MetricCalculationData => ({
       filteredSpending, aggregatedRepayment: aggregatedRepaymentData, categoryData, startDate, endDate,
   }), [filteredSpending, aggregatedRepaymentData, categoryData, startDate, endDate]);

  // --- Calculate Key Metrics Values ---
  const totalSpending = useMemo(() => 
      filteredSpending.reduce((s, i) => s + i.amount, 0),
      [filteredSpending]
  );

  const avgSpendingMetric = useMemo(() => {
      let label = "Avg. Spend";
      let numPeriods = 1;
      let avg = 0;

      if (startDate && endDate) {
          switch (aggregationPeriod) {
              case 'daily':
                  label = "Avg. Daily Spend";
                  numPeriods = diffInDays(startDate, endDate);
                  break;
              case 'weekly':
                  label = "Avg. Weekly Spend";
                  numPeriods = diffInWeeks(startDate, endDate);
                  break;
              case 'monthly':
              default:
                  label = "Avg. Monthly Spend";
                  numPeriods = diffInMonths(startDate, endDate);
                  break;
          }
      }
      avg = numPeriods > 0 ? totalSpending / numPeriods : 0;
      return { 
          label,
          value: `$${avg.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
          subtitle: `per ${aggregationPeriod.replace('ly', '')} in period`
      };
  }, [totalSpending, aggregationPeriod, startDate, endDate]);

  // --- Main Render ---
  if (initialLoad) { 
      return (
        <View style={styles.loadingContainer}> 
          <ActivityIndicator size="large" color="#0000ff" /> 
          <Text>Loading initial insights...</Text> 
        </View>
      );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.header}>Financial Insights</Text>
      <Text style={styles.subtitle}>Track your financial performance and spending patterns</Text>

      {/* Date Range Selector Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Period</Text>
        <View style={styles.dateRangeControls}>
          <TouchableOpacity onPress={() => setShowDatePicker('start')} style={styles.dateButton}><Text style={styles.dateButtonText}>Start: {startDate.toLocaleDateString()}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker('end')} style={styles.dateButton}><Text style={styles.dateButtonText}>End: {endDate.toLocaleDateString()}</Text></TouchableOpacity>
        </View>
        {showDatePicker && (
            <DateTimePicker testID="dateTimePicker" value={showDatePicker === 'start' ? startDate : endDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} maximumDate={new Date()} minimumDate={showDatePicker === 'end' ? startDate : undefined} />
        )}
        <Text style={styles.selectedRangeLabel}>Showing data for: {getDateRangeLabel(startDate, endDate)}</Text>
         <View style={styles.pickerContainer}>
           <Text style={styles.label}>Aggregate Charts By:</Text>
           <View style={styles.aggregationSelector}>
               {( ['daily', 'weekly', 'monthly'] as const ).map(period => (
                  <TouchableOpacity 
                       key={period}
                       style={[styles.aggButton, aggregationPeriod === period && styles.aggButtonActive]}
                       onPress={() => handleAggregationChange(period)}>
                      <Text style={[styles.aggButtonText, aggregationPeriod === period && styles.aggButtonTextActive]}>{period.charAt(0).toUpperCase() + period.slice(1)}</Text>
                  </TouchableOpacity>
               ))}
          </View>
         </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.insightsGrid}>
          <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Total Advances</Text>
              <Text style={styles.metricValue}>{totalAdvances}</Text>
              <Text style={styles.metricSubtitle}>Lifetime total</Text>
          </View>
           <View style={styles.metricCard}>
               <Text style={styles.metricTitle}>Total Spending</Text>
               <Text style={styles.metricValue}>${totalSpending.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
               <Text style={styles.metricSubtitle}>In selected period</Text>
           </View>
           <View style={styles.metricCard}>
               <Text style={styles.metricTitle}>{avgSpendingMetric.label}</Text>
               <Text style={styles.metricValue}>{avgSpendingMetric.value}</Text>
               <Text style={styles.metricSubtitle}>{avgSpendingMetric.subtitle}</Text>
           </View>
      </View>

      {/* Charts Loading Overlay */}
      {loading && !initialLoad && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#0000ff" /></View>}
      
      {/* Spending Trends */}
       <View style={styles.card}>
           <View style={styles.chartHeader}>
               <Text style={styles.chartTitle}>Spending Trends</Text>
               <View style={styles.chartTypeSelector}>
                   <RNPickerSelect
                       value={spendingChartType}
                       onValueChange={(value) => { if (value) handleChartTypeChange('spending', value as InsightsChartType) }}
                       items={spendingChartTypeOptions}
                       style={pickerSelectStyles}
                       placeholder={{ label: "Select type...", value: null }}
                       useNativeAndroidPickerStyle={false}
                   />
               </View>
           </View>
           <SpendingTrendsChart 
               data={aggregatedSpendingData}
               cumulativeData={cumulativeSpendingData}
               heatmapData={heatmapData}
               chartType={spendingChartType as 'bar' | 'line' | 'area' | 'composed' | 'heatmap'}
               aggregationPeriod={aggregationPeriod}
               onBarClick={handleBarClick}
            />
       </View>

       {/* Spending by Category */}
       <View style={styles.card}>
           <View style={styles.chartHeader}>
               <Text style={styles.chartTitle}>Spending by Category</Text>
               <View style={styles.chartTypeSelector}>
                   <RNPickerSelect
                       value={categoryChartType}
                       onValueChange={(value) => { if (value) handleChartTypeChange('category', value as InsightsChartType) }}
                       items={categoryChartTypeOptions}
                       style={pickerSelectStyles}
                       placeholder={{ label: "Select type...", value: null }}
                       useNativeAndroidPickerStyle={false}
                   />
               </View>
           </View>
           <CategoryChart 
               data={categoryData}
               chartType={categoryChartType as 'pie' | 'bar'}
            />
       </View>

       {/* Repayment Performance */}
       <View style={styles.card}>
           <View style={styles.chartHeader}>
               <Text style={styles.chartTitle}>Repayment Performance</Text>
               <View style={styles.chartTypeSelector}>
                   <RNPickerSelect
                       value={repaymentChartType}
                       onValueChange={(value) => { if (value) handleChartTypeChange('repayment', value as InsightsChartType) }}
                       items={repaymentChartTypeOptions}
                       style={pickerSelectStyles}
                       placeholder={{ label: "Select type...", value: null }}
                       useNativeAndroidPickerStyle={false}
                   />
               </View>
           </View>
           <RepaymentChart 
               data={aggregatedRepaymentData}
               chartType={repaymentChartType as 'bar' | 'line' | 'area'}
            />
       </View>

       {/* Monthly Breakdown */}
       <View style={styles.card}>
           <View style={styles.chartHeader}>
               <Text style={styles.chartTitle}>Breakdown for {MONTHS[endDate.getMonth()]} {endDate.getFullYear()}</Text>
               <View style={styles.chartTypeSelector}>
                   <RNPickerSelect
                       value={monthlyChartType}
                       onValueChange={(value) => { if (value) handleChartTypeChange('monthly', value as InsightsChartType) }}
                       items={monthlyChartTypeOptions}
                       style={pickerSelectStyles}
                       placeholder={{ label: "Select type...", value: null }}
                       useNativeAndroidPickerStyle={false}
                   />
               </View>
           </View>
           <View style={styles.monthlyBreakdownContent}>
               <View style={styles.monthlyChartContainer}>
                   <MonthlyBreakdownChart 
                       data={monthlyBreakdown}
                       chartType={monthlyChartType as 'pie' | 'bar'}
                    />
               </View>
               <View style={styles.breakdownTableContainer}>
                   <View style={styles.tableHeaderRow}>
                       <Text style={[styles.tableHeaderCell, {flex: 2}]}>Category</Text><Text style={[styles.tableHeaderCell, {flex: 1, textAlign: 'right'}]}>Amount</Text><Text style={[styles.tableHeaderCell, {flex: 1, textAlign: 'right'}]}>%</Text>
                   </View>
                   {monthlyBreakdown.map((item, index) => (
                       <View key={index} style={styles.tableRow}>
                           <View style={{flexDirection: 'row', alignItems: 'center', flex: 2}}><View style={[styles.colorSwatch, { backgroundColor: COLORS[index % COLORS.length] }]} /><Text style={styles.tableCellText}>{item.category}</Text></View>
                           <Text style={[styles.tableCellText, {flex: 1, textAlign: 'right'}]}>${item.amount.toLocaleString()}</Text><Text style={[styles.tableCellText, {flex: 1, textAlign: 'right'}]}>{item.percentage}%</Text>
                       </View>
                   ))}
                   <View style={[styles.tableRow, styles.tableFooterRow]}>
                      <Text style={[styles.tableCellText, {fontWeight: 'bold', flex: 2}]}>Total</Text>
                      <Text style={[styles.tableCellText, {fontWeight: 'bold', flex: 1, textAlign: 'right'}]}>${monthlyBreakdown.reduce((s, i) => s + i.amount, 0).toLocaleString()}</Text>
                      <Text style={[styles.tableCellText, {fontWeight: 'bold', flex: 1, textAlign: 'right'}]}>100%</Text>
                   </View>
               </View>
           </View>
       </View>

       {/* Spending Comparison */}
        <View style={styles.card}>
            <Text style={styles.chartTitle}>Spending Comparison</Text>
            <SpendingComparisonChart data={comparisonData} />
        </View>

       {/* Advanced Metrics Section */}
       {selectedAdvancedMetrics.length > 0 && (
           <View style={[styles.card, styles.advancedMetricsSection]}>
               <Text style={styles.sectionTitle}>Advanced Metrics</Text>
               <View style={styles.advancedMetricsGrid}>
                   {availableAdvancedMetrics.filter(m => selectedAdvancedMetrics.includes(m.key)).map(metric => {
                       const value = metric.calculate(metricCalculationData);
                       return (<View key={metric.key} style={styles.metricCard}><Text style={styles.metricTitle}>{metric.name}</Text><Text style={styles.metricValue}>{metric.format(value)}</Text><Text style={styles.metricSubtitle}>{metric.description}</Text></View>);
                   })}
               </View>
           </View>
       )}

       {/* Metric Customization Panel */}
       <View style={[styles.card, styles.metricSettingsPanel]}>
           <Text style={styles.sectionTitle}>Customize Advanced Metrics</Text>
           <Text>Select the metrics you want to display:</Text>
           <View style={styles.metricCheckboxGroup}>
               {availableAdvancedMetrics.map(metric => (
                   <View key={metric.key} style={styles.checkboxItem}>
                       <Checkbox value={selectedAdvancedMetrics.includes(metric.key)} onValueChange={() => handleMetricToggle(metric.key)} color={selectedAdvancedMetrics.includes(metric.key) ? '#4630EB' : undefined} />
                       <Text style={styles.checkboxLabel} onPress={() => handleMetricToggle(metric.key)}><Text style={{fontWeight: 'bold'}}>{metric.name}</Text>: {metric.description}</Text>
                   </View>
               ))}
           </View>
       </View>

       {/* Financial Tips */}
       <View style={[styles.card, styles.tipsSection]}>
           <Text style={styles.sectionTitle}>Personalized Tips</Text>
           <View style={styles.tipItem}><Text style={styles.tipIcon}>💡</Text><View style={styles.tipTextContainer}><Text style={styles.tipHeader}>Optimize Credit Utilization</Text><Text>Keeping utilization below 70% helps.</Text></View></View>
           <View style={styles.tipItem}><Text style={styles.tipIcon}>⏱️</Text><View style={styles.tipTextContainer}><Text style={styles.tipHeader}>Early Repayments</Text><Text>Repaying early can improve score.</Text></View></View>
           <View style={styles.tipItem}><Text style={styles.tipIcon}>📊</Text><View style={styles.tipTextContainer}><Text style={styles.tipHeader}>Consistent Usage</Text><Text>Builds a stronger profile.</Text></View></View>
       </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
   loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent overlay
    zIndex: 10, // Ensure it's above other content
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
    textAlign: 'center',
    color: '#343a40',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#495057',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#343a40',
  },
  dateRangeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: '#e9ecef',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  dateButtonText: {
    color: '#007bff',
    fontWeight: '500',
  },
  selectedRangeLabel: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 10,
    marginBottom: 5,
  },
  pickerContainer: {
    marginTop: 10,
  },
  label: {
      fontSize: 16,
      fontWeight: '500',
      color: '#495057',
      marginBottom: 5,
  },
  picker: {
     // Basic styling, might need platform specific adjustments
     width: '100%',
     height: Platform.OS === 'ios' ? 120 : 50, // iOS picker needs more height
     backgroundColor: '#f1f3f5',
     borderRadius: 5,
  },
  pickerItem: {
    // iOS only: Style for picker items
    height: 120,
  },
  insightsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap', // Allow wrapping
      justifyContent: 'space-between',
      marginHorizontal: 15,
      marginBottom: 10,
  },
  metricCard: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15, // Space between cards
      // Adjust width for three columns with spacing, allow wrapping
      width: '31%', // Approx third, adjust as needed for spacing
      minWidth: 100, // Prevent cards from becoming too narrow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
      alignItems: 'center', // Center content
  },
  metricTitle: {
      fontSize: 13, // Slightly smaller title for 3 cards
      fontWeight: '600',
      color: '#6c757d',
      marginBottom: 5,
      textAlign: 'center', // Center title
  },
  metricValue: {
      fontSize: 18, // Slightly smaller value for 3 cards
      fontWeight: 'bold',
      color: '#343a40',
      marginBottom: 3,
      textAlign: 'center', // Center value
  },
  metricSubtitle: {
      fontSize: 11, // Slightly smaller subtitle
      color: '#adb5bd',
      textAlign: 'center', // Center subtitle
  },
   chartHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: 10,
   },
   chartTitle: {
       fontSize: 16,
       fontWeight: 'bold',
       color: '#495057',
       marginBottom: 15, // Add margin below title when it's standalone (like Comparison)
       flexShrink: 1,
       marginRight: 10, 
   },
   chartContainer: {
       // Add styles if needed, e.g., minHeight
       minHeight: 200, // Ensure space for placeholder/chart
       justifyContent: 'center', // Center placeholder text
       alignItems: 'center'
   },
   placeholderText: {
       fontSize: 16,
       color: '#adb5bd',
   },
   advancedMetricsSection: {
       marginTop: 20,
   },
   advancedMetricsGrid: {
       flexDirection: 'row',
       flexWrap: 'wrap',
       justifyContent: 'space-between',
   },
   metricSettingsPanel: {
      marginTop: 20,
   },
   metricCheckboxGroup: {
       marginTop: 10,
   },
   checkboxItem: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 10,
       paddingVertical: 5,
   },
   checkboxLabel: {
       marginLeft: 10,
       flex: 1, // Allow text to wrap
       fontSize: 14,
       color: '#495057',
   },
   tipsSection: {
        marginTop: 20,
        marginBottom: 30, // Extra space at the bottom
   },
   tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align icon to top
        marginBottom: 15,
   },
   tipIcon: {
       fontSize: 20,
       marginRight: 10,
       marginTop: 2, // Align icon slightly lower
   },
   tipTextContainer: {
        flex: 1,
   },
   tipHeader: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#495057',
        marginBottom: 3,
   },
   chartTypeSelector: {
       flexDirection: 'row',
       flexWrap: 'wrap', // Allow wrapping if many types
       justifyContent: 'flex-end',
   },
   chartTypeButton: {
       paddingVertical: 4,
       paddingHorizontal: 8,
       borderRadius: 4,
       backgroundColor: '#e9ecef',
       marginLeft: 5,
       marginBottom: 5, // For wrapping
   },
   chartTypeButtonActive: {
       backgroundColor: '#007bff',
   },
   chartTypeButtonText: {
       fontSize: 12,
       color: '#495057',
       fontWeight: '500',
   },
   chartTypeButtonTextActive: {
       color: '#ffffff',
   },
   monthlyBreakdownContent: {
       flexDirection: 'column', // Stack chart and table vertically on mobile
       marginTop: 10,
   },
   monthlyChartContainer: {
       minHeight: 150, // Smaller height for donut
       marginBottom: 15,
   },
   breakdownTableContainer: {
     // Styles for the table wrapper
   },
   tableHeaderRow: {
       flexDirection: 'row',
       borderBottomWidth: 1,
       borderBottomColor: '#dee2e6',
       paddingBottom: 8,
       marginBottom: 8,
   },
   tableHeaderCell: {
       fontSize: 13,
       fontWeight: 'bold',
       color: '#6c757d',
   },
   tableRow: {
       flexDirection: 'row',
       paddingVertical: 6,
       borderBottomWidth: 1,
       borderBottomColor: '#f1f3f5',
   },
   tableFooterRow: {
       borderBottomWidth: 0, // No bottom border for footer
       borderTopWidth: 1,
       borderTopColor: '#dee2e6',
       marginTop: 5,
       paddingTop: 8,
   },
   tableCellText: {
       fontSize: 14,
       color: '#495057',
   },
   colorSwatch: {
       width: 12,
       height: 12,
       borderRadius: 3,
       marginRight: 8,
   },
   aggButton: {
       paddingVertical: 4,
       paddingHorizontal: 8,
       borderRadius: 4,
       backgroundColor: '#e9ecef',
       marginLeft: 5,
       marginBottom: 5, // For wrapping
   },
   aggButtonActive: {
       backgroundColor: '#007bff',
   },
   aggButtonText: {
       fontSize: 14, // Slightly larger font size
       fontWeight: '500',
       color: '#495057', // Standard text color
   },
   aggButtonTextActive: {
       color: '#fff', // White text when active
       fontSize: 14, // Keep consistent
       fontWeight: '500',
   },
   aggregationSelector: {
       flexDirection: 'row',
       flexWrap: 'wrap', // Allow wrapping if many types
       justifyContent: 'flex-end',
   },
});

// Add styles for react-native-picker-select
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    color: '#495057',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    color: '#495057',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#fff',
  },
  placeholder: {
    color: '#adb5bd',
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
});

export default Insights; 