"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Clock, Wrench, Hammer, Paintbrush, CheckCircle } from "lucide-react";

interface LaborCosts {
  assembly: number;
  manufacturing: number;
  finishing: number;
  qualityControl: number;
  totalHours: number;
  totalCost: number;
}

interface LaborEstimatesProps {
  costs: LaborCosts;
  isLoading?: boolean;
}

const laborCategories = [
  { key: "manufacturing", label: "Manufacturing", icon: Wrench, color: "text-orange-500" },
  { key: "assembly", label: "Assembly", icon: Hammer, color: "text-blue-500" },
  { key: "finishing", label: "Finishing", icon: Paintbrush, color: "text-purple-500" },
  { key: "qualityControl", label: "Quality Control", icon: CheckCircle, color: "text-green-500" },
];

export function LaborEstimates({ costs, isLoading }: LaborEstimatesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Labor Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
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

  if (!costs || costs.totalCost === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Labor Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No labor costs calculated yet.
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
            <Clock className="h-5 w-5 text-green-500" />
            Labor Costs
          </span>
          <Badge variant="success">{costs.totalHours} hours</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {laborCategories.map(({ key, label, icon: Icon, color }) => {
            const cost = costs[key as keyof LaborCosts];
            if (typeof cost !== "number" || cost === 0) return null;
            
            return (
              <div
                key={key}
                className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <span className="font-medium">{label}</span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(cost)}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <div>
            <span className="font-semibold">Total Labor</span>
            <p className="text-sm text-muted-foreground">
              {costs.totalHours} hours of work
            </p>
          </div>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(costs.totalCost)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default LaborEstimates;
