import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Rect, Text as SvgText, Line } from 'react-native-svg';
import * as d3 from 'd3';
import type { SpendingComparisonDataPoint } from '@/types/chartTypes'; // Import from shared types

// Props
interface SpendingComparisonChartProps {
    data: SpendingComparisonDataPoint[]; // Expecting { category: string, currentAmount: number, previousAmount: number }[]
}

// Constants
const CURRENT_COLOR = '#1f77b4'; // Blue
const PREVIOUS_COLOR = '#ff7f0e'; // Orange

const SpendingComparisonChart: React.FC<SpendingComparisonChartProps> = ({ data }) => {
    const { width } = Dimensions.get('window');
    const containerWidth = width - 30; // Assuming card padding of 15 on each side
    const svgHeight = 250;
    const margin = { top: 20, right: 20, bottom: 50, left: 50 }; // Adjust margins for labels
    const svgWidth = containerWidth;
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean; content: string } | null>(null);

    if (!data || data.length === 0) {
        return <View style={styles.placeholderContainer}><Text style={styles.placeholderText}>No comparison data available.</Text></View>;
    }

    // --- D3 Scales ---
    const categories = data.map(d => d.category);
    const maxAmount = d3.max(data, d => Math.max(d.currentAmount, d.previousAmount)) || 0;

    const x0 = d3.scaleBand()
        .domain(categories)
        .rangeRound([0, chartWidth])
        .paddingInner(0.2);

    const x1 = d3.scaleBand()
        .domain(['previousAmount', 'currentAmount'])
        .rangeRound([0, x0.bandwidth()])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, maxAmount * 1.1]) // Add padding to top
        .rangeRound([chartHeight, 0]);

    // --- Tooltip Component ---
    const TooltipComponent = () => {
        if (!tooltip || !tooltip.visible) return null;
        const tooltipX = Math.max(50, Math.min(tooltip.x, svgWidth - 100)); // Prevent overflow
        const tooltipY = Math.max(20, tooltip.y);
        return (
            <G x={tooltipX} y={tooltipY}>
                <Rect x={-45} y={-25} width={90} height={35} fill="rgba(0,0,0,0.8)" rx={4}/>
                <SvgText x={0} y={-10} fontSize={11} fill="white" textAnchor="middle">{tooltip.content}</SvgText>
            </G>
        );
    };

    // --- Axes Components ---
    const AxisX = () => (
        <G transform={`translate(0, ${chartHeight})`}>
            <Line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#cccccc" strokeWidth={1} />
            {x0.domain().map((domainValue) => (
                <SvgText
                    key={`x-tick-${domainValue}`}
                    x={x0(domainValue)! + x0.bandwidth() / 2}
                    y={20} // Position below the line
                    fontSize={10}
                    fill="#666"
                    textAnchor="middle"
                >
                    {domainValue}
                </SvgText>
            ))}
            <SvgText x={chartWidth / 2} y={35} fontSize={12} fill="#333" textAnchor="middle">Category</SvgText>
        </G>
    );

    const AxisY = () => (
        <G>
            <Line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#cccccc" strokeWidth={1} />
            {y.ticks(5).map(tick => (
                <G key={`y-tick-${tick}`} transform={`translate(0, ${y(tick)})`}>
                    <Line x1={-5} y1={0} x2={0} y2={0} stroke="#cccccc" strokeWidth={1} />
                    <SvgText x={-10} y={4} fontSize={10} fill="#666" textAnchor="end">{`$${tick}`}</SvgText>
                </G>
            ))}
             <SvgText
                x={-margin.left + 15}
                y={chartHeight / 2}
                fontSize={12}
                fill="#333"
                textAnchor="middle"
                transform={`rotate(-90, ${-margin.left + 15}, ${chartHeight / 2})`}
            >
                Amount ($)
            </SvgText>
        </G>
    );

    // --- Legend Component ---
     const Legend = () => (
        <G transform={`translate(${chartWidth - 120}, ${-margin.top + 5})`}> 
            <Rect x={0} y={0} width={10} height={10} fill={PREVIOUS_COLOR} />
            <SvgText x={15} y={9} fontSize={10} fill="#666">Previous</SvgText>
            <Rect x={70} y={0} width={10} height={10} fill={CURRENT_COLOR} />
            <SvgText x={85} y={9} fontSize={10} fill="#666">Current</SvgText>
        </G>
    );

    return (
        <View style={styles.chartContainer}>
            <Svg width={svgWidth} height={svgHeight}>
                <G x={margin.left} y={margin.top}>
                    <AxisX />
                    <AxisY />
                    <Legend />
                    {data.map((d) => (
                        <G key={d.category} transform={`translate(${x0(d.category)}, 0)`}>
                            <Rect
                                x={x1('previousAmount')}
                                y={y(d.previousAmount)}
                                width={x1.bandwidth()}
                                height={chartHeight - y(d.previousAmount)}
                                fill={PREVIOUS_COLOR}
                                onPress={() => {
                                    setTooltip({
                                        x: x0(d.category)! + x1('previousAmount')! + x1.bandwidth() / 2,
                                        y: y(d.previousAmount) - 5,
                                        visible: true,
                                        content: `Prev: $${d.previousAmount.toLocaleString()}`
                                    });
                                     setTimeout(() => setTooltip(prev => prev && prev.content.includes('Prev:') ? { ...prev, visible: false } : prev), 1500);
                                }}
                            />
                            <Rect
                                x={x1('currentAmount')}
                                y={y(d.currentAmount)}
                                width={x1.bandwidth()}
                                height={chartHeight - y(d.currentAmount)}
                                fill={CURRENT_COLOR}
                                 onPress={() => {
                                    setTooltip({
                                        x: x0(d.category)! + x1('currentAmount')! + x1.bandwidth() / 2,
                                        y: y(d.currentAmount) - 5,
                                        visible: true,
                                        content: `Curr: $${d.currentAmount.toLocaleString()}`
                                    });
                                    setTimeout(() => setTooltip(prev => prev && prev.content.includes('Curr:') ? { ...prev, visible: false } : prev), 1500);
                                }}
                            />
                        </G>
                    ))}
                    {/* Tooltip needs to be rendered last within the main G to use relative coords */}
                    <TooltipComponent />
                </G>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    chartContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    placeholderContainer: {
        height: 250,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    placeholderText: {
        fontSize: 14,
        color: '#adb5bd'
    },
});

export default SpendingComparisonChart; 