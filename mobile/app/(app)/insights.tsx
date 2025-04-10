import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform // Import Platform
} from 'react-native';
import { Stack } from 'expo-router';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
    LineChart,
    BarChart,
    PieChart,
    StackedBarChart
} from "react-native-chart-kit";
import { Ionicons } from '@expo/vector-icons'; // For tips icon

// --- Types ---
type AggregationPeriod = 'daily' | 'weekly' | 'monthly';
type ChartType = 'bar' | 'line' | 'pie';
type ComparisonType = 'month' | 'year';

interface DailyDataPoint {
    date: Date;
    amount: number;
    category: string; // Added category
}

interface DailyRepaymentPoint {
    date: Date;
    onTime: number;
    late: number;
}

interface AggregatedDataPoint {
  period: string; // Formatted date/week/month key
  amount: number;
}

interface CategoryDataPoint {
  name: string;
  amount: number; // Total amount for the period
  percentage: number; // Percentage of total spending
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface RepaymentDataPoint {
    period: string;
    onTime: number;
    late: number;
}

// --- Constants & Helpers ---
const CATEGORY_NAMES = ["Groceries", "Housing", "Transport", "Utilities", "Entertainment", "Other"];
const CATEGORY_COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"];
const REPAYMENT_COLORS = { onTime: '#4CAF50', late: '#F44336' };
const screenWidth = Dimensions.get("window").width;
const chartPadding = 15; // Padding inside the card
const chartWidth = screenWidth - (chartPadding * 2) - 30; // Adjust width calculation slightly

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

const formatDateKey = (date: Date, period: AggregationPeriod): string => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed month
    const day = date.getDate().toString().padStart(2, '0');
    const monthStr = (month + 1).toString().padStart(2, '0');
    const monthAbbr = date.toLocaleDateString('en-US', { month: 'short' });

    switch (period) {
      case 'daily': return `${year}-${monthStr}-${day}`;
      case 'weekly': return `${year}-W${getWeekNumber(date).toString().padStart(2, '0')}`;
      case 'monthly': return `${monthAbbr} ${year}`; // Format for display
      default: return `${year}-${monthStr}-${day}`;
    }
  };

const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// --- Data Simulation --- 
const generateSimulatedDailySpending = (startDate: Date, endDate: Date): DailyDataPoint[] => {
    const data: DailyDataPoint[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const baseAmount = (dayOfWeek === 0 || dayOfWeek === 6) ? 30 : 50;
      const amount = baseAmount + Math.floor(Math.random() * 100);
      const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
      data.push({ date: new Date(d), amount, category });
    }
    return data;
  };
  
const generateSimulatedDailyRepayments = (startDate: Date, endDate: Date): DailyRepaymentPoint[] => {
    const data: DailyRepaymentPoint[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (Math.random() > 0.6) { 
         const onTimeCount = Math.random() > 0.2 ? Math.floor(Math.random() * 2) + 1 : 0; 
         const lateCount = onTimeCount > 0 && Math.random() > 0.8 ? 1 : 0; 
         if (onTimeCount > 0 || lateCount > 0) {
             data.push({ date: new Date(d), onTime: onTimeCount, late: lateCount });
         }
      }
    }
    return data;
};

// --- Chart Configs ---
const chartLabelStyle = { fontSize: 10, fill: '#666' };
const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, 
    labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
    style: { borderRadius: 8 },
    propsForDots: { r: "4", strokeWidth: "1", stroke: "#007bff" },
    propsForBackgroundLines: { strokeDasharray: "", stroke: '#e0e0e0', strokeWidth: 0.5 },
    propsForLabels: chartLabelStyle, // Apply label style
};
const repaymentChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => REPAYMENT_COLORS.onTime, // Base color for lines/bars
    propsForLabels: chartLabelStyle,
};
const pieChartConfig = { 
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Not used by library directly
    labelColor: (opacity = 1) => `rgba(50, 50, 50, ${opacity})`,
    propsForLabels: chartLabelStyle,
 };


// --- Main Component ---
export default function InsightsScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDateType, setSelectedDateType] = useState<'start' | 'end'>('start');
  // Default date range to current month
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date()); // Today
  const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod>('monthly');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('month');

  // Chart Type State
  const [spendingChartType, setSpendingChartType] = useState<ChartType>('bar');
  const [categoryChartType, setCategoryChartType] = useState<ChartType>('pie');
  const [repaymentChartType, setRepaymentChartType] = useState<ChartType>('bar');
  const [monthlyChartType, setMonthlyChartType] = useState<ChartType>('pie');

  // Aggregated chart data state
  const [spendingChartData, setSpendingChartData] = useState<AggregatedDataPoint[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<CategoryDataPoint[]>([]);
  const [repaymentChartData, setRepaymentChartData] = useState<RepaymentDataPoint[]>([]);
  const [monthlyBreakdownData, setMonthlyBreakdownData] = useState<CategoryDataPoint[]>([]); // Use same type for structure

  // Memoized simulated raw data
  const rawSpendingData = useMemo(() => {
    return generateSimulatedDailySpending(startDate, endDate);
  }, [startDate, endDate]); 
  const rawRepaymentData = useMemo(() => {
    return generateSimulatedDailyRepayments(startDate, endDate);
  }, [startDate, endDate]);

  // --- Data Aggregation Effect ---
  useEffect(() => {
    setLoading(true);

    // 1. Aggregate Spending (Trends)
    const spendingMap = new Map<string, number>();
    rawSpendingData.forEach(item => {
      const key = formatDateKey(item.date, aggregationPeriod);
      spendingMap.set(key, (spendingMap.get(key) || 0) + item.amount);
    });
    const aggSpending: AggregatedDataPoint[] = Array.from(spendingMap, ([period, amount]) => ({ period, amount }));
    aggSpending.sort((a, b) => a.period.localeCompare(b.period)); // Ensure chronological sort
    setSpendingChartData(aggSpending);

    // 2. Aggregate Repayment (Trends)
    const repaymentMap = new Map<string, { onTime: number, late: number }>();
    rawRepaymentData.forEach(item => {
      const key = formatDateKey(item.date, aggregationPeriod);
      const current = repaymentMap.get(key) || { onTime: 0, late: 0 };
      repaymentMap.set(key, {
         onTime: current.onTime + item.onTime,
         late: current.late + item.late
       });
    });
    const aggRepayment: RepaymentDataPoint[] = Array.from(repaymentMap, ([period, data]) => ({ period, ...data }));
    aggRepayment.sort((a, b) => a.period.localeCompare(b.period));
    setRepaymentChartData(aggRepayment);

    // 3. Aggregate Spending by Category (for Percentage Pie/Bar)
    const categoryMap = new Map<string, number>();
    let totalSpendingForPeriod = 0;
    rawSpendingData.forEach(item => {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + item.amount);
      totalSpendingForPeriod += item.amount;
    });
    const aggCategories: CategoryDataPoint[] = Array.from(categoryMap, ([name, amount], index) => ({
        name,
        amount, // Keep amount for tooltips/bar chart value
        percentage: totalSpendingForPeriod > 0 ? parseFloat(((amount / totalSpendingForPeriod) * 100).toFixed(1)) : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        legendFontColor: '#555',
        legendFontSize: 13,
    }));
    aggCategories.sort((a, b) => b.amount - a.amount); // Sort for display
    setCategoryChartData(aggCategories);

    // 4. Aggregate Spending by Category for Last Month (for Breakdown)
    const lastMonthDate = new Date(endDate);
    lastMonthDate.setDate(1); // Start of end date's month
    const breakdownMap = new Map<string, number>();
    rawSpendingData
        .filter(d => d.date >= lastMonthDate && d.date <= endDate) // Filter for last month
        .forEach(item => {
             breakdownMap.set(item.category, (breakdownMap.get(item.category) || 0) + item.amount);
        });
    const monthlyBreakdown: CategoryDataPoint[] = Array.from(breakdownMap, ([name, amount], index) => ({
        name,
        amount,
        percentage: 0, // Not needed for breakdown chart
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        legendFontColor: '#555',
        legendFontSize: 13,
    }));
    monthlyBreakdown.sort((a, b) => b.amount - a.amount);
    setMonthlyBreakdownData(monthlyBreakdown);

    setLoading(false);
  }, [rawSpendingData, rawRepaymentData, aggregationPeriod, startDate, endDate]); // Added startdate dependency

  // --- Date Picker Handling ---
  const showDatePicker = (type: 'start' | 'end') => {
    setSelectedDateType(type);
    setDatePickerVisibility(true);
  };
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    if (selectedDateType === 'start') {
      if (date > endDate) setStartDate(endDate);
      else setStartDate(date);
    } else {
      if (date < startDate) setEndDate(startDate);
      else setEndDate(date);
    }
    hideDatePicker();
  };

  // --- Key Metrics Calculation ---
  const totalSpending = useMemo(() => {
      return rawSpendingData.reduce((sum, item) => sum + item.amount, 0);
  }, [rawSpendingData]);
  
  const averageDailySpend = useMemo(() => {
      if (rawSpendingData.length === 0) return 0;
      const total = rawSpendingData.reduce((sum, item) => sum + item.amount, 0);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      return total / (diffDays || 1); // Avoid division by zero if start=end
  }, [rawSpendingData, startDate, endDate]);

  const repaymentRate = useMemo(() => {
      const totalOnTime = rawRepaymentData.reduce((sum, item) => sum + item.onTime, 0);
      const totalLate = rawRepaymentData.reduce((sum, item) => sum + item.late, 0);
      const totalPayments = totalOnTime + totalLate;
      return totalPayments > 0 ? parseFloat(((totalOnTime / totalPayments) * 100).toFixed(1)) : 100; // Assume 100% if no payments
  }, [rawRepaymentData]);

  // Simulate previous period spending based on comparison type
  const previousPeriodSpending = useMemo(() => {
      const daysInPeriod = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      let prevStartDate = new Date(startDate);
      let prevEndDate = new Date(endDate);
      if (comparisonType === 'month') {
          prevStartDate.setMonth(prevStartDate.getMonth() - 1);
          prevEndDate = new Date(prevStartDate);
          prevEndDate.setDate(prevStartDate.getDate() + daysInPeriod - 1);
      } else { // year
          prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
          prevEndDate = new Date(prevStartDate);
          prevEndDate.setDate(prevStartDate.getDate() + daysInPeriod - 1);
      }
       // Simulate fetching/generating data for this previous period
      const previousData = generateSimulatedDailySpending(prevStartDate, prevEndDate);
      return previousData.reduce((sum, item) => sum + item.amount, 0);

  }, [totalSpending, startDate, endDate, comparisonType]);

  // --- Chart Rendering Logic ---
  // Spending Trends (Bar/Line)
  const renderSpendingTrendsChart = () => {
    if (!spendingChartData || spendingChartData.length === 0) return <Text style={styles.noDataText}>No spending data.</Text>;
    const data = {
        labels: spendingChartData.map(d => d.period), // Use formatted keys directly
        datasets: [{ data: spendingChartData.map(d => d.amount) }]
    };
    switch(spendingChartType) {
        case 'line':
            return <LineChart data={data} width={chartWidth} height={220} chartConfig={chartConfig} bezier style={styles.chartStyle} fromZero={true} />; 
        case 'bar':
        default:
            return <BarChart data={data} width={chartWidth} height={220} yAxisLabel="$" yAxisSuffix="" chartConfig={chartConfig} verticalLabelRotation={aggregationPeriod === 'daily' ? 60 : 30} fromZero={true} style={styles.chartStyle} showBarTops={false} />; 
    }
  };

  // Category Spending (Pie / Bar)
  const renderCategorySpendingChart = () => {
    if (!categoryChartData || categoryChartData.length === 0) return <Text style={styles.noDataText}>No category data.</Text>;
    switch(categoryChartType) {
        case 'pie':
            // Pie chart shows percentages via legend
            return (
                <View style={{ alignItems: 'center' }}>
                    <PieChart 
                        data={categoryChartData} 
                        width={chartWidth} 
                        height={180} // Reduced height for legend space
                        chartConfig={pieChartConfig} 
                        accessor={"amount"} // Still based on amount for size
                        backgroundColor={"transparent"} 
                        paddingLeft={"15"} 
                        center={[chartWidth / 4.5, 0]} 
                        hasLegend={false} // Hide default legend
                    />
                    <CustomLegend data={categoryChartData} />
                </View>
            );
        case 'bar':
        default:
            const barData = { 
                labels: categoryChartData.map(d => d.name), 
                datasets: [{ data: categoryChartData.map(d => d.percentage) }] // Show percentage on bar
            };
            return (
                <BarChart 
                    data={barData} 
                    width={chartWidth} 
                    height={220} 
                    yAxisSuffix="%" // Show % 
                    yAxisLabel="" 
                    chartConfig={{...chartConfig, color: () => CATEGORY_COLORS[0]}} 
                    fromZero={true} 
                    style={styles.chartStyle} 
                    verticalLabelRotation={30}
                    showBarTops={false}
                 />
            );
    }
  }

  // Repayment Performance (Stacked Bar / Line)
  const renderRepaymentPerformanceChart = () => {
     if (!repaymentChartData || repaymentChartData.length === 0) return <Text style={styles.noDataText}>No repayment data.</Text>;
     const stackedBarData = {
        labels: repaymentChartData.map(d => d.period),
        legend: ["On-time", "Late"],
        data: repaymentChartData.map(d => [d.onTime, d.late]),
        barColors: [REPAYMENT_COLORS.onTime, REPAYMENT_COLORS.late]
     };
      const lineData = {
          labels: repaymentChartData.map(d => d.period),
          datasets: [
              { data: repaymentChartData.map(d => d.onTime), color: (opacity=1) => REPAYMENT_COLORS.onTime, strokeWidth: 2 },
              { data: repaymentChartData.map(d => d.late), color: (opacity=1) => REPAYMENT_COLORS.late, strokeWidth: 2 }
          ]
      };

    switch(repaymentChartType) {
        case 'line':
            return <LineChart data={lineData} width={chartWidth} height={220} chartConfig={repaymentChartConfig} bezier style={styles.chartStyle} fromZero={true}/>;
        case 'bar':
        default:
            return <StackedBarChart data={stackedBarData} width={chartWidth} height={220} chartConfig={repaymentChartConfig} style={styles.chartStyle} hideLegend={false} />; 
    }
  }

  // Monthly Breakdown (Pie / Bar)
  const renderMonthlyBreakdownChart = () => {
     if (!monthlyBreakdownData || monthlyBreakdownData.length === 0) return <Text style={styles.noDataText}>No breakdown data.</Text>;
     switch(monthlyChartType) {
        case 'pie':
             return (
                 <View style={{ alignItems: 'center' }}>
                     <PieChart 
                         data={monthlyBreakdownData} 
                         width={chartWidth} 
                         height={180} 
                         chartConfig={pieChartConfig} 
                         accessor={"amount"} 
                         backgroundColor={"transparent"} 
                         paddingLeft={"15"} 
                         center={[chartWidth / 4.5, 0]} 
                         absolute // Show absolute values
                         hasLegend={false} 
                     />
                     {/* Use same legend component, but shows amounts */}
                     <CustomLegend data={monthlyBreakdownData} showAmount={true} /> 
                 </View>
             );
        case 'bar':
        default:
             const barData = { 
                 labels: monthlyBreakdownData.map(d => d.name), 
                 datasets: [{ data: monthlyBreakdownData.map(d => d.amount) }] // Show amounts
             };
             return (
                 <BarChart 
                     data={barData} 
                     width={chartWidth} 
                     height={220} 
                     yAxisLabel="$" 
                     yAxisSuffix="" 
                     chartConfig={{...chartConfig, color: () => CATEGORY_COLORS[0]}} 
                     fromZero={true} 
                     style={styles.chartStyle} 
                     verticalLabelRotation={30}
                     showBarTops={false}
                  />
             );
    }
  }

   // --- Render --- 
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Insights' }} />
      <Text style={styles.pageTitle}>Financial Insights</Text>

      {/* --- Date Range Selector --- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Date Range & Aggregation</Text>
         <View style={styles.dateRangeRow}>
          <TouchableOpacity onPress={() => showDatePicker('start')} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>From: {formatDate(startDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showDatePicker('end')} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>To: {formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.aggregationRow}>
          <Text style={styles.aggregationLabel}>View by:</Text>
          {(['daily', 'weekly', 'monthly'] as AggregationPeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.aggregationButton, aggregationPeriod === period && styles.aggregationButtonActive]}
              onPress={() => setAggregationPeriod(period)}
            >
              <Text style={[styles.aggregationButtonText, aggregationPeriod === period && styles.aggregationButtonTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={selectedDateType === 'start' ? startDate : endDate}
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
      />

       {/* --- Key Metrics --- */}
       <View style={styles.card}>
         <Text style={styles.sectionTitle}>Key Metrics</Text>
         <View style={styles.metricsGrid}>
            <View style={styles.metricBox}><Text style={styles.metricValue}>{formatCurrency(totalSpending)}</Text><Text style={styles.metricLabel}>Total Spent</Text></View>
            <View style={styles.metricBox}><Text style={styles.metricValue}>{formatCurrency(averageDailySpend)}</Text><Text style={styles.metricLabel}>Avg Daily Spend</Text></View>
            <View style={styles.metricBox}><Text style={styles.metricValue}>{repaymentRate}%</Text><Text style={styles.metricLabel}>On-time Repay</Text></View>
         </View>
      </View>

      {/* --- Charts --- */} 
      {loading ? (
        <ActivityIndicator size="large" style={{ marginVertical: 30 }} />
      ) : (
        <>
          {/* Spending Trends */} 
          <View style={styles.card}>
             <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Spending Trends</Text>
                 <ChartTypeSwitcher currentType={spendingChartType} setType={setSpendingChartType} options={['bar', 'line']} />
             </View>
             {renderSpendingTrendsChart()}
          </View>

           {/* Category Spending */} 
          <View style={styles.card}>
              <View style={styles.chartHeader}>
                 <Text style={styles.sectionTitle}>Spending by Category (% Period)</Text>
                 <ChartTypeSwitcher currentType={categoryChartType} setType={setCategoryChartType} options={['pie', 'bar']} />
              </View>
              {renderCategorySpendingChart()}
          </View>

          {/* Repayment Performance */} 
           <View style={styles.card}>
              <View style={styles.chartHeader}>
                  <Text style={styles.sectionTitle}>Repayment Performance</Text>
                  <ChartTypeSwitcher currentType={repaymentChartType} setType={setRepaymentChartType} options={['bar', 'line']} />
              </View>
              {renderRepaymentPerformanceChart()}
          </View>

          {/* Monthly Breakdown */} 
            <View style={styles.card}>
                <View style={styles.chartHeader}>
                    <Text style={styles.sectionTitle}>Monthly Breakdown ({formatDateKey(endDate, 'monthly')})</Text>
                    <ChartTypeSwitcher currentType={monthlyChartType} setType={setMonthlyChartType} options={['pie', 'bar']} />
                </View>
                 {renderMonthlyBreakdownChart()}
            </View>

           {/* Spending Comparison */} 
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Spending Comparison</Text>
                 <View style={styles.comparisonSelectorRow}>
                     <Text style={styles.comparisonLabel}>Compare To:</Text>
                     <View style={styles.themeButtonsContainer}> { /* Re-using theme button style */ }
                          {(['month', 'year'] as ComparisonType[]).map(type => (
                              <TouchableOpacity
                                 key={type}
                                 style={[styles.themeButton, comparisonType === type && styles.themeButtonActive]}
                                 onPress={() => setComparisonType(type)}
                              >
                                  <Text style={[styles.themeButtonText, comparisonType === type && styles.themeButtonTextActive]}>
                                      Prev {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </Text>
                              </TouchableOpacity>
                          ))}
                      </View>
                 </View>
                <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Current Period ({formatDate(startDate)} - {formatDate(endDate)}):</Text>
                    <Text style={styles.comparisonValue}>{formatCurrency(totalSpending)}</Text>
                </View>
                 <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>vs Previous {comparisonType} (Simulated):</Text>
                    <Text style={styles.comparisonValue}>{formatCurrency(previousPeriodSpending)}</Text>
                </View>
                 {/* Add simple bar comparison here later if desired */}
            </View>

            {/* Advanced Metrics (Simplified) */} 
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Advanced Metrics</Text>
                 <View style={styles.settingRow}>
                     <Text style={styles.settingLabel}>Avg Repayment Time (Days):</Text>
                     <Text style={styles.settingValue}>~{15 + Math.floor(Math.random() * 10)}</Text>{/* Placeholder */}
                 </View>
                 <View style={styles.settingRow}>
                     <Text style={styles.settingLabel}>Credit Utilization:</Text>
                     <Text style={styles.settingValue}>~{60 + Math.floor(Math.random() * 15)}%</Text>{/* Placeholder */}
                 </View>
            </View>

            {/* Financial Tips */} 
            <View style={styles.tipsCard}> 
                 <Ionicons name="bulb-outline" size={24} color="#0056b3" style={styles.tipsIcon} />
                 <View style={styles.tipsContent}>
                     <Text style={styles.sectionTitle}>Financial Tips</Text>
                     <Text style={styles.tipText}>• Track your spending regularly to identify areas for savings.</Text>
                     <Text style={styles.tipText}>• Try to pay more than the minimum on credit balances when possible.</Text>
                     <Text style={styles.tipText}>• Consider setting a budget for different spending categories.</Text>
                 </View>
            </View>
        </>
      )}

    </ScrollView>
  );
}

// --- Chart Type Switcher Component ---
interface ChartTypeSwitcherProps {
    currentType: ChartType;
    setType: (type: ChartType) => void;
    options: ChartType[];
}
const ChartTypeSwitcher: React.FC<ChartTypeSwitcherProps> = ({ currentType, setType, options }) => (
    <View style={styles.chartTypeContainer}>
        {options.map(type => (
            <TouchableOpacity
                key={type}
                style={[styles.chartTypeButton, currentType === type && styles.chartTypeButtonActive]}
                onPress={() => setType(type)}
            >
                <Text style={[styles.chartTypeButtonText, currentType === type && styles.chartTypeButtonTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

// --- Custom Legend Component for Pie Chart ---
interface CustomLegendProps {
    data: CategoryDataPoint[];
    showAmount?: boolean; // Flag to show amount instead of percentage
}
const CustomLegend: React.FC<CustomLegendProps> = ({ data, showAmount = false }) => (
    <View style={styles.legendContainer}>
        {data.map((entry, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
                <View style={[styles.legendColorBox, { backgroundColor: entry.color }]} />
                <Text style={styles.legendText}>
                    {entry.name}: {showAmount ? formatCurrency(entry.amount) : `${entry.percentage}%`}
                </Text>
            </View>
        ))}
    </View>
);


// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContentContainer: {
    paddingBottom: 30, // Ensure space at the bottom
  },
  pageTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 10,
  },
  card: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: chartPadding, // Use constant for padding
      marginHorizontal: 15,
      marginTop: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
  },
  sectionTitle: {
      fontSize: 16, // Slightly smaller title
      fontWeight: '600', // Medium weight
      color: '#333',
      marginBottom: 10,
      flexShrink: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // Reduced margin
    flexWrap: 'wrap', // Allow wrapping if title is long
  },
  chartTypeContainer: {
    flexDirection: 'row',
  },
  chartTypeButton: {
    paddingVertical: 3, // Smaller buttons
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007bff',
    marginLeft: 5,
  },
  chartTypeButtonActive: {
    backgroundColor: '#007bff',
  },
  chartTypeButtonText: {
    color: '#007bff',
    fontSize: 10,
  },
  chartTypeButtonTextActive: {
    color: '#fff',
  },
  dateRangeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      gap: 10,
  },
  dateButton: {
      paddingVertical: 10,
      paddingHorizontal: 10, // Adjust padding
      backgroundColor: '#e9ecef',
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
  },
  dateButtonText: {
      color: '#495057',
      fontSize: 13, // Slightly smaller date text
      textAlign: 'center',
  },
  aggregationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      flexWrap: 'wrap',
  },
  aggregationLabel: {
      fontSize: 14,
      color: '#666',
      marginRight: 10,
      marginBottom: 5,
  },
  aggregationButton: {
      paddingVertical: 5, // Adjust padding
      paddingHorizontal: 10,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#007bff',
      marginRight: 6,
      marginBottom: 5,
  },
  aggregationButtonActive: {
      backgroundColor: '#007bff',
  },
  aggregationButtonText: {
      color: '#007bff',
      fontSize: 12,
  },
  aggregationButtonTextActive: {
      color: '#fff',
  },
  metricsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
  },
  metricBox: {
      alignItems: 'center',
      paddingHorizontal: 5, // Reduced horizontal padding
      paddingVertical: 10,
      minWidth: (screenWidth / 3) - 30, // Try to fit 3 metrics per row
      marginBottom: 5, // Add some bottom margin
  },
  metricValue: {
      fontSize: 17, // Slightly smaller value
      fontWeight: 'bold',
      color: '#007bff',
  },
  metricLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 3,
      textAlign: 'center',
  },
  chartStyle: {
    marginVertical: 5,
    borderRadius: 8,
    paddingRight: Platform.OS === 'ios' ? 0 : 20, // Reduce paddingRight, maybe OS specific
  },
  noDataText: {
      textAlign: 'center',
      color: '#888',
      paddingVertical: 20,
      fontStyle: 'italic',
  },
  // Legend for Pie Chart
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  legendColorBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#555',
  },
  // Comparison Section
  comparisonSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  comparisonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
  },
  comparisonLabel: {
      fontSize: 14,
      color: '#555',
      marginRight: 5,
  },
  comparisonValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333',
  },
   // Reusing theme button styles for comparison selector
   themeButtonsContainer: {
       flexDirection: 'row',
   },
   themeButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#007bff',
        marginLeft: 6,
   },
   themeButtonActive: {
        backgroundColor: '#007bff',
   },
   themeButtonText: {
        color: '#007bff',
        fontSize: 11,
   },
   themeButtonTextActive: {
        color: '#fff',
   },
   // Advanced Metrics / Settings rows
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#555',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  // Financial Tips Card
  tipsCard: {
    backgroundColor: '#e7f3ff', // Light blue background like dashboard teaser
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipsIcon: {
      marginRight: 10,
      marginTop: 2, // Align icon slightly
  },
  tipsContent: {
      flex: 1,
  },
  tipText: {
      fontSize: 13,
      color: '#0056b3',
      marginBottom: 6,
      lineHeight: 18,
  }
}); 