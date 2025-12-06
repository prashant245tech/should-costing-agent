"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CostBreakdownPieChart, MaterialCostBarChart } from "@/components/cost-breakdown-chart";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Package, TrendingUp, Activity } from "lucide-react";

interface OverviewGridProps {
    totalCost: number;
    componentCount: number;
    materialsTotal: number;
    laborTotal: number;
    overheadTotal: number;
    materialCosts: any[];
}

export function OverviewGrid({
    totalCost,
    componentCount,
    materialsTotal,
    laborTotal,
    overheadTotal,
    materialCosts,
}: OverviewGridProps) {

    // Calculate Primary Cost Driver
    const costs = [
        { name: "Materials", value: materialsTotal },
        { name: "Labor", value: laborTotal },
        { name: "Overhead", value: overheadTotal },
    ];
    const primaryDriver = costs.reduce((prev, current) =>
        (prev.value > current.value) ? prev : current
    );

    const driverPercentage = totalCost > 0
        ? ((primaryDriver.value / totalCost) * 100).toFixed(0)
        : "0";

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Cost - Large Card */}
            <Card className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Total Estimated Cost
                        </p>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white font-mono-numbers">
                            {formatCurrency(totalCost)}
                        </h2>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        Based on {componentCount} identified components
                    </p>
                </CardContent>
            </Card>

            {/* Component Count */}
            <Card>
                <CardContent className="p-6 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Components</p>
                        <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold font-mono-numbers">{componentCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Individual parts</p>
                </CardContent>
            </Card>

            {/* Primary Driver */}
            <Card>
                <CardContent className="p-6 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Primary Driver</p>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-xl font-bold truncate" title={primaryDriver.name}>
                        {primaryDriver.name}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-mono-numbers">{driverPercentage}%</span> of total cost
                    </p>
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="md:col-span-2">
                <CostBreakdownPieChart
                    materialsTotal={materialsTotal}
                    laborTotal={laborTotal}
                    overheadTotal={overheadTotal}
                />
            </div>

            <div className="md:col-span-2">
                {materialCosts && materialCosts.length > 0 ? (
                    <MaterialCostBarChart materialCosts={materialCosts} />
                ) : (
                    <Card className="h-full flex items-center justify-center min-h-[250px] bg-muted/20">
                        <div className="text-center text-muted-foreground">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No detailed material data yet</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
