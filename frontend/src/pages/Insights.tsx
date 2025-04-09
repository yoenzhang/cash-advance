import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApplication } from '../context/ApplicationContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, Scatter
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'composed';
type AggregationPeriod = 'monthly' | 'weekly' | 'daily';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to format date for aggregation keys
const formatDateKey = (date: Date, period: AggregationPeriod): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const week = Math.ceil(day / 7);

  switch (period) {
    case 'daily':
      return date.toISOString().split('T')[0];
    case 'weekly':
      return `${year}-W${week}`;
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
  
  const [creditUtilization, setCreditUtilization] = useState<number>(0);
  const [averageRepaymentTime, setAverageRepaymentTime] = useState<number>(0);
  const [totalAdvances, setTotalAdvances] = useState<number>(0);
  
  // Date Range State
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
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

  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
        <div className="custom-tooltip" dangerouslySetInnerHTML={{ __html: text }}>
        </div>
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
      generatedSpending.push({
        date: new Date(d),
        amount: 50 + Math.floor(Math.random() * 150)
      });

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

    const demoCategoryData: CategoryData[] = [
      { name: 'Groceries', value: Math.floor(Math.random() * 1000) + 500 },
      { name: 'Housing', value: Math.floor(Math.random() * 1500) + 1000 },
      { name: 'Transport', value: Math.floor(Math.random() * 500) + 200 },
      { name: 'Utilities', value: Math.floor(Math.random() * 400) + 150 },
      { name: 'Entertainment', value: Math.floor(Math.random() * 300) + 100 }
    ];
    setCategoryData(demoCategoryData);

    setCreditUtilization(60 + Math.floor(Math.random() * 15)); 
    setAverageRepaymentTime(15 + Math.floor(Math.random() * 10)); 
    setTotalAdvances(applications?.length || 0);

    setLoading(false);
  }, [applications]);

  // Aggregate data based on date range and period
  useEffect(() => {
    if (!rawSpendingData.length && !rawRepaymentData.length) return;

    setLoading(true);

    const filteredSpending = rawSpendingData.filter(d => d.date >= startDate && d.date <= endDate);
    const filteredRepayment = rawRepaymentData.filter(d => d.date >= startDate && d.date <= endDate);

    const spendingMap = new Map<string, number>();
    filteredSpending.forEach(item => {
      const key = formatDateKey(item.date, aggregationPeriod);
      spendingMap.set(key, (spendingMap.get(key) || 0) + item.amount);
    });
    const aggSpending: AggregatedSpendingData[] = Array.from(spendingMap, ([period, amount]) => ({ period, amount }));
    
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

    aggSpending.sort((a, b) => a.period.localeCompare(b.period)); 
    aggRepayment.sort((a, b) => a.period.localeCompare(b.period));

    setAggregatedSpendingData(aggSpending);
    setAggregatedRepaymentData(aggRepayment);

    let cumulativeAmount = 0;
    const cumulativeData = aggSpending.map(item => {
      cumulativeAmount += item.amount;
      return {
        period: item.period,
        amount: cumulativeAmount
      };
    });
    setCumulativeSpendingData(cumulativeData);
    
    const lastMonthInBreakdown = endDate.getMonth();
    updateMonthlyBreakdown(MONTHS[lastMonthInBreakdown]);

    setLoading(false);
    setDrillDownData(null);

  }, [rawSpendingData, rawRepaymentData, startDate, endDate, aggregationPeriod]);

  // Update monthly breakdown when month concept changes (or for drill-down maybe)
  const updateMonthlyBreakdown = (monthKey: string) => {
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
  };

  // Handle Date Range Change
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
    } else if (start) {
        setStartDate(start);
    }
  };
  
  // Handle Aggregation Period Change
   const handleAggregationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     setAggregationPeriod(e.target.value as AggregationPeriod);
   };

  // Handle Drill Down Click
  const handleBarClick = (data: any, index: number) => {
    if (!data || !data.activePayload || !data.activePayload.length) {
      setDrillDownData(null);
      setDrillDownPeriod(null);
      return;
    }
    
    const clickedPeriod = data.activePayload[0].payload.period;
    setDrillDownPeriod(clickedPeriod);

    let detailedData: DailySpendingDetail[] = [];
    
    const periodParts = clickedPeriod.split(' ');
    
    rawSpendingData.forEach(item => {
      let itemPeriodKey: string | null = null;
      try {
         itemPeriodKey = formatDateKey(item.date, aggregationPeriod);
      } catch (e) { /* handle potential date errors */ }

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
  };

  // Render chart based on selected type
  const renderSpendingChart = () => {
    const dataToUse = aggregatedSpendingData;
    const cumulativeData = cumulativeSpendingData;

    switch (spendingChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dataToUse}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onClick={handleBarClick}
            >
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
            <LineChart
              data={dataToUse}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#4361ee" 
                strokeWidth={2}
                activeDot={{ r: 8, style: { cursor: 'pointer' } }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={dataToUse}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#4361ee"
                fill="#4361ee" 
                fillOpacity={0.3}
                activeDot={{ r: 6, style: { cursor: 'pointer' } }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={dataToUse}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onClick={handleBarClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="amount" yAxisId="left" barSize={20} fill="#4361ee" name="Spending" cursor="pointer" />
              <Line 
                type="monotone" 
                yAxisId="right"
                data={cumulativeData}
                dataKey="amount" 
                stroke="#ff7300"
                name="Cumulative"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
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
  };
  
  const renderCategoryChart = (): React.ReactElement => {
    switch (categoryChartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
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
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 90, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar 
                dataKey="value" 
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
              >
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
  };
  
  const renderRepaymentChart = (): React.ReactElement => {
    switch (repaymentChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={aggregatedRepaymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
            <LineChart
              data={aggregatedRepaymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
            <AreaChart
              data={aggregatedRepaymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
  };
  
  const renderMonthlyChart = (): React.ReactElement => {
    switch (monthlyChartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={monthlyBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="amount"
              >
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
            <BarChart
              data={monthlyBreakdown}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
            >
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
  };

  if (loading && (!aggregatedSpendingData.length || !aggregatedRepaymentData.length)) {
    return <div className="loading">Loading insights...</div>;
  }

  return (
    <div className="insights-page">
      <h1>Financial Insights</h1>
      <p className="subtitle">Track your financial performance and spending patterns</p>
      
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
            <label htmlFor="aggregation-period">Aggregate By:</label>
            <select 
              id="aggregation-period" 
              value={aggregationPeriod} 
              onChange={handleAggregationChange}
              className="aggregation-dropdown"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
        <p className="selected-range-label">Showing data for: {getDateRangeLabel(startDate, endDate)}</p>
      </div>

      <div className="insights-grid">
        <div className="card metric-card">
          <div className="card-title">Total Cash Advances</div>
          <div className="metric-value">{totalAdvances}</div>
          <div className="card-subtitle">Lifetime total</div>
        </div>
        
        <div className="card metric-card">
          <div className="card-title">Avg Spending / {aggregationPeriod.replace('ly', '')}</div>
          <div className="metric-value">
            ${(aggregatedSpendingData.reduce((sum, item) => sum + item.amount, 0) / (aggregatedSpendingData.length || 1)).toFixed(2)}
          </div>
          <div className="card-subtitle">Selected period average</div>
        </div>
        
        <div className="card metric-card">
          <div className="card-title">Total Spending</div>
          <div className="metric-value">
            ${aggregatedSpendingData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
          </div>
          <div className="card-subtitle">In selected period</div>
        </div>
      </div>
      
      {drillDownData && drillDownPeriod && (
        <div id="drill-down-section" className="card mt-4 drill-down-card">
          <h2>Spending Details for {drillDownPeriod}</h2>
          {drillDownData.length > 0 ? (
            <table className="drill-down-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {drillDownData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td>{item.description}</td>
                    <td>${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No detailed spending data available for this period.</p>
          )}
           <button onClick={() => { setDrillDownData(null); setDrillDownPeriod(null); }} className="close-drilldown-btn">
             Close Details
           </button>
        </div>
      )}

      <div className="charts-section">
        <div className="card mt-4">
          <div className="chart-header">
            <h2>Spending Trends</h2>
            <div className="chart-controls">
              <label htmlFor="spending-chart-type">Chart Type: </label>
              <select
                id="spending-chart-type"
                value={spendingChartType}
                onChange={(e) => setSpendingChartType(e.target.value as ChartType)}
                className="chart-type-dropdown"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="composed">Composed Chart</option>
              </select>
            </div>
          </div>
          <div className="chart-container">
            {renderSpendingChart()}
            {spendingChartType === 'bar' && <p className="chart-hint">Click on a bar to see daily details.</p>}
          </div>
        </div>
        
        <div className="card mt-4">
          <div className="chart-header">
            <h2>Spending by Category</h2>
            <div className="chart-controls">
              <label htmlFor="category-chart-type">Chart Type: </label>
              <select
                id="category-chart-type"
                value={categoryChartType}
                onChange={(e) => setCategoryChartType(e.target.value as ChartType)}
                className="chart-type-dropdown"
              >
                <option value="pie">Pie Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
          </div>
           <p className="chart-hint">(Categories shown for the entire selected period)</p>
          <div className="chart-container">
            {renderCategoryChart()}
          </div>
        </div>
        
        <div className="card mt-4">
          <div className="chart-header">
            <h2>Repayment Performance</h2>
            <div className="chart-controls">
              <label htmlFor="repayment-chart-type">Chart Type: </label>
              <select
                id="repayment-chart-type"
                value={repaymentChartType}
                onChange={(e) => setRepaymentChartType(e.target.value as ChartType)}
                className="chart-type-dropdown"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
              </select>
            </div>
          </div>
          <div className="chart-container">
            {renderRepaymentChart()}
          </div>
        </div>
      </div>
      
      <div className="card mt-5">
        <div className="monthly-breakdown-header">
          <h2>Breakdown for {MONTHS[endDate.getMonth()]} {endDate.getFullYear()}</h2>
          <div className="chart-controls">
            <label htmlFor="monthly-chart-type">Chart Type: </label>
            <select
              id="monthly-chart-type"
              value={monthlyChartType}
              onChange={(e) => setMonthlyChartType(e.target.value as ChartType)}
              className="chart-type-dropdown"
            >
              <option value="pie">Donut Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
        </div>
        
        <div className="monthly-breakdown-content">
          <div className="monthly-charts">
            <div className="monthly-pie-chart">
              {renderMonthlyChart()}
            </div>
            
            <div className="monthly-breakdown-table">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyBreakdown.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <span className="category-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        {item.category}
                      </td>
                      <td>${item.amount.toLocaleString()}</td>
                      <td>{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td>
                      <strong>
                        ${monthlyBreakdown.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>{monthlyBreakdown.reduce((sum, item) => sum + item.percentage, 0) > 0 ? '100%' : '0%'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
      
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