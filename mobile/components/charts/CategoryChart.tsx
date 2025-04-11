import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Rect, Line, Text as SvgText, Path } from 'react-native-svg';
import * as d3 from 'd3';

// Import Shared Types
import type { CategoryData } from '@/types/chartTypes';

// Props
interface CategoryChartProps {
    data: CategoryData[];
    chartType: 'pie' | 'bar';
}

// Constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#8884D8', '#82CA9D', '#FF8484', '#F7DC6F', '#85C1E9'];

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

// Process Category Data to ensure name is a string
const processCategoryData = (data: CategoryData[]): CategoryData[] => {
    if (!data) return [];
    return data.map(item => ({
        name: typeof item.name === 'string' ? item.name : '',
        value: typeof item.value === 'number' ? item.value : 0
    }));
};

const CategoryChart: React.FC<CategoryChartProps> = ({ data, chartType }) => {
    // Ensure data is properly formatted
    const processedData = processCategoryData(data);
    
    const { width } = Dimensions.get('window');
    const containerWidth = width - 30;
    
    // Adjust SVG height dynamically based on chart type and legend needs
    let svgHeight = 300; 
    if (chartType === 'pie' && processedData.length > 0) {
        const legendItemHeight = 18;
        const legendPadding = 10;
        svgHeight += (Math.ceil(processedData.length / 2) * legendItemHeight) + legendPadding * 2;
    }

    const svgWidth = containerWidth;
    const margin = { top: 30, right: 20, bottom: chartType === 'pie' ? 10 : 50, left: chartType === 'pie' ? 20 : 90 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = (chartType === 'pie' ? 220 : 300) - margin.top - margin.bottom;

    const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean; content: string } | null>(null);

    // Use useMemo for chart calculations to ensure consistent hook order
    const chartCalculations = useMemo(() => {
        if (!processedData || processedData.length === 0) {
            return { pieData: [], arcGenerator: null, yScale: null, xScale: null };
        }

        if (chartType === 'pie') {
            const radius = Math.min(chartWidth, chartHeight) / 2;
            const innerRadius = radius * 0.6;

            const pie = d3.pie<CategoryData>().value(d => d.value).sort(null);
            const arcGenerator = d3.arc<any, d3.PieArcDatum<CategoryData>>()
                .innerRadius(innerRadius)
                .outerRadius(radius);

            const pieData = pie(processedData);
            
            return { pieData, arcGenerator, yScale: null, xScale: null };
        } else { // bar chart
            const yScale = d3.scaleBand()
                .domain(processedData.map(d => d.name))
                .range([0, chartHeight])
                .padding(0.2);
            
            const xMax = d3.max(processedData, d => d.value) || 0;
            const xScale = d3.scaleLinear()
                .domain([0, xMax * 1.1])
                .range([0, chartWidth])
                .nice();
                
            return { pieData: [], arcGenerator: null, yScale, xScale };
        }
    }, [processedData, chartType, chartWidth, chartHeight]);

    // NOW we can do early returns AFTER all hooks have been called
    if (!processedData || processedData.length === 0) {
        return (
            <View style={[styles.placeholderContainer, {height: svgHeight}]}>
                <Text style={styles.placeholderText}>No category data.</Text>
            </View>
        );
    }

    // --- Tooltip Component (Only for Bar chart now) ---
    const TooltipComponent = () => {
        if (!tooltip || !tooltip.visible) return null;
        return (
            <G x={tooltip.x} y={tooltip.y}>
                <Rect x={-40} y={-25} width={80} height={40} fill="rgba(0,0,0,0.7)" rx={3}/>
                <SvgText x={0} y={-10} fontSize={10} fill="white" textAnchor="middle">
                    {getSafeText(tooltip.content)}
                </SvgText>
            </G>
        );
    };

    // --- Legend Component (For Pie Chart) ---
    const PieLegend = ({ pieData }: { pieData: d3.PieArcDatum<CategoryData>[] }) => {
        const legendItemHeight = 18;
        const legendItemWidth = (svgWidth - margin.left - margin.right) / 2 - 10;
        const legendStartY = chartHeight + margin.top + 20;

        return (
            <G transform={`translate(${margin.left}, ${legendStartY})`}>
                {pieData.map((slice, index) => {
                    const columnIndex = Math.floor(index / (pieData.length / 2 + 1));
                    const rowIndex = index % Math.ceil(pieData.length / 2);
                    const xPos = columnIndex * (legendItemWidth + 10);
                    const yPos = rowIndex * legendItemHeight;
                    const percentage = ((slice.endAngle - slice.startAngle) / (2 * Math.PI) * 100).toFixed(1);
                    const name = getSafeText(slice.data.name);
                    const textContent = `${name}: ${percentage}%`;

                    return (
                        <G key={`legend-${index}`} transform={`translate(${xPos}, ${yPos})`}>
                            <Rect width={10} height={10} fill={COLORS[index % COLORS.length]} y={-8} />
                            <SvgText x={15} fontSize={11} fill="#333" dy={0}> 
                                {getSafeText(textContent)}
                            </SvgText>
                        </G>
                    );
                })}
            </G>
        );
    };

    // --- Render Logic --- 
    let chartContent;
    let legendContent = null;

    if (chartType === 'pie' && chartCalculations.arcGenerator) {
        legendContent = <PieLegend pieData={chartCalculations.pieData} />;

        chartContent = (
            <G transform={`translate(${svgWidth / 2}, ${margin.top + chartHeight / 2})`}>
                {chartCalculations.pieData.map((slice, index) => {
                    const pathData = chartCalculations.arcGenerator ? 
                        (chartCalculations.arcGenerator(slice) || '') : '';
                    return (
                        <Path
                            key={`slice-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            d={pathData}
                        />
                    );
                })}
            </G>
        );
    } else if (chartType === 'bar' && chartCalculations.xScale && chartCalculations.yScale) {
        const { xScale, yScale } = chartCalculations;

        const AxisY = () => {
            return (
                <G key="y-axis-bar">
                    {yScale.domain().map((tickValue, i) => {
                        return (
                            <SvgText
                                key={`y-tick-${i}`}
                                x={-5}
                                y={yScale(tickValue)! + yScale.bandwidth() / 2}
                                fontSize={10} fill="#666" textAnchor="end" dy={4}
                            >
                                {getSafeText(tickValue)}
                            </SvgText>
                        );
                    })}
                </G>
            );
        };

        const AxisX = () => {
            return (
                <G key="x-axis-bar" transform={`translate(0, ${chartHeight})`}>
                    <Line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#ccc" strokeWidth={1} />
                    {xScale.ticks(5).map((tickValue, i) => {
                        const formattedValue = typeof tickValue === 'number' && !isNaN(tickValue) ? `$${tickValue}` : '';
                        return (
                            <G key={`x-tick-group-${i}`} transform={`translate(${xScale(tickValue)}, 0)`}>
                                <Line y1={0} y2={5} stroke="#ccc" strokeWidth={1}/>
                                <SvgText
                                    y={15}
                                    fontSize={10} fill="#666" textAnchor="middle"
                                >
                                    {getSafeText(formattedValue)}
                                </SvgText>
                            </G>
                        );
                    })}
                </G>
            );
        };

        chartContent = (
            <G>
                <AxisY />
                <AxisX />
                {processedData.map((d, index) => {
                    const barWidth = xScale(d.value);
                    return (
                        <Rect
                            key={`bar-${index}-${d.name}`}
                            x={0}
                            y={yScale(d.name)}
                            height={yScale.bandwidth()}
                            width={barWidth >= 0 ? barWidth : 0}
                            fill={COLORS[index % COLORS.length]}
                            rx={2}
                        />
                    );
                })}
            </G>
        );
    } else {
        // Fallback if the chart type is invalid or calculations failed
        chartContent = (
            <G>
                <SvgText x={chartWidth/2} y={chartHeight/2} textAnchor="middle">
                    Unable to render chart
                </SvgText>
            </G>
        );
    }

    return (
        <View style={[styles.chartContainer, { height: svgHeight }]}>
            <Svg width={svgWidth} height={svgHeight}>
                <G x={chartType === 'bar' ? margin.left : 0} y={chartType === 'bar' ? margin.top : 0}>
                    {chartContent}
                </G>
                {legendContent}
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
        width: '100%' 
    },
    placeholderText: { 
        fontSize: 14, 
        color: '#adb5bd' 
    },
});

export default CategoryChart; 