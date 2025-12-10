"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

// Ex-Works breakdown (6 components)
interface ExWorksCostBreakdown {
  rawMaterial: number;
  conversion: number;
  labour: number;
  packing: number;
  overhead: number;
  margin: number;
  totalExWorks: number;
}

interface ExWorksBreakdownChartProps {
  breakdown: ExWorksCostBreakdown;
}

import { CostWaterfallChart } from "@/components/charts/waterfall-chart";

// Legacy pie chart (kept for compatibility)
interface CostBreakdownChartProps {
  materialsTotal: number;
  laborTotal: number;
  overheadTotal: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

// Colors for 6 Ex-Works components
const EX_WORKS_COLORS = [
  "#3b82f6", // Raw Material - Blue
  "#8b5cf6", // Conversion - Purple
  "#10b981", // Labour - Green
  "#f59e0b", // Packing - Amber
  "#ef4444", // Overhead - Red
  "#6b7280", // Margin - Gray
];

export function ExWorksBreakdownChart({ breakdown }: ExWorksBreakdownChartProps) {
  const data = [
    { name: "Raw Material", value: breakdown.rawMaterial, color: EX_WORKS_COLORS[0] },
    { name: "Conversion", value: breakdown.conversion, color: EX_WORKS_COLORS[1] },
    { name: "Labour", value: breakdown.labour, color: EX_WORKS_COLORS[2] },
    { name: "Packing", value: breakdown.packing, color: EX_WORKS_COLORS[3] },
    { name: "Overhead", value: breakdown.overhead, color: EX_WORKS_COLORS[4] },
    { name: "Margin", value: breakdown.margin, color: EX_WORKS_COLORS[5] },
  ].filter((item) => item.value > 0);

  return (
    <div className="h-full">
      <CostWaterfallChart
        data={data}
        title="Ex-Works Cost Structure"
        currency="$"
        showPercentage={true}
      />
    </div>
  );
}

export function CostBreakdownPieChart({
  materialsTotal,
  laborTotal,
  overheadTotal,
}: CostBreakdownChartProps) {
  const data = [
    { name: "Materials", value: materialsTotal, color: COLORS[0] },
    { name: "Labor", value: laborTotal, color: COLORS[1] },
    { name: "Overhead", value: overheadTotal, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  const total = materialsTotal + laborTotal + overheadTotal;

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{item.name}</p>
          <p className="text-sm">{formatCurrency(item.value)}</p>
          <p className="text-xs text-muted-foreground">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Cost Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Material cost bar chart
interface MaterialCostItem {
  component: string;
  material: string;
  totalCost: number;
}

interface MaterialCostBarChartProps {
  materialCosts: MaterialCostItem[];
}

export function MaterialCostBarChart({ materialCosts }: MaterialCostBarChartProps) {
  // Sort by cost descending and take top 5
  const sortedMaterials = [...materialCosts].sort((a, b) => b.totalCost - a.totalCost);
  const top5 = sortedMaterials.slice(0, 5);
  const others = sortedMaterials.slice(5);
  
  // Calculate "Others" sum
  const othersTotal = others.reduce((sum, item) => sum + item.totalCost, 0);
  
  // Build display data
  const displayData = top5.map((item) => ({
    name: item.component.length > 12
      ? item.component.substring(0, 12) + "..."
      : item.component,
    cost: item.totalCost,
    fullName: item.component,
    material: item.material,
  }));
  
  // Add "Others" if there are more than 5 materials
  if (others.length > 0) {
    displayData.push({
      name: "Others",
      cost: othersTotal,
      fullName: `${others.length} other materials`,
      material: others.map(m => m.material).join(", "),
    });
  }
  
  const data = displayData;

  const CustomBarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; material: string; cost: number } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{item.fullName}</p>
          <p className="text-sm text-muted-foreground">{item.material}</p>
          <p className="text-sm font-mono">${item.cost.toFixed(4)}/unit</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Material Costs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => `$${value.toFixed(3)}`}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="cost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default CostBreakdownPieChart;
