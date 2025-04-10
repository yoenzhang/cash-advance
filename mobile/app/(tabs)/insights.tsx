import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, ActivityIndicator, Platform, TouchableOpacity, Switch, Dimensions } from 'react-native';
import { useAuth } from '@/app/context/AuthContext'; // Corrected path
import { useApplication } from '@/app/context/ApplicationContext'; // Corrected path
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import SVG wrapper needed only for victory-native
import { Svg } from 'react-native-svg';

// Dynamically require the correct library
const { VictoryPie, VictoryChart, VictoryBar, VictoryAxis, VictoryStack, VictoryLabel, VictoryTooltip, VictoryLine, VictoryArea } = Platform.select({
    web: () => require('victory'),
    default: () => require('victory-native'), // Use default for native platforms
})(); // Immediately invoke the selected function

import { appColors } from '@/constants/appColors'; // Assuming this path is correct, adjust if needed
// Restore fetchInsightsData import
import { fetchInsightsData } from '@/app/services/api';
import { Stack } from 'expo-router'; // Import Stack for header config

// Remove test console logs
// console.log('Victory namespace import:', Victory);
// console.log('Victory.VictoryPie:', Victory?.VictoryPie); // Check specific component

// Types adapted for mobile (ensure consistency with backend/web)
interface SpendingData {
  date: Date; // Keep as Date object for processing
  amount: number;
}

interface AggregatedSpendingData {
  period: string; // e.g., "Jan 2024", "2024-W10", "2024-03-15"
  amount: number;
}

interface CategoryData {
  name: string;
  value: number;
}

// Added from frontend
interface MonthlyBreakdown {
  category: string;
  amount: number;
  percentage?: number; // Optional percentage
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

// Define structure for advanced metric definitions (if needed on mobile)
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
  categoryData: CategoryData[];
  startDate: Date;
  endDate: Date;
}

type AggregationPeriod = 'monthly' | 'weekly' | 'daily';
const ASYNC_STORAGE_METRICS_KEY = 'insightsAdvancedMetricsSelectionMobile';

// Chart Colors (adapt from frontend/appColors)
const CHART_COLORS = [appColors.primary, appColors.secondary, appColors.warning, appColors.info, '#A569BD']; // Example palette
const REPAYMENT_COLORS = { onTime: appColors.secondary, late: appColors.danger };

// Chart Type definition (from frontend)
type ChartType = 'bar' | 'line' | 'area' | 'pie'; // Add other types as needed

// --- Helper Functions ---
const getWeekOfYear = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    return Math.ceil((diff / (1000 * 60 * 60 * 24)) / 7);
};

const formatDateKey = (date: Date, period: AggregationPeriod): string => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const day = date.getDate();
    const week = getWeekOfYear(date);

    switch (period) {
        case 'daily':
            return date.toISOString().split('T')[0];
        case 'weekly':
            // Format week for better sorting/display if needed
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay()); // Assuming Sunday start
            return `${startOfWeek.getFullYear()}-W${week.toString().padStart(2, '0')} (${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
        case 'monthly':
        default:
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[month]} ${year}`;
    }
};

const formatDateLabel = (date: Date): string => {
     const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
     return date.toLocaleDateString(undefined, options);
};

// Mock Advanced Metrics (or fetch/define as needed)
const availableAdvancedMetrics: AdvancedMetricDefinition[] = [
  // ... (Copy definitions from web version if implementing advanced metrics)
];

// --- Component ---
const InsightsScreen: React.FC = () => {
    // Restore state
    const { user } = useAuth();
    const [loading, setLoading] = useState<boolean>(true); // Start loading
    const [error, setError] = useState<string | null>(null);
    const [rawSpendingData, setRawSpendingData] = useState<SpendingData[]>([]);
    const [rawRepaymentData, setRawRepaymentData] = useState<RepaymentData[]>([]);
    const [aggregatedSpendingData, setAggregatedSpendingData] = useState<AggregatedSpendingData[]>([]);
    const [aggregatedRepaymentData, setAggregatedRepaymentData] = useState<AggregatedRepaymentData[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
    const [startDate, setStartDate] = useState<Date>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        date.setDate(1);
        return date;
    });
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod>('monthly');
    const [spendingChartType, setSpendingChartType] = useState<ChartType>('bar');
    const [selectedAdvancedMetrics, setSelectedAdvancedMetrics] = useState<string[]>([]);

    // Restore data filtering and aggregation
    const filteredSpending = useMemo(() => {
        return rawSpendingData.filter(d => d.date >= startDate && d.date <= endDate);
    }, [rawSpendingData, startDate, endDate]);

    const filteredRepayment = useMemo(() => {
        return rawRepaymentData.filter(d => d.date >= startDate && d.date <= endDate);
    }, [rawRepaymentData, startDate, endDate]);

    // Restore useEffect hooks
    useEffect(() => {
        // Aggregate Spending Data
        const spendingMap = new Map<string, number>();
        filteredSpending.forEach(item => {
            const key = formatDateKey(item.date, aggregationPeriod);
            spendingMap.set(key, (spendingMap.get(key) || 0) + item.amount);
        });
        const aggregatedSpending: AggregatedSpendingData[] = Array.from(spendingMap.entries())
            .map(([period, amount]) => ({ period, amount }))
            .sort((a, b) => a.period.localeCompare(b.period)); // Ensure consistent order
        setAggregatedSpendingData(aggregatedSpending);

        // Aggregate Repayment Data
        const repaymentMap = new Map<string, { onTime: number; late: number }>();
        filteredRepayment.forEach(item => {
            const key = formatDateKey(item.date, aggregationPeriod);
            const current = repaymentMap.get(key) || { onTime: 0, late: 0 };
            current.onTime += item.onTime;
            current.late += item.late;
            repaymentMap.set(key, current);
        });
        const aggregatedRepayment: AggregatedRepaymentData[] = Array.from(repaymentMap.entries())
            .map(([period, counts]) => ({ period, onTime: counts.onTime, late: counts.late }))
            .sort((a, b) => a.period.localeCompare(b.period)); // Ensure consistent order
        setAggregatedRepaymentData(aggregatedRepayment);

        // Calculate Category Data (Example - needs actual category logic from API)
        // This might come directly from the API in fetchInsightsData result
        if (!categoryData.length && filteredSpending.length > 0) { // Only set mock if API didn't provide and we have spending data
             console.log("Setting mock category data as API data was empty.");
             const categoryMap = new Map<string, number>();
             filteredSpending.forEach(item => {
                 const category = item.amount > 150 ? 'Large Expenses' : item.amount > 50 ? 'Medium Expenses' : 'Small Expenses';
                 categoryMap.set(category, (categoryMap.get(category) || 0) + item.amount);
             });
             setCategoryData(Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value));
        }


        // --- Calculate Monthly Breakdown (Added from frontend logic) ---
        // This calculates breakdown based on ALL filtered spending, not just last month like frontend
        // TODO: Adapt if only last month's breakdown is desired
        const monthlyCategoryMap = new Map<string, number>();
        filteredSpending.forEach(item => {
            // Replace mock category logic with actual category if available on item
             const category = item.amount > 150 ? 'Large Expenses' : item.amount > 50 ? 'Medium Expenses' : 'Small Expenses'; // Mock category
            monthlyCategoryMap.set(category, (monthlyCategoryMap.get(category) || 0) + item.amount);
        });
        const totalSpending = Array.from(monthlyCategoryMap.values()).reduce((sum, amount) => sum + amount, 0);
        const breakdown: MonthlyBreakdown[] = Array.from(monthlyCategoryMap.entries())
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount); // Sort by amount desc
        setMonthlyBreakdown(breakdown);
        // --- End Monthly Breakdown Calculation ---


    }, [filteredSpending, filteredRepayment, aggregationPeriod, categoryData]); // Added categoryData

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                 // --- Real API Call Block (Partially Commented Out for Mock Data) ---
                /* // Keep API call commented out until backend/import issue resolved
                if (user?.id) {
                    // Ensure date range is passed if API supports it, otherwise filter after fetching all data
                    console.log(`Fetching insights for user ${user.id}`);
                    const data = await fetchInsightsData(user.id); // Adjust API call as needed
                    console.log("API Data Received:", data);
                    // Ensure date strings are converted to Date objects
                    const parseDate = (dateStr: string | Date): Date => typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

                    // Check if spending/repayment data exists before mapping
                    const spending = data.spending ? data.spending.map((d: SpendingData) => ({ ...d, date: parseDate(d.date) })) : [];
                    const repayment = data.repayment ? data.repayment.map((d: RepaymentData) => ({ ...d, date: parseDate(d.date) })) : [];

                    setRawSpendingData(spending);
                    setRawRepaymentData(repayment);
                    setCategoryData(data.categories || []); // Assuming API provides category breakdown, default to empty array
                    console.log("Processed Raw Data Set - Spending:", spending.length, "Repayment:", repayment.length, "Categories:", data.categories?.length || 0);

                } else {
                    setError("User not authenticated.");
                    console.log("User not authenticated, cannot fetch insights.");
                }
                */
                // --- End Real API Call Block ---

                // --- MOCK DATA --- Kept for UI development ---
                console.log("Generating mock data for UI development...");
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

                const today = new Date();
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(today.getMonth() - 3);

                const mockSpending: SpendingData[] = [];
                const mockRepayment: RepaymentData[] = [];
                const mockCategoriesMap = new Map<string, number>();
                const categories = ['Groceries', 'Transport', 'Utilities', 'Entertainment', 'Rent/Mortgage', 'Other'];

                for (let d = new Date(threeMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
                  // Generate 1-3 spending entries per day
                  for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
                      const amount = Math.floor(Math.random() * 200) + 10; // Random amount between 10 and 210
                      mockSpending.push({ date: new Date(d), amount: amount });
                      // Add to category
                      const category = categories[Math.floor(Math.random() * categories.length)];
                      mockCategoriesMap.set(category, (mockCategoriesMap.get(category) || 0) + amount);
                  }

                  // Generate repayment data less frequently
                  if (Math.random() < 0.2) {
                      mockRepayment.push({
                          date: new Date(d),
                          onTime: Math.random() > 0.15 ? 1 : 0, // Mostly on time
                          late: Math.random() > 0.85 ? 1 : 0 // Rarely late
                      });
                  }
                }

                const mockCategoryData: CategoryData[] = Array.from(mockCategoriesMap.entries())
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value);

                setRawSpendingData(mockSpending); // Ensure dates are Date objects already
                setRawRepaymentData(mockRepayment);
                setCategoryData(mockCategoryData);
                console.log("Mock Data Generated - Spending:", mockSpending.length, "Repayment:", mockRepayment.length, "Categories:", mockCategoryData.length);
                // --- END MOCK DATA ---

            } catch (err: any) {
                console.error("Failed to load or generate mock data:", err);
                // Keep previous error state if mock data fails, otherwise clear it
                if (!rawSpendingData.length) { // Check if data was actually set
                    setError(`Failed to load insights: ${err.message || 'Please try again.'}`);
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user?.id]); // Depend only on user.id

    useEffect(() => {
        const loadSelection = async () => {
            try {
                const savedSelection = await AsyncStorage.getItem(ASYNC_STORAGE_METRICS_KEY);
                if (savedSelection) {
                    setSelectedAdvancedMetrics(JSON.parse(savedSelection));
                }
            } catch (error) {
                console.error("Error reading metrics selection from AsyncStorage:", error);
            }
        };
        loadSelection();
    }, []);

    // Restore handlers
    const handleMetricSelectionChange = async (key: string) => {
        const newSelection = selectedAdvancedMetrics.includes(key)
            ? selectedAdvancedMetrics.filter(k => k !== key)
            : [...selectedAdvancedMetrics, key];
        setSelectedAdvancedMetrics(newSelection);
        try {
            await AsyncStorage.setItem(ASYNC_STORAGE_METRICS_KEY, JSON.stringify(newSelection));
        } catch (error) {
            console.error("Error saving metrics selection to AsyncStorage:", error);
        }
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined, type: 'start' | 'end') => {
        const currentDate = selectedDate || (type === 'start' ? startDate : endDate);
        setShowStartDatePicker(Platform.OS === 'ios'); // Keep open on iOS until done
        setShowEndDatePicker(Platform.OS === 'ios');

        if (type === 'start') {
            setShowStartDatePicker(false); // Close picker on selection for Android/Web
            setStartDate(currentDate);
            // Ensure start date is not after end date
            if (currentDate > endDate) {
                setEndDate(currentDate);
            }
        } else {
             setShowEndDatePicker(false);
            setEndDate(currentDate);
            // Ensure end date is not before start date
            if (currentDate < startDate) {
                setStartDate(currentDate);
            }
        }
    };

    const showPicker = (type: 'start' | 'end') => {
        if (type === 'start') {
            setShowStartDatePicker(true);
        } else {
            setShowEndDatePicker(true);
        }
    };

    const handleAggregationChange = (period: AggregationPeriod) => {
        setAggregationPeriod(period);
    };

    // --- Chart Rendering Functions (Modified for Platform & Size) ---

    const renderSpendingChart = () => {
        if (!aggregatedSpendingData.length) return <Text style={styles.noDataText}>No spending data available for this period.</Text>;
        const chartData = aggregatedSpendingData.map(item => ({
            x: item.period,
            y: item.amount,
            label: `${item.period}\n$${item.amount.toFixed(2)}`
        }));

        // Common Axis and Tooltip props
        const commonAxisProps = {
            tickFormat: (tick: any) => {
                const tickStr = String(tick);
                return tickStr.length > 10 ? `${tickStr.substring(0, 7)}...` : tickStr;
            },
            style: {
                tickLabels: { fontSize: 9, padding: 5, angle: -20, textAnchor: 'end' },
                grid: { stroke: appColors.lightGray, strokeWidth: 0.5 }
            }
        };
        const commonDependentAxisProps = {
            dependentAxis: true,
            tickFormat: (tick: any) => `$${Number(tick) / 1000}k`,
            style: {
                tickLabels: { fontSize: 10, padding: 5 },
                grid: { stroke: appColors.lightGray, strokeWidth: 0.5 }
            }
        };
        const commonTooltip = <VictoryTooltip dy={0} centerOffset={{ x: 25 }} renderInPortal={false} />;

        let chartComponent;
        switch (spendingChartType) {
            case 'line':
                chartComponent = (
                    <VictoryLine
                        data={chartData}
                        style={{ data: { stroke: appColors.primary, strokeWidth: 2 } }}
                        labels={({ datum }: any) => datum.label}
                        labelComponent={commonTooltip}
                        animate={{ duration: 500 }}
                    />
                );
                break;
            case 'area':
                chartComponent = (
                    <VictoryArea
                        data={chartData}
                        style={{ data: { fill: appColors.primary, fillOpacity: 0.3, stroke: appColors.primary, strokeWidth: 1 } }}
                        labels={({ datum }: any) => datum.label}
                        labelComponent={commonTooltip}
                        animate={{ duration: 500 }}
                    />
                );
                break;
            case 'bar':
            default:
                chartComponent = (
                    <VictoryBar
                        data={chartData}
                        style={{ data: { fill: appColors.primary, width: 15 } }}
                        labels={({ datum }: any) => datum.label}
                        labelComponent={commonTooltip}
                        animate={{ duration: 500 }}
                    />
                );
                break;
        }

        const chart = (
            <VictoryChart
                domainPadding={{ x: spendingChartType === 'bar' ? 25 : 0 }}
                height={300} // <-- UPDATED HEIGHT
                padding={{ top: 30, bottom: 50, left: 60, right: 30 }}
            >
                <VictoryAxis {...commonAxisProps} />
                <VictoryAxis {...commonDependentAxisProps} />
                {chartComponent}
            </VictoryChart>
        );

        // Conditionally wrap
        if (Platform.OS === 'web') {
            return <div style={{ height: 300, width: '100%' }}>{chart}</div>;
        } else {
            return <Svg height={300} width={Dimensions.get('window').width - 60}>{chart}</Svg>;
        }
    };

    const renderCategoryChart = () => {
        // Restore original chart logic
        if (!categoryData.length) return <Text style={styles.noDataText}>No category data available.</Text>;
        const chartData = categoryData.slice(0, 5).map(item => ({
            x: item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name,
            y: item.value,
            label: `${item.name}\n$${item.value.toFixed(2)}` // Tooltip label
        }));

        const chart = (
             <VictoryPie
                standalone={Platform.OS === 'web' ? true : false} // Use true for web, false for native
                width={Dimensions.get('window').width - 60} height={300} // <-- UPDATED HEIGHT
                data={chartData}
                colorScale={CHART_COLORS}
                innerRadius={50}
                padAngle={2}
                labelRadius={({ innerRadius }: any) => (innerRadius || 0) + 10}
                style={{
                    labels: { fill: appColors.dark, fontSize: 10, padding: 8 },
                    data: { fillOpacity: 0.9, stroke: appColors.white, strokeWidth: 1 }
                }}
                labels={({ datum }: any) => datum.x}
                labelComponent={<VictoryLabel angle={0} />}
            />
        );

        // Conditionally wrap
        if (Platform.OS === 'web') {
             return <div style={{ width: '100%', height: 300 }}>{chart}</div>;
        } else {
             return (
                 <Svg height={300} width={Dimensions.get('window').width - 60}>
                     {chart}
                 </Svg>
            );
        }
    };

     const renderRepaymentChart = () => {
        if (!aggregatedRepaymentData.length) return <Text style={styles.noDataText}>No repayment data available.</Text>;
        const onTimeData = aggregatedRepaymentData.map(item => ({ x: item.period, y: item.onTime || 0 }));
        const lateData = aggregatedRepaymentData.map(item => ({ x: item.period, y: item.late || 0 }));

        const chart = (
            <VictoryChart
                domainPadding={{ x: 25 }}
                height={300} // <-- UPDATED HEIGHT
                 padding={{ top: 30, bottom: 50, left: 60, right: 30 }}
            >
                 <VictoryAxis
                    tickFormat={(tick: any) => {
                         const tickStr = String(tick);
                         return tickStr.length > 10 ? `${tickStr.substring(0, 7)}...` : tickStr;
                     }}
                    style={{
                        tickLabels: { fontSize: 9, padding: 5, angle: -20, textAnchor: 'end' },
                         grid: { stroke: appColors.lightGray, strokeWidth: 0.5 }
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={(tick: any) => `${tick}`}
                    style={{
                        tickLabels: { fontSize: 10, padding: 5 },
                        grid: { stroke: appColors.lightGray, strokeWidth: 0.5 }
                    }}
                />
                <VictoryStack colorScale={[REPAYMENT_COLORS.onTime, REPAYMENT_COLORS.late]}>
                    <VictoryBar
                        data={onTimeData}
                         style={{ data: { width: 15 } }}
                         animate={{ duration: 500 }}
                     />
                    <VictoryBar
                        data={lateData}
                         style={{ data: { width: 15 } }}
                         animate={{ duration: 500 }}
                     />
                </VictoryStack>
                {/* TODO: Add VictoryLegend */}
            </VictoryChart>
        );

        // Conditionally wrap
        if (Platform.OS === 'web') {
             return <div style={{ height: 300, width: '100%' }}>{chart}</div>;
        } else {
            return <Svg height={300} width={Dimensions.get('window').width - 60}>{chart}</Svg>;
        }
    };

    const renderMonthlyChart = () => {
         if (!monthlyBreakdown.length) return <Text style={styles.noDataText}>No monthly breakdown available.</Text>;
        const chartData = monthlyBreakdown.slice(0, 5).map(item => ({
            x: item.category.length > 15 ? `${item.category.substring(0, 12)}...` : item.category,
            y: item.amount,
            label: `${item.category}\n$${item.amount.toFixed(2)} (${(item.percentage || 0).toFixed(0)}%)`
        }));

        const chart = (
             <VictoryPie
                standalone={Platform.OS === 'web' ? true : false}
                width={Dimensions.get('window').width - 60} height={250} // <-- HEIGHT REMAINS 250
                data={chartData}
                colorScale={CHART_COLORS}
                innerRadius={40}
                padAngle={2}
                 labelRadius={({ innerRadius }: any) => (innerRadius || 0) + 8}
                style={{
                    labels: { fill: appColors.dark, fontSize: 9, padding: 5 },
                    data: { fillOpacity: 0.9, stroke: appColors.white, strokeWidth: 1 }
                }}
                 labels={({ datum }: any) => {
                     const total = monthlyBreakdown.reduce((sum, d: MonthlyBreakdown) => sum + d.amount, 0);
                     const percentage = total > 0 ? (datum.y / total * 100).toFixed(0) : 0;
                     return `${datum.x}\n(${percentage}%)`;
                 }}
                 labelComponent={<VictoryLabel angle={0} />}
            />
        );

        // Conditionally wrap
        if (Platform.OS === 'web') {
             return <div style={{ width: '100%', height: 250 }}>{chart}</div>;
        } else {
             return (
                 <Svg height={250} width={Dimensions.get('window').width - 60}>
                     {chart}
                 </Svg>
             );
        }
    }

    // --- Main Render (Restore full structure) ---
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Stack.Screen options={{ title: 'Insights' }} />

            {/* Date Range Selection */}
            <View style={styles.dateRangeContainer}>
                 <TouchableOpacity onPress={() => showPicker('start')} style={styles.dateButton}>
                    <Text style={styles.dateText}>{formatDateLabel(startDate)}</Text>
                 </TouchableOpacity>
                 <Text style={{color: appColors.gray}}> to </Text>
                 <TouchableOpacity onPress={() => showPicker('end')} style={styles.dateButton}>
                     <Text style={styles.dateText}>{formatDateLabel(endDate)}</Text>
                 </TouchableOpacity>
            </View>

             {/* DateTimePicker Modals */}
             {showStartDatePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => onDateChange(event, date, 'start')}
                    maximumDate={endDate} // Cannot select start date after end date
                />
            )}
            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => onDateChange(event, date, 'end')}
                    minimumDate={startDate} // Cannot select end date before start date
                    maximumDate={new Date()} // Cannot select future date
                />
            )}

            {/* Aggregation Period Selection */}
            <View style={styles.aggregationContainer}>
                 <Text style={styles.label}>Aggregate by:</Text>
                 {(['monthly', 'weekly', 'daily'] as AggregationPeriod[]).map(period => (
                     <TouchableOpacity
                        key={period}
                        style={[styles.aggButton, aggregationPeriod === period && styles.aggButtonSelected]}
                        onPress={() => handleAggregationChange(period)}
                    >
                        <Text style={[styles.aggButtonText, aggregationPeriod === period && styles.aggButtonTextSelected]}>
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                         </Text>
                     </TouchableOpacity>
                 ))}
             </View>


            {/* Loading and Error States */}
            {loading && (
                <ActivityIndicator size="large" color={appColors.primary} style={{ marginVertical: 30 }} />
            )}
            {error && !loading && (
                 <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    {/* Optional: Add a retry button */}
                 </View>
            )}

             {/* Chart Sections */} 
            {!loading && !error && (
                <>
                    {/* Spending Trends Chart */} 
                    <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Spending Trends ({aggregationPeriod})</Text>
                        {/* Chart Type Toggle Buttons */} 
                        <View style={styles.chartToggleContainer}>
                            {(['bar', 'line', 'area'] as ChartType[]).map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.chartToggleButton,
                                        spendingChartType === type && styles.chartToggleButtonSelected
                                    ]}
                                    onPress={() => setSpendingChartType(type)}
                                >
                                    <Text style={[
                                        styles.chartToggleButtonText,
                                        spendingChartType === type && styles.chartToggleButtonTextSelected
                                    ]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {aggregatedSpendingData.length > 0
                            ? renderSpendingChart()
                            : <Text style={styles.noDataText}>No spending data for selected period.</Text>
                        }
                    </View>

                    {/* Category Breakdown Chart */}
                     <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Spending by Category</Text>
                         {categoryData.length > 0
                            ? renderCategoryChart()
                            : <Text style={styles.noDataText}>No category data available.</Text>
                         }
                     </View>

                     {/* Repayment Trends Chart */}
                     <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Repayment Trends ({aggregationPeriod})</Text>
                        {aggregatedRepaymentData.length > 0
                             ? renderRepaymentChart()
                             : <Text style={styles.noDataText}>No repayment data for selected period.</Text>
                        }
                     </View>

                     {/* Monthly Breakdown Chart (Example) */}
                     <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Monthly Spending Breakdown</Text>
                        {monthlyBreakdown.length > 0
                            ? renderMonthlyChart()
                             : <Text style={styles.noDataText}>No spending data for breakdown.</Text>
                         }
                     </View>

                    {/* TODO: Add Advanced Metrics Section */}
                    {/* <View style={styles.sectionContainer}>
                       <Text style={styles.sectionTitle}>Advanced Metrics</Text>
                       ... render selected metrics ...
                    </View> */}

                     {/* TODO: Add Metric Customization Section */}
                     {/* <View style={styles.sectionContainer}>
                         <Text style={styles.sectionTitle}>Customize Metrics</Text>
                         ... render toggles for availableAdvancedMetrics ...
                     </View> */}
                 </>
             )}

        </ScrollView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appColors.lightGray,
    },
    contentContainer: {
        padding: 15,
        paddingBottom: 40, // Extra padding at bottom
    },
    errorContainer: {
         backgroundColor: appColors.ultraLightGray,
         borderColor: appColors.danger,
         borderWidth: 1,
         padding: 15,
         borderRadius: 8,
         marginVertical: 15,
         alignItems: 'center',
    },
    errorText: {
        color: appColors.danger,
        fontSize: 14,
        textAlign: 'center',
    },
    dateRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: appColors.white,
        paddingVertical: 10,
        borderRadius: 8,
    },
    dateButton: {
        padding: 10,
        // backgroundColor: appColors.lightGray,
        borderRadius: 5,
    },
    dateText: {
       color: appColors.primary,
       fontWeight: '500',
    },
    aggregationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'center', // Center buttons
        flexWrap: 'wrap', // Allow buttons to wrap on small screens
    },
    label: {
        marginRight: 10,
        fontSize: 14,
        fontWeight: '500',
        color: appColors.gray,
    },
    aggButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20, // Pill shape
        backgroundColor: '#e9ecef', // Light grey background
        marginHorizontal: 5,
        marginVertical: 3, // Add vertical margin for wrapping
    },
    aggButtonSelected: {
        backgroundColor: appColors.primary, // Primary color when selected
    },
    aggButtonText: {
        color: '#495057', // Dark grey text
        fontSize: 12,
    },
    aggButtonTextSelected: {
        color: '#fff', // White text when selected
        fontWeight: 'bold',
    },
    chartContainer: {
        marginBottom: 30,
        backgroundColor: '#fff', // White background for charts
        borderRadius: 8,
        paddingVertical: 15,
        paddingHorizontal: 5, // Reduce horizontal padding for chart SVG
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3, // for Android shadow
        alignItems: 'center', // Center chart SVG if needed
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
        color: '#444',
    },
    noDataText: {
        textAlign: 'center',
        color: '#6c757d', // Grey text for no data
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 10, // Padding for text within container
    },
    sectionContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        // Add shadows like chartContainer if desired
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#444',
    },
     metricRow: { // Example style if implementing metric toggles
         flexDirection: 'row',
         justifyContent: 'space-between',
         alignItems: 'center',
         paddingVertical: 8,
     },
    chartToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
    },
    chartToggleButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        backgroundColor: appColors.lightGray,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: appColors.mediumGray,
    },
    chartToggleButtonSelected: {
        backgroundColor: appColors.primary,
        borderColor: appColors.primary,
    },
    chartToggleButtonText: {
        fontSize: 11,
        color: appColors.dark,
    },
    chartToggleButtonTextSelected: {
        color: appColors.white,
        fontWeight: 'bold',
    },
});

export default InsightsScreen;
