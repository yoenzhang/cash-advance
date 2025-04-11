import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Rect, Line, Text as SvgText, Path } from 'react-native-svg';
import * as d3 from 'd3';

// Import Shared Types (Assuming MonthlyBreakdown is defined here)
import type { MonthlyBreakdown } from '@/types/chartTypes'; 

// Define ChartDataPoint locally if not exported from shared types
interface ChartDataPoint {
    name: string;
    value: number;
}

// Props
interface MonthlyBreakdownChartProps {
    data: MonthlyBreakdown[];
    chartType: 'pie' | 'bar'; // 'pie' will render as donut
}

// Constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#8884D8', '#82CA9D']; // More colors if needed

// Safe Text Helper
const getSafeText = (text: any): string => {
    if (text === null || text === undefined) return '';
    if (typeof text === 'number' && isNaN(text)) return ''; 
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return text.toString();
    try {
        const str = String(text);
        return (str === '[object Object]' || Array.isArray(text)) ? '' : str; 
    } catch (e) {
        return '';
    }
};

// Process Monthly Data for safety
const processMonthlyData = (data: MonthlyBreakdown[]): MonthlyBreakdown[] => {
    if (!data) return [];
    return data.map(item => ({
        category: typeof item.category === 'string' ? item.category : '',
        amount: typeof item.amount === 'number' ? item.amount : 0,
        percentage: typeof item.percentage === 'number' ? item.percentage : 0
    }));
};

const MonthlyBreakdownChart: React.FC<MonthlyBreakdownChartProps> = ({ data, chartType }) => {
    // Process data for safety
    const processedData = processMonthlyData(data);
    
    const { width } = Dimensions.get('window');
    // Smaller size for the chart next to the table
    const containerWidth = (width - 30) * 0.45; // Approx 45% of card width
    const svgHeight = 150; // Reduced height
    const margin = { top: 10, right: 10, bottom: 10, left: 10 }; // Smaller margins
    const svgWidth = containerWidth;
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean; content: string } | null>(null);

    // Memoized calculations for scales, generators, and prepared data
    const { chartData, pieData, arcGenerator, xScale, yScale, barMargin } = useMemo(() => {
        if (!processedData || processedData.length === 0) {
            return { chartData: [], pieData: [], arcGenerator: null, xScale: null, yScale: null, barMargin: { top: 10, right: 5, bottom: 10, left: 5 } };
        }
        
        const localChartData: ChartDataPoint[] = processedData.map(d => ({ name: d.category, value: d.amount }));

        // Pie/Donut calculations
        const radius = Math.min(chartWidth, chartHeight) / 2 - 5;
        const innerRadius = radius * 0.6;
        const pie = d3.pie<ChartDataPoint>().value(d => d.value).sort(null);
        const localArcGenerator = d3.arc<any, d3.PieArcDatum<ChartDataPoint>>()
            .innerRadius(innerRadius)
            .outerRadius(radius);
        const localPieData = pie(localChartData);

        // Bar calculations
        const localBarMargin = { top: 10, right: 5, bottom: 10, left: 5 };
        const barChartHeight = svgHeight - localBarMargin.top - localBarMargin.bottom;
        const barChartWidth = svgWidth - localBarMargin.left - localBarMargin.right;
        const localYScale = d3.scaleBand<string>()
            .domain(localChartData.map(d => d.name))
            .range([0, barChartHeight])
            .padding(0.2);
        const xMax = d3.max(localChartData, d => d.value) || 0;
        const localXScale = d3.scaleLinear()
            .domain([0, xMax * 1.1])
            .range([0, barChartWidth]);

        return {
            chartData: localChartData,
            pieData: localPieData,
            arcGenerator: localArcGenerator,
            xScale: localXScale,
            yScale: localYScale,
            barMargin: localBarMargin
        };
    }, [processedData, chartWidth, chartHeight, svgWidth, svgHeight]);

    if (!processedData || processedData.length === 0) {
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No data.</Text>
            </View>
        );
    }

    // Tooltip Component
    const TooltipComponent = () => {
        if (!tooltip || !tooltip.visible) return null;
        const tooltipX = Math.max(0, Math.min(tooltip.x, svgWidth - 80));
        const tooltipY = Math.max(10, tooltip.y);
        return (
            <G x={tooltipX} y={tooltipY} >
                <Rect x={-40} y={-20} width={80} height={30} fill="rgba(0,0,0,0.75)" rx={3}/>
                <SvgText x={0} y={-5} fontSize={10} fill="white" textAnchor="middle">
                    {getSafeText(tooltip.content)}
                </SvgText>
            </G>
        );
    };

    // --- Render Logic ---
    let chartContent;

    if (chartType === 'pie' && arcGenerator) {
        chartContent = (
            <G transform={`translate(${svgWidth / 2}, ${svgHeight / 2})`}>
                {pieData.map((slice, index) => {
                    const pathData = arcGenerator(slice) || undefined;
                    // Add static event handler instead of animated component
                    const handlePress = () => {
                        const [centroidX, centroidY] = arcGenerator.centroid(slice);
                        const percentage = processedData.find(d => d.category === slice.data.name)?.percentage ?? 0;
                        setTooltip({ 
                            x: centroidX + svgWidth / 2,
                            y: centroidY + svgHeight / 2,
                            visible: true, 
                            content: `${slice.data.name}: ${percentage}%` 
                        });
                        setTimeout(() => setTooltip(prev => prev && prev.content.includes(slice.data.name) ? { ...prev, visible: false } : prev), 1500);
                    };
                    
                    return (
                        <Path
                            key={`slice-${index}`}
                            d={pathData}
                            fill={COLORS[index % COLORS.length]}
                            onPress={handlePress}
                        />
                    );
                })}
            </G>
        );
    } else if (chartType === 'bar' && xScale && yScale) {
        chartContent = (
            <G x={barMargin.left} y={barMargin.top}>
                {chartData.map((d, index) => {
                    // Add static event handler instead of animated component
                    const handlePress = () => {
                        const percentage = processedData.find(item => item.category === d.name)?.percentage ?? 0;
                        const tooltipX = barMargin.left + xScale(d.value) / 2;
                        const tooltipY = barMargin.top + (yScale(d.name) ?? 0) + yScale.bandwidth() / 2;
                        setTooltip({ 
                            x: tooltipX, 
                            y: tooltipY, 
                            visible: true, 
                            content: `$${d.value.toLocaleString()} (${percentage}%)` 
                        });
                        setTimeout(() => setTooltip(prev => prev && prev.content.includes(d.value.toLocaleString()) ? { ...prev, visible: false } : prev), 1500);
                    };
                    
                    return (
                        <Rect
                            key={`bar-${index}-${d.name}`}
                            x={0}
                            y={yScale(d.name)}
                            height={yScale.bandwidth()}
                            width={xScale(d.value)}
                            fill={COLORS[index % COLORS.length]}
                            rx={2}
                            onPress={handlePress}
                        />
                    );
                })}
            </G>
        );
    }

    return (
        <View style={styles.chartContainer}>
            <Svg width={svgWidth} height={svgHeight}>
                {chartContent}
                <TooltipComponent />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 150, // Match the default svg height
        width: '100%'
    },
    placeholderText: {
        fontSize: 14,
        color: '#adb5bd'
    }
});

export default MonthlyBreakdownChart; 