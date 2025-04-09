import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApplication } from '../context/ApplicationContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, Scatter
} from 'recharts';

// Types for our data
interface SpendingData {
  month: string;
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
  month: string;
  onTime: number;
  late: number;
}

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'composed';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Insights: React.FC = () => {
  const { user } = useAuth();
  const { applications } = useApplication();
  const [loading, setLoading] = useState<boolean>(true);
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [repaymentData, setRepaymentData] = useState<RepaymentData[]>([]);
  const [creditUtilization, setCreditUtilization] = useState<number>(0);
  const [averageRepaymentTime, setAverageRepaymentTime] = useState<number>(0);
  const [totalAdvances, setTotalAdvances] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  
  // Chart type state
  const [spendingChartType, setSpendingChartType] = useState<ChartType>('bar');
  const [categoryChartType, setCategoryChartType] = useState<ChartType>('pie');
  const [repaymentChartType, setRepaymentChartType] = useState<ChartType>('bar');
  const [monthlyChartType, setMonthlyChartType] = useState<ChartType>('pie');

  // Calculate cumulative data for line charts
  const [cumulativeSpendingData, setCumulativeSpendingData] = useState<SpendingData[]>([]);

  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label} : $${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    // This would normally fetch data from an API
    // For demo purposes, we'll generate some sample data
    setLoading(true);
    
    // Example spending data (last 6 months)
    const currentMonth = new Date().getMonth();
    const demoSpendingData: SpendingData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      demoSpendingData.push({
        month: MONTHS[monthIndex],
        amount: 1000 + Math.floor(Math.random() * 2000)
      });
    }
    
    // Calculate cumulative spending data
    let cumulativeAmount = 0;
    const demoCumulativeData = demoSpendingData.map(item => {
      cumulativeAmount += item.amount;
      return {
        month: item.month,
        amount: cumulativeAmount
      };
    });
    
    // Example category data
    const demoCategoryData: CategoryData[] = [
      { name: 'Groceries', value: 950 },
      { name: 'Housing', value: 1500 },
      { name: 'Transport', value: 450 },
      { name: 'Utilities', value: 350 },
      { name: 'Entertainment', value: 250 }
    ];
    
    // Example repayment data
    const demoRepaymentData: RepaymentData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      demoRepaymentData.push({
        month: MONTHS[monthIndex],
        onTime: Math.floor(Math.random() * 3) + 1,
        late: Math.floor(Math.random() * 2)
      });
    }

    // Example monthly breakdown - will update based on selected month
    updateMonthlyBreakdown(MONTHS[currentMonth]);
    
    setSpendingData(demoSpendingData);
    setCumulativeSpendingData(demoCumulativeData);
    setCategoryData(demoCategoryData);
    setRepaymentData(demoRepaymentData);
    setCreditUtilization(65); // 65% utilization example
    setAverageRepaymentTime(18); // 18 days average
    setTotalAdvances(applications?.length || 0);
    
    setLoading(false);
  }, [applications]);

  // Update monthly breakdown when month changes
  const updateMonthlyBreakdown = (month: string) => {
    // In a real app, this would fetch data from an API based on the selected month
    const demoMonthlyBreakdown: MonthlyBreakdown[] = [
      { category: 'Groceries', amount: 850 + Math.floor(Math.random() * 200), percentage: 0 },
      { category: 'Housing', amount: 1400 + Math.floor(Math.random() * 300), percentage: 0 },
      { category: 'Transport', amount: 350 + Math.floor(Math.random() * 150), percentage: 0 },
      { category: 'Utilities', amount: 250 + Math.floor(Math.random() * 150), percentage: 0 },
      { category: 'Entertainment', amount: 150 + Math.floor(Math.random() * 150), percentage: 0 }
    ];
    
    // Calculate percentages
    const total = demoMonthlyBreakdown.reduce((sum, item) => sum + item.amount, 0);
    const withPercentages = demoMonthlyBreakdown.map(item => ({
      ...item,
      percentage: Math.round((item.amount / total) * 100)
    }));
    
    setMonthlyBreakdown(withPercentages);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
    updateMonthlyBreakdown(e.target.value);
  };
  
  // Render chart based on selected type
  const renderSpendingChart = () => {
    switch (spendingChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={spendingData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#4361ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={spendingData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#4361ee" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={spendingData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#4361ee"
                fill="#4361ee" 
                fillOpacity={0.2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={spendingData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="amount" barSize={20} fill="#4361ee" name="Monthly Spending" />
              <Line 
                type="monotone" 
                data={cumulativeSpendingData}
                dataKey="amount" 
                stroke="#ff7300"
                name="Cumulative Spending"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={spendingData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#4361ee" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };
  
  const renderCategoryChart = () => {
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
              <Tooltip formatter={(value) => `$${value}`} />
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
              <Tooltip formatter={(value) => `$${value}`} />
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
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };
  
  const renderRepaymentChart = () => {
    switch (repaymentChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={repaymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTime" name="On-time Payments" stackId="a" fill="#4cc9f0" />
              <Bar dataKey="late" name="Late Payments" stackId="a" fill="#f72585" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={repaymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="onTime" name="On-time Payments" stroke="#4cc9f0" strokeWidth={2} />
              <Line type="monotone" dataKey="late" name="Late Payments" stroke="#f72585" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={repaymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="onTime" 
                name="On-time Payments" 
                stackId="1"
                stroke="#4cc9f0" 
                fill="#4cc9f0" 
                fillOpacity={0.6} 
              />
              <Area 
                type="monotone" 
                dataKey="late" 
                name="Late Payments" 
                stackId="1"
                stroke="#f72585" 
                fill="#f72585" 
                fillOpacity={0.6} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={repaymentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTime" name="On-time Payments" stackId="a" fill="#4cc9f0" />
              <Bar dataKey="late" name="Late Payments" stackId="a" fill="#f72585" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };
  
  const renderMonthlyChart = () => {
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
              <Tooltip formatter={(value) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={monthlyBreakdown}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 90, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="category" width={80} />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar 
                dataKey="amount" 
                radius={[0, 4, 4, 0]}
              >
                {monthlyBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      default:
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
              <Tooltip formatter={(value) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return <div className="loading">Loading insights...</div>;
  }

  return (
    <div className="insights-page">
      <h1>Financial Insights</h1>
      <p className="subtitle">Track your financial performance and spending patterns</p>
      
      {/* Key metrics cards */}
      <div className="insights-grid">
        <div className="card metric-card">
          <div className="card-title">Total Cash Advances</div>
          <div className="metric-value">{totalAdvances}</div>
          <div className="card-subtitle">Lifetime total</div>
        </div>
        
        <div className="card metric-card">
          <div className="card-title">Credit Utilization</div>
          <div className="metric-value">{creditUtilization}%</div>
          <div className="card-subtitle">
            {creditUtilization > 70 ? 'High utilization' : 'Healthy range'}
          </div>
        </div>
        
        <div className="card metric-card">
          <div className="card-title">Avg. Repayment Time</div>
          <div className="metric-value">{averageRepaymentTime} days</div>
          <div className="card-subtitle">Across all advances</div>
        </div>
      </div>
      
      {/* Top Charts Section */}
      <div className="charts-section">
        {/* Spending Trends Chart */}
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
          </div>
        </div>
        
        {/* Spending by Category Chart */}
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
          <div className="chart-container">
            {renderCategoryChart()}
          </div>
        </div>
        
        {/* Repayment Performance Chart */}
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
      
      {/* Monthly Spending Breakdown Section */}
      <div className="card mt-5">
        <div className="monthly-breakdown-header">
          <h2>Monthly Spending Breakdown</h2>
          <div className="monthly-controls">
            <div className="month-selector">
              <label htmlFor="month-select">Select Month: </label>
              <select 
                id="month-select" 
                value={selectedMonth}
                onChange={handleMonthChange}
                className="month-dropdown"
              >
                {MONTHS.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
            <div className="chart-controls ml-3">
              <label htmlFor="monthly-chart-type">Chart Type: </label>
              <select
                id="monthly-chart-type"
                value={monthlyChartType}
                onChange={(e) => setMonthlyChartType(e.target.value as ChartType)}
                className="chart-type-dropdown"
              >
                <option value="pie">Pie Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
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
                    <td>100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Financial Tips */}
      <div className="card mt-4">
        <h2>Personalized Tips</h2>
        <ul className="tips-list">
          <li>
            <span className="tip-icon">💡</span>
            <div>
              <h4>Optimize Your Credit Utilization</h4>
              <p>Keeping your utilization below 70% can help maintain financial flexibility.</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">⏱️</span>
            <div>
              <h4>Early Repayments</h4>
              <p>Repaying advances earlier can improve your repayment score and may qualify you for higher limits.</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">📊</span>
            <div>
              <h4>Consistent Usage</h4>
              <p>Regular and responsible use of cash advances can help build a stronger financial profile.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Insights; 