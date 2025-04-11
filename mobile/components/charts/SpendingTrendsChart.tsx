import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Rect, Line, Text as SvgText, Path, Circle } from 'react-native-svg';
import * as d3 from 'd3';

// Import data types
import type { AggregatedSpendingData, HeatmapDataPoint } from '@/types/chartTypes';

// Define Chart Props
interface SpendingTrendsChartProps {
    data: AggregatedSpendingData[];
    cumulativeData: AggregatedSpendingData[];
    heatmapData: HeatmapDataPoint[];
    chartType: 'bar' | 'line' | 'area' | 'composed' | 'heatmap';
    aggregationPeriod: 'monthly' | 'weekly' | 'daily';
    onBarClick?: (datum: AggregatedSpendingData) => void;
}

// Constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
const HEATMAP_COLORS = ['#cce5ff', '#99caff', '#66b0ff', '#3395ff', '#007bff'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

// Process spending data for safety
const processSpendingData = (data: AggregatedSpendingData[]): AggregatedSpendingData[] => {
    if (!data) return [];
    return data.map(item => ({
        period: typeof item.period === 'string' ? item.period : '',
        amount: typeof item.amount === 'number' ? item.amount : 0
    }));
};

// Process heatmap data for safety
const processHeatmapData = (data: HeatmapDataPoint[]): HeatmapDataPoint[] => {
    if (!data) return [];
    return data.map(item => ({
        week: typeof item.week === 'number' ? item.week : 0,
        dayOfWeek: typeof item.dayOfWeek === 'number' ? item.dayOfWeek : 0,
        amount: typeof item.amount === 'number' ? item.amount : 0,
        dateString: typeof item.dateString === 'string' ? item.dateString : ''
    }));
};

// --- Main Chart Component ---
const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({ 
    data,
    cumulativeData,
    heatmapData,
    chartType,
    aggregationPeriod,
    onBarClick
}) => {
    // Process data for safety
    const processedData = processSpendingData(data);
    const processedCumulativeData = processSpendingData(cumulativeData);
    const processedHeatmapData = processHeatmapData(heatmapData);

    const { width } = Dimensions.get('window');
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const svgWidth = width - 30;
    const chartWidth = svgWidth - margin.left - margin.right;
    const svgHeight = 300;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean; content: string } | null>(null);

    // IMPORTANT: No early returns before useMemo to maintain hooks order
    
    // Memoized D3 calculations - always declare this hook regardless of data
    const { xScale, yScale, y2Scale, lineGenerator, areaGenerator, composedLineGenerator, heatmapColorScale } = useMemo(() => {
        // Handle empty data case here inside useMemo
        if ((!processedData || processedData.length === 0) && chartType !== 'heatmap') {
            return { 
                xScale: null, 
                yScale: null, 
                y2Scale: null, 
                lineGenerator: null, 
                areaGenerator: null, 
                composedLineGenerator: null, 
                heatmapColorScale: null 
            };
        }
        
        if ((!processedHeatmapData || processedHeatmapData.length === 0) && chartType === 'heatmap') {
            return { 
                xScale: null, 
                yScale: null, 
                y2Scale: null, 
                lineGenerator: null, 
                areaGenerator: null, 
                composedLineGenerator: null, 
                heatmapColorScale: null 
            };
        }

        // X Scale
        let localXScale: any;
        const xDomain = processedData.map(d => d.period);
        if (chartType === 'bar' || chartType === 'composed') {
            localXScale = d3.scaleBand().domain(xDomain).range([0, chartWidth]).padding(0.2);
        } else if (chartType === 'heatmap') {
            const weekDomain = d3.extent(processedHeatmapData, d => d.week) as [number, number] | [undefined, undefined];
            localXScale = d3.scaleLinear().domain(weekDomain[0] !== undefined ? weekDomain : [0,1]).range([0, chartWidth]);
        } else { // Line, Area
            localXScale = d3.scalePoint().domain(xDomain).range([0, chartWidth]).padding(0.5);
        }

        // Y Scale
        let localYScale: any;
        if (chartType === 'heatmap') {
            localYScale = d3.scaleBand().domain(d3.range(7).map(String)).range([chartHeight, 0]).padding(0.1);
        } else {
            const yMax = d3.max(processedData, d => d.amount) || 0;
            localYScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([chartHeight, 0]).nice();
        }

        // Y Scale for Cumulative Line (Composed)
        let localY2Scale: d3.ScaleLinear<number, number> | null = null;
        if (chartType === 'composed' && processedCumulativeData?.length > 0) {
            const y2Max = d3.max(processedCumulativeData, d => d.amount) || 0;
            localY2Scale = d3.scaleLinear().domain([0, y2Max * 1.1]).range([chartHeight, 0]).nice();
        }

        // Line/Area Generators
        const localLineGenerator = d3.line<AggregatedSpendingData>()
            .x(d => localXScale(d.period) + (localXScale.bandwidth ? localXScale.bandwidth() / 2 : 0)) 
            .y(d => localYScale(d.amount))
            .curve(d3.curveMonotoneX);

        const localAreaGenerator = d3.area<AggregatedSpendingData>()
            .x(d => localXScale(d.period) + (localXScale.bandwidth ? localXScale.bandwidth() / 2 : 0))
            .y0(chartHeight)
            .y1(d => localYScale(d.amount))
            .curve(d3.curveMonotoneX);
            
        const localComposedLineGenerator = d3.line<AggregatedSpendingData>()
            .x(d => localXScale(d.period) + (localXScale.bandwidth ? localXScale.bandwidth() / 2 : 0))
            .y(d => localY2Scale ? localY2Scale(d.amount) : 0) 
            .curve(d3.curveMonotoneX);

        // Heatmap Color Scale
        const maxHeatmapAmount = d3.max(processedHeatmapData, d => d.amount) || 1;
        const localHeatmapColorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxHeatmapAmount]);

        return {
            xScale: localXScale,
            yScale: localYScale,
            y2Scale: localY2Scale,
            lineGenerator: localLineGenerator,
            areaGenerator: localAreaGenerator,
            composedLineGenerator: localComposedLineGenerator,
            heatmapColorScale: localHeatmapColorScale
        };
    }, [processedData, processedCumulativeData, processedHeatmapData, chartType, chartWidth, chartHeight]);

    // NOW we can do early returns, after all hooks have been called
    if ((!processedData || processedData.length === 0) && chartType !== 'heatmap') {
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No spending data available.</Text>
            </View>
        );
    }
    if ((!processedHeatmapData || processedHeatmapData.length === 0) && chartType === 'heatmap') {
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No heatmap data available.</Text>
            </View>
        );
    }
    if (!xScale || !yScale) {
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Unable to render chart.</Text>
            </View>
        );
    }

    // --- Render Helpers --- (Axis, Grid, Tooltip)
    const AxisX = () => {
        if (!xScale) return null;
        return (
            <G key="x-axis">
                <Line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#ccc" strokeWidth={1} />
                {(chartType === 'heatmap'
                    ? (xScale.ticks ? xScale.ticks(Math.min(xScale.domain().length, 5)) : xScale.domain())
                    : xScale.domain()
                    ).map((tickValue: any, i: number) => (
                    <SvgText
                        key={`x-tick-${i}`}
                        x={xScale(tickValue) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0)}
                        y={chartHeight + 15}
                        fontSize={9} fill="#666" textAnchor="middle"
                    >
                        {getSafeText(chartType === 'heatmap' ? `W${tickValue}` : tickValue)}
                    </SvgText>
                ))}
            </G>
        );
    };

    const AxisY = () => {
        if (!yScale) return null;
        return (
            <G key="y-axis">
                <Line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#ccc" strokeWidth={1} />
                {(chartType === 'heatmap'
                    ? yScale.domain()
                    : yScale.ticks(5)
                ).map((tickValue: any, i: number) => (
                    <G key={`y-tick-group-${i}`} transform={`translate(0, ${yScale(tickValue)})`}>
                        <Line x1={-5} y1={0} x2={0} y2={0} stroke="#ccc" strokeWidth={1}/>
                        <SvgText x={-10} y={0} fontSize={9} fill="#666" textAnchor="end" dy={3}>
                            {getSafeText(chartType === 'heatmap' ? DAYS_OF_WEEK[Number(tickValue)] : `$${tickValue}`)}
                        </SvgText>
                    </G>
                ))}
            </G>
        );
    };

    const Grid = () => {
        if (!yScale || !yScale.ticks) return null;
        return (
            <G key="grid">
                {yScale.ticks(5).map((tickValue: number, i: number) => (
                    <Line key={`y-grid-${i}`} x1={0} y1={yScale(tickValue)} x2={chartWidth} y2={yScale(tickValue)} stroke="#eee" strokeWidth={1} strokeDasharray="3, 3" />
                ))}
            </G>
        );
    };

    const TooltipComponent = () => {
        if (!tooltip || !tooltip.visible) return null;
        // Safety checks for positioning
        const tooltipX = Math.min(Math.max(tooltip.x, 50), svgWidth - 50);
        const tooltipY = Math.min(Math.max(tooltip.y, 20), svgHeight - 30);
        return (
            <G x={tooltipX} y={tooltipY}>
                <Rect x={-40} y={-20} width={80} height={30} fill="rgba(0,0,0,0.7)" rx={3}/>
                <SvgText x={0} y={-5} fontSize={10} fill="white" textAnchor="middle">
                    {getSafeText(tooltip.content)}
                </SvgText>
            </G>
        );
    };

    // --- Chart Type-Based Content ---
    let chartContent;

    if (chartType === 'bar') {
        chartContent = (
            <G>
                <Grid />
                <AxisX />
                <AxisY />
                {processedData.map((d, index) => (
                    <Rect
                        key={`bar-${index}-${d.period}`}
                        x={xScale(d.period)}
                        y={yScale(d.amount)}
                        width={xScale.bandwidth ? xScale.bandwidth() : 0}
                        height={chartHeight - yScale(d.amount)}
                        fill={COLORS[0]}
                        onPress={() => onBarClick ? onBarClick(d) : 
                            setTooltip({
                                x: xScale(d.period) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0),
                                y: yScale(d.amount) - 10,
                                visible: true,
                                content: `$${d.amount.toLocaleString()}`
                            })
                        }
                    />
                ))}
            </G>
        );
    } else if (chartType === 'line' && lineGenerator) {
        const pathData = lineGenerator(processedData) || '';
        chartContent = (
            <G>
                <Grid />
                <AxisX />
                <AxisY />
                <Path d={pathData} fill="none" stroke={COLORS[0]} strokeWidth={2} />
                {processedData.map((d, index) => (
                    <Circle
                        key={`point-${index}-${d.period}`}
                        cx={xScale(d.period) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0)}
                        cy={yScale(d.amount)}
                        r={4}
                        fill={COLORS[0]}
                        onPress={() => 
                            setTooltip({
                                x: xScale(d.period) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0),
                                y: yScale(d.amount) - 10,
                                visible: true,
                                content: `$${d.amount.toLocaleString()}`
                            })
                        }
                    />
                ))}
            </G>
        );
    } else if (chartType === 'area' && areaGenerator && lineGenerator) {
        const pathData = areaGenerator(processedData) || '';
        chartContent = (
            <G>
                <Grid />
                <AxisX />
                <AxisY />
                <Path d={pathData} fill={COLORS[0]} opacity={0.3} />
                <Path d={lineGenerator(processedData) || ''} fill="none" stroke={COLORS[0]} strokeWidth={2} />
                {processedData.map((d, index) => (
                    <Circle
                        key={`point-${index}-${d.period}`}
                        cx={xScale(d.period) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0)}
                        cy={yScale(d.amount)}
                        r={4}
                        fill={COLORS[0]}
                        onPress={() => 
                            setTooltip({
                                x: xScale(d.period) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0),
                                y: yScale(d.amount) - 10,
                                visible: true,
                                content: `$${d.amount.toLocaleString()}`
                            })
                        }
                    />
                ))}
            </G>
        );
    } else if (chartType === 'composed' && y2Scale && composedLineGenerator) {
        chartContent = (
            <G>
                <Grid />
                <AxisX />
                <AxisY />
                {processedData.map((d, index) => (
                    <Rect
                        key={`bar-${index}-${d.period}`}
                        x={xScale(d.period)}
                        y={yScale(d.amount)}
                        width={xScale.bandwidth ? xScale.bandwidth() : 0}
                        height={chartHeight - yScale(d.amount)}
                        fill={COLORS[0]}
                        onPress={() => onBarClick ? onBarClick(d) : 
                            setTooltip({
                                x: xScale(d.period) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0),
                                y: yScale(d.amount) - 10,
                                visible: true,
                                content: `$${d.amount.toLocaleString()}`
                            })
                        }
                    />
                ))}
                <Path 
                    d={composedLineGenerator(processedCumulativeData) || ''} 
                    fill="none" 
                    stroke={COLORS[1]} 
                    strokeWidth={2} 
                />
                {processedCumulativeData.map((d, index) => (
                    <Circle
                        key={`cum-point-${index}-${d.period}`}
                        cx={xScale(d.period) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0)}
                        cy={y2Scale(d.amount)}
                        r={4}
                        fill={COLORS[1]}
                        onPress={() => 
                            setTooltip({
                                x: xScale(d.period) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0),
                                y: y2Scale(d.amount) - 10,
                                visible: true,
                                content: `Cumulative: $${d.amount.toLocaleString()}`
                            })
                        }
                    />
                ))}
                {/* Add a secondary Y-axis label for cumulative values */}
                <G transform={`translate(${chartWidth}, 0)`}>
                    <Line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#ccc" strokeWidth={1} />
                    {y2Scale.ticks(5).map((tickValue: number, i: number) => (
                        <G key={`y2-tick-group-${i}`} transform={`translate(0, ${y2Scale(tickValue)})`}>
                            <Line x1={0} y1={0} x2={5} y2={0} stroke="#ccc" strokeWidth={1}/>
                            <SvgText x={10} y={0} fontSize={9} fill="#666" textAnchor="start" dy={3}>
                                {`$${tickValue}`}
                            </SvgText>
                        </G>
                    ))}
                </G>
            </G>
        );
    } else if (chartType === 'heatmap' && heatmapColorScale) {
        // Calculate cell size
        const cellWidth = chartWidth / 53; // Max weeks in a year
        const cellHeight = chartHeight / 7; // Days in a week
        
        chartContent = (
            <G>
                <AxisX />
                <AxisY />
                {processedHeatmapData.map((d, index) => {
                    const x = xScale(d.week);
                    const y = yScale(String(d.dayOfWeek));
                    const color = heatmapColorScale(d.amount);
                    
                    return (
                        <Rect
                            key={`heatmap-cell-${index}-${d.dateString}`}
                            x={x}
                            y={y}
                            width={cellWidth}
                            height={cellHeight}
                            fill={color}
                            stroke="#fff"
                            strokeWidth={1}
                            onPress={() => 
                                setTooltip({
                                    x: x + cellWidth / 2,
                                    y: y - 10,
                                    visible: true,
                                    content: `${d.dateString}: $${d.amount.toLocaleString()}`
                                })
                            }
                        />
                    );
                })}
            </G>
        );
    } else {
        // Fallback if chart type is invalid or necessary generators are missing
        chartContent = (
            <G>
                <SvgText x={chartWidth/2} y={chartHeight/2} textAnchor="middle">
                    Unable to render this chart type
                </SvgText>
            </G>
        );
    }

    return (
        <View style={styles.chartContainer}>
            <Svg width={svgWidth} height={svgHeight}>
                <G transform={`translate(${margin.left}, ${margin.top})`}>
                    {chartContent}
                    <TooltipComponent />
                </G>
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
        height: 300, // Match default svg height
        width: '100%'
    },
    placeholderText: {
        fontSize: 14,
        color: '#adb5bd'
    }
});

export default SpendingTrendsChart; 