"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Building2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface OverheadAnalysisProps {
  materialsTotal: number;
  laborTotal: number;
  overheadPercentage: number;
  overheadTotal: number;
  totalCost: number;
  approvalStatus: "pending" | "approved" | "rejected" | "needs_revision";
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function OverheadAnalysis({
  materialsTotal,
  laborTotal,
  overheadPercentage,
  overheadTotal,
  totalCost,
  approvalStatus,
  onApprove,
  onReject,
  isLoading,
}: OverheadAnalysisProps) {
  const directCosts = materialsTotal + laborTotal;

  const getStatusBadge = () => {
    switch (approvalStatus) {
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "needs_revision":
        return <Badge variant="warning">Needs Revision</Badge>;
      default:
        return <Badge variant="info">Pending Review</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Overhead & Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-500" />
            Cost Summary
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Materials Subtotal</span>
            <span className="font-medium">{formatCurrency(materialsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Labor Subtotal</span>
            <span className="font-medium">{formatCurrency(laborTotal)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span>Direct Costs</span>
            <span className="font-medium">{formatCurrency(directCosts)}</span>
          </div>
        </div>

        {/* Overhead section */}
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Overhead</p>
              <p className="text-sm text-muted-foreground">
                {formatPercentage(overheadPercentage)} of direct costs
              </p>
            </div>
            <span className="text-lg font-bold text-amber-600">
              {formatCurrency(overheadTotal)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">Total Estimated Cost</p>
              <p className="text-sm text-muted-foreground">
                Materials + Labor + Overhead
              </p>
            </div>
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
              {formatCurrency(totalCost)}
            </span>
          </div>
        </div>

        {/* Approval notice */}
        {approvalStatus === "pending" && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Review Required
              </p>
              <p className="text-blue-600 dark:text-blue-400">
                Please review the cost estimate and approve to generate the final report.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {approvalStatus === "pending" && (
        <CardFooter className="flex gap-3">
          <Button
            variant="success"
            className="flex-1"
            onClick={onApprove}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve & Generate Report
          </Button>
          <Button
            variant="outline"
            onClick={onReject}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </CardFooter>
      )}

      {approvalStatus === "approved" && (
        <CardFooter>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Cost estimate approved - generating report...</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default OverheadAnalysis;
