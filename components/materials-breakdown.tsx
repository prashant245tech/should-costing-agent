"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Package, ArrowUpDown } from "lucide-react";

interface MaterialCostItem {
  component: string;
  material: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
}

interface MaterialsBreakdownProps {
  costs: MaterialCostItem[];
  isLoading?: boolean;
}

type SortField = 'component' | 'material' | 'quantity' | 'totalCost';
type SortOrder = 'asc' | 'desc';

export function MaterialsBreakdown({ costs, isLoading }: MaterialsBreakdownProps) {
  const [sortField, setSortField] = useState<SortField>('totalCost');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const total = costs.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending for new fields (usually better for numbers)
    }
  };

  const sortedCosts = [...costs].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    if (typeof a[sortField] === 'string') {
      return (a[sortField] as string).localeCompare(b[sortField] as string) * multiplier;
    }
    return ((a[sortField] as number) - (b[sortField] as number)) * multiplier;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!costs || costs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed">
            <Package className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">No materials calculated yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Start an analysis to see the breakdown of material costs here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Material Costs
          </span>
          <Badge variant="secondary">{costs.length} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('component')}>
                  <div className="flex items-center gap-1">Component <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('material')}>
                  <div className="flex items-center gap-1">Material <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors text-right" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-end gap-1">Quantity <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 cursor-pointer hover:text-foreground transition-colors text-right" onClick={() => handleSort('totalCost')}>
                  <div className="flex items-center justify-end gap-1">Total <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedCosts.map((item, index) => (
                <tr key={index} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.component}</td>
                  <td className="px-6 py-4 text-muted-foreground">{item.material}</td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {item.quantity} <span className="text-xs text-muted-foreground ml-0.5">{item.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-muted-foreground font-mono-numbers">
                    {formatCurrency(item.pricePerUnit)}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums font-semibold text-foreground font-mono-numbers">
                    {formatCurrency(item.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-800/50 font-semibold border-t">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right">Total Materials Cost</td>
                <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400 text-base font-mono-numbers">
                  {formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default MaterialsBreakdown;
