"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Package } from "lucide-react";

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

export function MaterialsBreakdown({ costs, isLoading }: MaterialsBreakdownProps) {
  const total = costs.reduce((sum, item) => sum + item.totalCost, 0);

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
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <p className="text-muted-foreground text-sm">
            No material costs calculated yet.
          </p>
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
          <Badge variant="info">{costs.length} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {costs.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-start p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{item.component}</p>
                <p className="text-sm text-muted-foreground">
                  {item.material} • {item.quantity} {item.unit} @ {formatCurrency(item.pricePerUnit)}/{item.unit}
                </p>
              </div>
              <p className="font-semibold text-blue-600">
                {formatCurrency(item.totalCost)}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <span className="font-semibold">Total Materials</span>
          <span className="text-xl font-bold text-blue-600">
            {formatCurrency(total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default MaterialsBreakdown;
