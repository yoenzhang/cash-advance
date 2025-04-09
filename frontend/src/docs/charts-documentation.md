# Insights Page Charts Documentation

This document provides an overview of the charting functionality implemented in the Insights page, explaining how to maintain and extend the charts as needed.

## Overview

The Insights page uses [Recharts](https://recharts.org) to visualize financial data with various chart types and interactive features:

- **Multiple Chart Types:** Bar, Line, Pie, Area, Composed charts.
- **Chart Type Toggling:** Dropdowns allow users to switch between visualization types for each metric.
- **Custom Date Range Filtering:** A date range picker allows users to select custom start and end dates.
- **Data Aggregation:** Data can be aggregated daily, weekly, or monthly based on user selection.
- **Drill-Down:** Clicking on specific data points (currently on the Spending Trends bar chart) reveals more granular details for that period.

## Data Structure

### Raw Data (Generated Fake Data)
```typescript
interface SpendingData {
  date: Date; 
  amount: number;
}

interface RepaymentData {
  date: Date; 
  onTime: number;
  late: number;
}
```

### Aggregated Data (Used by Charts)
```typescript
interface AggregatedSpendingData {
  period: string; // e.g., 'Jan 2023', '2023-W5', '2023-01-25'
  amount: number;
}

interface AggregatedRepaymentData {
  period: string;
  onTime: number;
  late: number;
}
```

### Category Data (Currently Period-Agnostic)
```typescript
interface CategoryData {
  name: string;
  value: number;
}
```

### Monthly Breakdown (For the specific monthly section)
```typescript
interface MonthlyBreakdown {
  category: string;
  amount: number;
  percentage: number;
}
```

### Drill-Down Data
```typescript
interface DailySpendingDetail {
  date: string;
  description: string;
  amount: number;
}
```

## Key Features Implementation

### Date Range Filtering

- Uses the `react-datepicker` library.
- `startDate` and `endDate` state variables control the selected range.
- `handleDateChange` function updates the state.
- An `useEffect` hook filters the `rawSpendingData` and `rawRepaymentData` based on the selected `startDate` and `endDate`.

### Data Aggregation

- The `aggregationPeriod` state (`daily`, `weekly`, `monthly`) controls how data is grouped.
- The `formatDateKey` helper function generates unique keys for each period based on the selected aggregation.
- The `useEffect` hook aggregates the filtered raw data into `aggregatedSpendingData` and `aggregatedRepaymentData` using `Map` objects.

### Drill-Down

- Implemented via the `handleBarClick` function attached to the `onClick` event of the Spending Trends `BarChart`.
- When a bar is clicked, it identifies the `clickedPeriod`.
- It then filters the `rawSpendingData` to find daily entries matching that period using the `formatDateKey` function.
- Fake descriptions are added for demonstration.
- The results are stored in the `drillDownData` state, which conditionally renders a details table.

### Chart Implementation

- Render functions (`renderSpendingChart`, etc.) display charts based on aggregated data and selected chart types.
- The Spending Trends chart uses `aggregatedSpendingData` and `cumulativeSpendingData`.
- The Repayment chart uses `aggregatedRepaymentData`.
- Category and Monthly Breakdown charts currently use data that is less dependent on the date range/aggregation period in this example, but could be adapted.

## How to Update Data (Replace Fake Data)

1.  **Fetch Raw Data:** Modify the initial `useEffect` hook (the one depending on `[applications]`) to fetch *raw, granular* (ideally daily) data from your API instead of generating fake data. Fetch a sufficiently large range initially (e.g., last year) to support flexible date filtering on the client-side.
    ```typescript
    useEffect(() => {
      setLoading(true);
      const fetchData = async () => {
        try {
          // Fetch raw spending and repayment data (e.g., daily transactions for the last year)
          const rawSpendingResponse = await api.getRawSpendingData({ /* params like userId */ });
          const rawRepaymentResponse = await api.getRawRepaymentData({ /* params */ });
    
          // Parse dates into Date objects
          const parsedSpending = rawSpendingResponse.data.map(item => ({ ...item, date: new Date(item.date) }));
          const parsedRepayment = rawRepaymentResponse.data.map(item => ({ ...item, date: new Date(item.date) }));
    
          setRawSpendingData(parsedSpending);
          setRawRepaymentData(parsedRepayment);
          
          // Fetch or calculate other static data like categories, total advances etc.
          // ... 
    
          setLoading(false);
        } catch (error) {
          console.error('Error fetching initial data:', error);
          setLoading(false);
        }
      };
      fetchData();
    }, [applications]); // Dependency on user/auth context might be needed too
    ```

2.  **Filtering & Aggregation:** The second `useEffect` hook (depending on `[rawSpendingData, ..., aggregationPeriod]`) should largely remain the same. It takes the raw data, filters it by the user-selected `startDate` and `endDate`, and then aggregates it based on `aggregationPeriod`.

3.  **Drill-Down Data:** The `handleBarClick` function might need adjustment. Instead of filtering client-side `rawSpendingData` again, you might:
    *   Fetch detailed data specifically for the `clickedPeriod` from the API on demand.
    *   Or, ensure the initially fetched `rawSpendingData` contains sufficient detail (like descriptions) if you prefer client-side filtering for drill-down.

## How to Add/Modify Chart Types

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

- Date picker is styled using `.date-picker-*` classes and overrides for `.react-datepicker*`.
- Drill-down section uses `.drill-down-*` classes.
- General chart styling is in `Pages.css`.

## Responsive Considerations

- Date range controls and chart controls now have responsive styles for smaller screens.
- The drill-down table also has basic responsive padding adjustments.
- Ensure new elements are tested across various screen sizes.

## Performance Optimization

- **Initial Load:** Fetching a large amount of raw data initially might be slow. Consider fetching only the default range (e.g., last 6 months) initially and fetching more historical data if the user selects an older date range.
- **Re-aggregation:** Aggregation on the client-side is relatively fast for moderate datasets but could slow down with millions of raw data points. For very large datasets, consider performing aggregation on the backend based on the selected date range and period.
- **Drill-Down:** Fetching drill-down details on demand from the API is often more performant than loading all possible details upfront. 