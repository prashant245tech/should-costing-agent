"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface CostBreakdownChartProps {
  materialsTotal: number;
  laborTotal: number;
  overheadTotal: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"]; // Blue, Green, Amber

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

interface MaterialCostItem {
  component: string;
  material: string;
  totalCost: number;
}

interface MaterialCostBarChartProps {
  materialCosts: MaterialCostItem[];
}

export function MaterialCostBarChart({ materialCosts }: MaterialCostBarChartProps) {
  const data = materialCosts.map((item) => ({
    name: item.component.length > 15 
      ? item.component.substring(0, 15) + "..." 
      : item.component,
    cost: item.totalCost,
    fullName: item.component,
    material: item.material,
  }));

  const CustomBarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; material: string; cost: number } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{item.fullName}</p>
          <p className="text-sm text-muted-foreground">{item.material}</p>
          <p className="text-sm font-medium">{formatCurrency(item.cost)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Material Costs by Component</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis type="category" dataKey="name" width={100} />
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
