"use client";

import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CHART_COLORS } from "@/lib/constants";

interface WaterfallChartProps {
    data: {
        name: string;
        value: number;
        color?: string;
    }[];
    currency?: string;
    title?: string;
    onBarClick?: (data: any) => void;
    selectedIndex?: number | null;
    showPercentage?: boolean;
    layout?: "value" | "percentage";
}

export function CostWaterfallChart({
    data,
    currency = "$",
    title = "Cost Build-up",
    onBarClick,
    selectedIndex,
    showPercentage = false,
    layout = "value"
}: WaterfallChartProps) {
    // Transform data for waterfall
    // Each bar needs: name, start, end, value (for tooltip)

    let currentTotal = 0;
    const waterfallData = data.map((item, index) => {
        const isTotal = index === data.length - 1;
        const prevTotal = currentTotal;

        // For intermediate steps, we stack on top of previous
        // For the final total, we start from 0
        let start = prevTotal;
        let end = prevTotal + item.value;

        // Update running total
        currentTotal += item.value;

        return {
            name: item.name,
            value: item.value,
            // For floating bars: bottom segment is 'start', floating segment is 'value'
            // We use a stacked bar chart with a transparent bottom segment
            bottom: start,
            barSize: item.value,
            total: currentTotal,
            color: item.color || CHART_COLORS.rawMaterial,
            isTotal: false,
            originalIndex: index,
        };
    });

    // Calculate the final total bar separately
    const totalValue = currentTotal;
    const finalBar = {
        name: "Total Ex-Works",
        value: totalValue,
        bottom: 0,
        barSize: totalValue,
        total: totalValue,
        color: CHART_COLORS.total, // Dark color for total
        isTotal: true,
        originalIndex: -1,
    };

    const chartData = [...waterfallData, finalBar];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[1] ? payload[1].payload : payload[0].payload;
            const percentage = ((data.value / totalValue) * 100).toFixed(1);
            
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-sm">
                    <p className="font-semibold mb-1">{data.name}</p>
                    <div className="space-y-1">
                        <p className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="font-mono font-medium">
                                {currency}{data.value.toFixed(4)}
                                {showPercentage && !data.isTotal && ` (${percentage}%)`}
                            </span>
                        </p>
                        {!data.isTotal && (
                            <p className="flex justify-between gap-4 pt-1 border-t text-xs">
                                <span className="text-muted-foreground">Cumulative:</span>
                                <span className="font-mono">
                                    {currency}{data.total.toFixed(4)}
                                </span>
                            </p>
                        )}
                        {!data.isTotal && (
                            <p className="text-xs text-blue-500 mt-2 font-medium">Click for details</p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                interval={0}
                                style={{ textAnchor: 'middle' }}
                            />
                            <YAxis
                                tickFormatter={(val) => `${currency}${val.toFixed(3)}`}
                                tick={{ fontSize: 11 }}
                                width={60}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                            {/* Invisible bar for spacing/stacking foundation */}
                            <Bar dataKey="bottom" stackId="a" fill="transparent" />

                            {/* Actual value bar floating on top */}
                            <Bar
                                dataKey="barSize"
                                stackId="a"
                                radius={[2, 2, 0, 0]}
                                onClick={(data: any, index) => {
                                    if (onBarClick && !data.isTotal) {
                                        onBarClick(data);
                                    }
                                }}
                            >
                                {chartData.map((entry, index) => {
                                    const isSelected = selectedIndex === entry.originalIndex;
                                    const opacity = selectedIndex !== null && selectedIndex !== undefined && !entry.isTotal
                                        ? (isSelected ? 1 : 0.4)
                                        : 1;

                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            fillOpacity={opacity}
                                            cursor={entry.isTotal ? "default" : "pointer"}
                                            stroke={isSelected ? "#000" : "none"}
                                            strokeWidth={2}
                                        />
                                    );
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
