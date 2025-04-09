import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { downloadCSV } from '../utils/exportUtils'; // Import the utility

// Define interfaces for data structure
interface SpendingDataPoint {
    date: string; // Format: 'YYYY-MM-DD'
    amount: number;
}

interface ComparisonChartProps {}

const SpendingComparisonChart: React.FC<ComparisonChartProps> = () => {
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [comparisonType, setComparisonType] = useState<'month' | 'year'>('month'); // 'month' or 'year'

    const [currentPeriodData, setCurrentPeriodData] = useState<SpendingDataPoint[]>([]);
    const [previousPeriodData, setPreviousPeriodData] = useState<SpendingDataPoint[]>([]);

    // Function to generate fake spending data
    const generateFakeData = (start: Date, end: Date): SpendingDataPoint[] => {
        const data: SpendingDataPoint[] = [];
        let currentDate = new Date(start);

        while (currentDate <= end) {
            // Simulate daily spending with some randomness
            const amount = Math.random() * 100 + 50; // Random amount between 50 and 150
            data.push({
                date: currentDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
                amount: parseFloat(amount.toFixed(2)),
            });
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }
        return data;
    };

    // Effect to generate data when dates or comparison type change
    useEffect(() => {
        if (startDate && endDate) {
            // Ensure start date is before end date
            const validStartDate = startDate <= endDate ? startDate : endDate;
            const validEndDate = startDate <= endDate ? endDate : startDate;

            // Generate data for the selected period
            const currentData = generateFakeData(validStartDate, validEndDate);
            setCurrentPeriodData(currentData);

            // Determine the previous period dates
            let prevStartDate = new Date(validStartDate);
            let prevEndDate = new Date(validEndDate);

            if (comparisonType === 'month') {
                prevStartDate.setMonth(prevStartDate.getMonth() - 1);
                prevEndDate.setMonth(prevEndDate.getMonth() - 1);
            } else if (comparisonType === 'year') {
                prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
                prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
            }

            // Generate data for the previous period
            const previousData = generateFakeData(prevStartDate, prevEndDate);
            setPreviousPeriodData(previousData);
        }
    }, [startDate, endDate, comparisonType]);

    // Combine data for charting (aligning by day offset)
    const combinedData = currentPeriodData.map((currentPoint, index) => {
        const prevPoint = previousPeriodData[index]; // Simple alignment by index/day offset
        return {
            day: index + 1, // Represents day offset from start date
            current: currentPoint?.amount,
            previous: prevPoint?.amount,
        };
    }).filter(point => point.current !== undefined || point.previous !== undefined); // Filter out days where neither exists (though unlikely with current logic)

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2>Spending Comparison</h2>
                 <button 
                    onClick={() => downloadCSV(combinedData, `spending-comparison-${comparisonType}-${startDate?.toISOString().split('T')[0]}-to-${endDate?.toISOString().split('T')[0]}.csv`)} 
                    style={{ padding: '5px 10px' }} 
                    disabled={!combinedData || combinedData.length === 0}
                >
                     Export CSV
                 </button>
            </div>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div>
                    <label style={{ marginRight: '5px' }}>Start Date:</label>
                    <DatePicker selected={startDate} onChange={(date: Date | null) => setStartDate(date)} dateFormat="yyyy-MM-dd" />
                </div>
                <div>
                    <label style={{ marginRight: '5px' }}>End Date:</label>
                    <DatePicker selected={endDate} onChange={(date: Date | null) => setEndDate(date)} dateFormat="yyyy-MM-dd" minDate={startDate || undefined} />
                </div>
                <div>
                    <label style={{ marginRight: '5px' }}>Compare to:</label>
                    <select value={comparisonType} onChange={(e) => setComparisonType(e.target.value as 'month' | 'year')}>
                        <option value="month">Previous Month</option>
                        <option value="year">Previous Year</option>
                    </select>
                </div>
            </div>

            {combinedData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                        data={combinedData}
                        margin={{
                            top: 5, right: 30, left: 20, bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" label={{ value: 'Day of Period', position: 'insideBottomRight', offset: -5 }} />
                        <YAxis label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="current" stroke="#8884d8" name={`Current Period (${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()})`} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="previous" stroke="#82ca9d" name={`Previous Period (${comparisonType === 'month' ? 'Last Month' : 'Last Year'})`} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p>Select a date range to view spending comparison.</p>
            )}
        </div>
    );
};

export default SpendingComparisonChart; 