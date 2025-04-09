# Insights Page Charts Documentation

This document provides an overview of the charting functionality implemented in the Insights page, explaining how to maintain and extend the charts as needed.

## Overview

The Insights page uses [Recharts](https://recharts.org) to visualize financial data with various chart types:

- Bar Charts
- Line Charts
- Pie Charts
- Area Charts
- Composed Charts (combining multiple chart types)

Each chart section allows users to switch between different visualization types using dropdown selectors.

## Data Structure

The charts use the following data structures:

### Spending Data
```typescript
interface SpendingData {
  month: string;
  amount: number;
}
```

### Category Data
```typescript
interface CategoryData {
  name: string;
  value: number;
}
```

### Monthly Breakdown
```typescript
interface MonthlyBreakdown {
  category: string;
  amount: number;
  percentage: number;
}
```

### Repayment Data
```typescript
interface RepaymentData {
  month: string;
  onTime: number;
  late: number;
}
```

## Chart Implementation

Each chart is implemented as a separate rendering function that returns the appropriate chart type based on the selected option:

- `renderSpendingChart()`
- `renderCategoryChart()`
- `renderRepaymentChart()`
- `renderMonthlyChart()`

These functions use switch statements to return the appropriate chart component based on the selected chart type.

## How to Update Chart Data

Currently, the charts use mock data. To replace with real data from your API:

1. Locate the `useEffect` hook where the data is initialized
2. Replace the mock data creation with API calls:

```typescript
useEffect(() => {
  setLoading(true);
  
  // Replace this with real API calls
  const fetchData = async () => {
    try {
      const spendingResponse = await api.getSpendingData();
      const categoryResponse = await api.getCategoryData();
      const repaymentResponse = await api.getRepaymentData();
      
      setSpendingData(spendingResponse.data);
      setCategoryData(categoryResponse.data);
      setRepaymentData(repaymentResponse.data);
      
      // Calculate cumulative data if needed
      let cumulativeAmount = 0;
      const cumulativeData = spendingResponse.data.map(item => {
        cumulativeAmount += item.amount;
        return {
          month: item.month,
          amount: cumulativeAmount
        };
      });
      setCumulativeSpendingData(cumulativeData);
      
      // Other state updates...
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

## How to Add a New Chart Type

To add a new chart type:

1. Update the `ChartType` type definition:

```typescript
type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'composed' | 'your-new-type';
```

2. Add the new chart type to the dropdown options in the relevant section:

```jsx
<select
  id="spending-chart-type"
  value={spendingChartType}
  onChange={(e) => setSpendingChartType(e.target.value as ChartType)}
  className="chart-type-dropdown"
>
  {/* Existing options */}
  <option value="your-new-type">Your New Chart</option>
</select>
```

3. Update the render function to handle the new chart type:

```typescript
const renderSpendingChart = () => {
  switch (spendingChartType) {
    // Existing cases...
    
    case 'your-new-type':
      return (
        <ResponsiveContainer width="100%" height={300}>
          {/* Your new chart implementation */}
        </ResponsiveContainer>
      );
    
    default:
      // Default chart...
  }
};
```

## Adding New Metrics or Chart Sections

To add a new chart section:

1. Define a new state variable for the chart type:

```typescript
const [newMetricChartType, setNewMetricChartType] = useState<ChartType>('bar');
```

2. Create a data structure and state for your new metric

3. Create a render function for the chart

4. Add the new section to the JSX:

```jsx
<div className="card mt-4">
  <div className="chart-header">
    <h2>Your New Metric</h2>
    <div className="chart-controls">
      <label htmlFor="new-metric-chart-type">Chart Type: </label>
      <select
        id="new-metric-chart-type"
        value={newMetricChartType}
        onChange={(e) => setNewMetricChartType(e.target.value as ChartType)}
        className="chart-type-dropdown"
      >
        <option value="bar">Bar Chart</option>
        <option value="line">Line Chart</option>
        {/* Other options as needed */}
      </select>
    </div>
  </div>
  <div className="chart-container">
    {renderNewMetricChart()}
  </div>
</div>
```

## Custom Styling

Chart colors and styles can be customized:

- The `COLORS` array defines the color palette for pie and bar charts
- Each chart component accepts style props for customization
- For more extensive styling, update the CSS in `Pages.css`

## Responsive Considerations

All charts use the `<ResponsiveContainer>` component to ensure they resize properly on different screen sizes. When adding new charts, make sure to:

1. Wrap your chart with `<ResponsiveContainer>`
2. Test on different screen sizes
3. Update the responsive CSS media queries if needed

## Performance Optimization

If performance issues arise with multiple charts:

1. Consider lazy loading charts that are not immediately visible
2. Implement pagination or filters to reduce the amount of data displayed at once
3. Optimize data fetching to minimize API calls 