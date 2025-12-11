"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExWorksBreakdownChart, MaterialCostBarChart } from "@/components/cost-breakdown-chart";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Package, TrendingUp, Factory } from "lucide-react";

interface ExWorksCostBreakdown {
    rawMaterial: number;
    conversion: number;
    labour: number;
    packing: number;
    overhead: number;
    margin: number;
    totalExWorks: number;
}

interface CostPercentages {
    rawMaterial: number;
    conversion: number;
    labour: number;
    packing: number;
    overhead: number;
    margin: number;
}

interface MaterialCostItem {
    component: string;
    material: string;
    totalCost: number;
}

interface OverviewGridProps {
    unitCost: number;
    currency: string;
    componentCount: number;
    aum?: number;
    exWorksCostBreakdown?: ExWorksCostBreakdown;
    costPercentages?: CostPercentages;
    materialCosts: MaterialCostItem[];
}

export function OverviewGrid({
    unitCost,
    currency,
    componentCount,
    aum,
    exWorksCostBreakdown,
    costPercentages,
    materialCosts,
}: OverviewGridProps) {

    // Find primary cost driver
    const drivers = exWorksCostBreakdown ? [
        { name: "Raw Material", value: exWorksCostBreakdown.rawMaterial },
        { name: "Conversion", value: exWorksCostBreakdown.conversion },
        { name: "Labour", value: exWorksCostBreakdown.labour },
        { name: "Packing", value: exWorksCostBreakdown.packing },
        { name: "Overhead", value: exWorksCostBreakdown.overhead },
        { name: "Margin", value: exWorksCostBreakdown.margin },
    ] : [];

    const primaryDriver = drivers.length > 0
        ? drivers.reduce((prev, current) => (prev.value > current.value) ? prev : current)
        : { name: "N/A", value: 0 };

    const driverPercentage = unitCost > 0
        ? ((primaryDriver.value / unitCost) * 100).toFixed(0)
        : "0";

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            {/* Unit Cost - Large Card */}
            <Card className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Ex-Works Unit Cost
                        </p>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white font-mono">
                            ${unitCost.toFixed(4)}
                        </h2>
                        <span className="text-sm text-muted-foreground">{currency}/unit</span>
                    </div>
                    {aum && (
                        <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                            <Factory className="w-4 h-4" />
                            AUM: {(aum / 1000000).toFixed(0)}M units/year
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Component Count */}
            <Card>
                <CardContent className="p-6 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Components</p>
                        <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold font-mono">{componentCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Bill of materials</p>
                </CardContent>
            </Card>

            {/* Primary Driver */}
            <Card>
                <CardContent className="p-6 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Cost Driver</p>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-xl font-bold truncate" title={primaryDriver.name}>
                        {primaryDriver.name}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-mono">{driverPercentage}%</span> of unit cost
                    </p>
                </CardContent>
            </Card>

            {/* Ex-Works Breakdown Chart */}
            <div className="md:col-span-2">
                {exWorksCostBreakdown ? (
                    <ExWorksBreakdownChart breakdown={exWorksCostBreakdown} />
                ) : (
                    <Card className="h-full flex items-center justify-center min-h-[250px] bg-muted/20">
                        <div className="text-center text-muted-foreground">
                            <p>Loading cost breakdown...</p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Material Bar Chart */}
            <div className="md:col-span-2">
                {materialCosts && materialCosts.length > 0 ? (
                    <MaterialCostBarChart materialCosts={materialCosts} />
                ) : (
                    <Card className="h-full flex items-center justify-center min-h-[250px] bg-muted/20">
                        <div className="text-center text-muted-foreground">
                            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No material data yet</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
