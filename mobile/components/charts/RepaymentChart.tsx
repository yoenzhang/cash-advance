import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Rect, Line, Text as SvgText, Path } from 'react-native-svg';
import * as d3 from 'd3';

// Import Shared Types
import type { AggregatedRepaymentData } from '@/types/chartTypes';

// Props Interface
interface RepaymentChartProps {
    data: AggregatedRepaymentData[];
    chartType: 'bar' | 'line' | 'area';
}

// Constants
const COLORS = ['#00C49F', '#FF8042']; // Green for On-time, Orange/Red for Late

// Safe Text Helper
const getSafeText = (text: any): string => {
    if (text === null || text === undefined) return '';
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return text.toString();
    try {
        const str = String(text);
        return (str === '[object Object]' || Array.isArray(text)) ? '' : str; 
    } catch (e) {
        return '';
    }
};

// Process repayment data for safety
const processRepaymentData = (data: AggregatedRepaymentData[]): AggregatedRepaymentData[] => {
    if (!data) return [];
    return data.map(item => ({
        period: typeof item.period === 'string' ? item.period : '',
        onTime: typeof item.onTime === 'number' ? item.onTime : 0,
        late: typeof item.late === 'number' ? item.late : 0
    }));
};

// --- RepaymentChart Component ---
const RepaymentChart: React.FC<RepaymentChartProps> = ({ data, chartType }) => {
    // Process data for safety
    const processedData = processRepaymentData(data);
    
    const { width } = Dimensions.get('window');
    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const svgWidth = width - 30;
    const svgHeight = 300;
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean; content: string } | null>(null);

    // Memoized D3 calculations - always call this hook regardless of data state
    const { series, xScale, yScale, lineOnTime, lineLate, areaGenerator } = useMemo(() => {
        if (!processedData || processedData.length === 0) {
            return { 
                series: [], 
                xScale: null, 
                yScale: null, 
                lineOnTime: null, 
                lineLate: null, 
                areaGenerator: null 
            };
        }

        const keys = ['onTime', 'late'];
        const stack = d3.stack<AggregatedRepaymentData>().keys(keys);
        const localSeries = stack(processedData);

        const localXScale = d3.scaleBand<string>()
            .domain(processedData.map(d => d.period))
            .range([0, chartWidth])
            .padding(0.2);

        const yMax = d3.max(localSeries, (s) => d3.max(s, (d) => d[1])) || 0;
        const localYScale = d3.scaleLinear()
            .domain([0, yMax * 1.1])
            .range([chartHeight, 0])
            .nice();

        const localLineOnTime = d3.line<AggregatedRepaymentData>()
            .x(d => localXScale(d.period)! + localXScale.bandwidth() / 2)
            .y(d => localYScale(d.onTime))
            .curve(d3.curveMonotoneX);

        const localLineLate = d3.line<AggregatedRepaymentData>()
            .x(d => localXScale(d.period)! + localXScale.bandwidth() / 2)
            .y(d => localYScale(d.late))
            .curve(d3.curveMonotoneX);

        const localAreaGenerator = d3.area<d3.SeriesPoint<AggregatedRepaymentData>>()
            .x(d => localXScale(d.data.period)! + localXScale.bandwidth() / 2)
            .y0(d => localYScale(d[0]))
            .y1(d => localYScale(d[1]))
            .curve(d3.curveMonotoneX);

        return { 
            series: localSeries, 
            xScale: localXScale, 
            yScale: localYScale, 
            lineOnTime: localLineOnTime, 
            lineLate: localLineLate, 
            areaGenerator: localAreaGenerator 
        };
    }, [processedData, chartWidth, chartHeight]);

    // Early returns AFTER all hooks
    if (!processedData || processedData.length === 0 || !xScale || !yScale) {
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No repayment data.</Text>
            </View>
        );
    }

    // Render Helpers: Axis, Grid, Tooltip, Legend
    const AxisX = () => {
        return (
            <G key="x-axis" transform={`translate(0, ${chartHeight})`}>
                <Line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#ccc" strokeWidth={1} />
                {xScale.domain().map((tickValue, i) => (
                    <SvgText key={`x-tick-${i}`} x={xScale(tickValue)! + xScale.bandwidth() / 2} y={15} fontSize={9} fill="#666" textAnchor="middle">
                        {getSafeText(tickValue)}
                    </SvgText>
                ))}
            </G>
        );
    };

    const AxisY = () => {
        if (!yScale) return null;
        return (
            <G key="y-axis">
                {yScale.ticks(5).map((tickValue, i) => (
                    <G key={`y-tick-group-${i}`} transform={`translate(0, ${yScale(tickValue)})`}>
                        <Line x1={-5} y1={0} x2={0} y2={0} stroke="#ccc" strokeWidth={1}/>
                        <SvgText x={-8} y={0} fontSize={10} fill="#666" textAnchor="end" dy={4}>
                            {getSafeText(tickValue)}
                        </SvgText>
                    </G>
                ))}
            </G>
        );
    };

    const Grid = () => {
        if (!yScale) return null;
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
                <Rect x={-40} y={-25} width={80} height={40} fill="rgba(0,0,0,0.7)" rx={3}/>
                <SvgText x={0} y={-10} fontSize={10} fill="white" textAnchor="middle">
                    {getSafeText(tooltip.content)}
                </SvgText>
            </G>
        );
    };

    const Legend = () => (
        <G transform={`translate(0, -15)`}>
            <Rect x={0} y={0} width={10} height={10} fill={COLORS[0]} />
            <SvgText x={15} y={8} fontSize={10} fill="#333">On Time</SvgText>
            <Rect x={70} y={0} width={10} height={10} fill={COLORS[1]} />
            <SvgText x={85} y={8} fontSize={10} fill="#333">Late</SvgText>
        </G>
    );

    // Render based on chart type
    let chartContent;

    if (chartType === 'bar') {
        // Prepare bar data in simpler format
        const barData = series.flatMap((s, seriesIndex) =>
            s.map((d, pointIndex) => ({
                key: `bar-${seriesIndex}-${pointIndex}`,
                seriesKey: s.key,
                color: COLORS[seriesIndex % COLORS.length],
                x: xScale(d.data.period),
                width: xScale.bandwidth(),
                y: yScale(d[1]),
                height: Math.max(0, yScale(d[0]) - yScale(d[1])),
                tooltipContent: `${d.data.period}\n${s.key}: ${d.data[s.key as keyof AggregatedRepaymentData]}`,
                tooltipX: xScale(d.data.period)! + xScale.bandwidth()/2,
                tooltipY: yScale(d[0]) - (yScale(d[0]) - yScale(d[1]))/2
            }))
        );

        chartContent = (
            <G>
                <Grid />
                <AxisX />
                <AxisY />
                <Legend />
                {barData.map(bar => (
                    <Rect
                        key={bar.key}
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        fill={bar.color}
                        onPress={() => {
                            setTooltip({ 
                                x: bar.tooltipX, 
                                y: bar.tooltipY, 
                                visible: true, 
                                content: bar.tooltipContent 
                            });
                            setTimeout(() => setTooltip(null), 1500);
                        }}
                    />
                ))}
            </G>
        );
    } else if (chartType === 'line') {
        chartContent = (
            <G>
                <Grid />
                <AxisX />
                <AxisY />
                <Legend />
                <Path 
                    d={lineOnTime(processedData) || ''} 
                    fill="none" 
                    stroke={COLORS[0]} 
                    strokeWidth={2} 
                />
                <Path 
                    d={lineLate(processedData) || ''} 
                    fill="none" 
                    stroke={COLORS[1]} 
                    strokeWidth={2} 
                />
                {/* Add circles for data points */}
                {processedData.map((d, i) => (
                    <G key={`points-${i}`}>
                        <G
                            key={`on-time-point-${i}`}
                            onPress={() => {
                                setTooltip({
                                    x: xScale(d.period)! + xScale.bandwidth() / 2,
                                    y: yScale(d.onTime) - 10,
                                    visible: true,
                                    content: `On Time: ${d.onTime}`
                                });
                                setTimeout(() => setTooltip(null), 1500);
                            }}
                        >
                            <Rect
                                x={xScale(d.period)! + xScale.bandwidth() / 2 - 5}
                                y={yScale(d.onTime) - 5}
                                width={10}
                                height={10}
                                fill="transparent"
                            />
                            <Circle cx={xScale(d.period)! + xScale.bandwidth() / 2} cy={yScale(d.onTime)} r={4} fill={COLORS[0]} />
                        </G>
                        <G
                            key={`late-point-${i}`}
                            onPress={() => {
                                setTooltip({
                                    x: xScale(d.period)! + xScale.bandwidth() / 2,
                                    y: yScale(d.late) - 10,
                                    visible: true,
                                    content: `Late: ${d.late}`
                                });
                                setTimeout(() => setTooltip(null), 1500);
                            }}
                        >
                            <Rect
                                x={xScale(d.period)! + xScale.bandwidth() / 2 - 5}
                                y={yScale(d.late) - 5}
                                width={10}
                                height={10}
                                fill="transparent"
                            />
                            <Circle cx={xScale(d.period)! + xScale.bandwidth() / 2} cy={yScale(d.late)} r={4} fill={COLORS[1]} />
                        </G>
                    </G>
                ))}
            </G>
        );
    } else if (chartType === 'area') {
        chartContent = (
            <G>
                <Grid />
                <AxisX />
                <AxisY />
                <Legend />
                {series.map((s, i) => (
                    <Path
                        key={`area-${i}`}
                        d={areaGenerator(s) || ''}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.3}
                    />
                ))}
                <Path
                    d={lineOnTime(processedData) || ''}
                    fill="none"
                    stroke={COLORS[0]}
                    strokeWidth={2}
                />
                <Path
                    d={lineLate(processedData) || ''}
                    fill="none"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                />
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

// Need to define Circle component because it's not in our imports
const Circle = ({ cx, cy, r, fill }: { cx: number, cy: number, r: number, fill: string }) => (
    <Path 
        d={`M ${cx} ${cy} m -${r}, 0 a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0`} 
        fill={fill} 
    />
);

const styles = StyleSheet.create({
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        width: '100%'
    },
    placeholderText: {
        fontSize: 14,
        color: '#adb5bd'
    }
});

export default RepaymentChart; 