"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExWorksBreakdownChart, MaterialCostBarChart } from "@/components/cost-breakdown-chart";
import { MaterialsBreakdown } from "@/components/materials-breakdown";
import { FinalReport } from "@/components/final-report";
import { OverviewGrid } from "@/components/overview-grid";
import {
  Search,
  Package,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Ex-Works Cost Breakdown
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

interface ProductComponent {
  name: string;
  material: string;
  quantity: number;
  unit: string;
}

interface MaterialCostItem {
  component: string;
  material: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
}

interface CostBreakdown {
  materialsTotal?: number;
  exWorksCostBreakdown?: ExWorksCostBreakdown;
  unitCost?: number;
  costSavingOpportunities?: string[];
  targetPrice?: number;
}

type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_revision";

interface CostingState {
  productDescription: string;
  category: string;
  categoryName: string;
  subCategory: string;
  detectionMessage: string;
  aum?: number;
  aumReasoning?: string;
  components: ProductComponent[];
  materialCosts: MaterialCostItem[];
  exWorksCostBreakdown?: ExWorksCostBreakdown;
  costPercentages?: CostPercentages;
  unitCost: number;
  currency: string;
  totalCost: number;
  breakdown: CostBreakdown | null;
  approvalStatus: ApprovalStatus;
  currentNode: string;
  progress: number;
  finalReport: string;
  error: string | null;
}

interface CostingDashboardProps {
  state: CostingState;
  onApprove: () => void;
  onReject: () => void;
}

const nodeInfo: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  analyze: {
    label: "Analyzing Product",
    icon: <Search className="h-4 w-4" />,
    description: "Classifying product and breaking down components...",
  },
  materials: {
    label: "Pricing Materials",
    icon: <Package className="h-4 w-4" />,
    description: "Looking up material prices...",
  },
  overhead: {
    label: "Calculating Costs",
    icon: <Package className="h-4 w-4" />,
    description: "Computing Ex-Works cost breakdown...",
  },
  report: {
    label: "Generating Report",
    icon: <FileText className="h-4 w-4" />,
    description: "Creating procurement report...",
  },
};

export function CostingDashboard({ state, onApprove, onReject }: CostingDashboardProps) {
  const {
    productDescription,
    categoryName,
    subCategory,
    detectionMessage,
    aum,
    components,
    materialCosts,
    exWorksCostBreakdown,
    costPercentages,
    unitCost,
    currency,
    breakdown,
    approvalStatus,
    currentNode,
    progress,
    finalReport,
    error,
  } = state;

  const isProcessing = progress > 0 && progress < 100 && approvalStatus !== "pending";
  const showFinalReport = progress === 100 && finalReport;

  // Show error state
  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Show initial state
  if (!productDescription) {
    const examples = [
      "Oreo Cookie",
      "Cotton T-Shirt",
      "Aluminum Beverage Can",
      "Cardboard Shipping Box"
    ];

    return (
      <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <CardContent className="pt-12 pb-12">
          <div className="text-center max-w-lg mx-auto">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Ex-Works Cost Analysis</h3>
            <p className="text-muted-foreground mb-8 text-base">
              Describe a product to get a procurement-grade cost breakdown for vendor negotiations.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {examples.map((example, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all cursor-default"
                >
                  <span className="text-sm font-medium">{example}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Try one of these examples in the chat!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      {currentNode && progress < 100 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {nodeInfo[currentNode]?.icon}
                {nodeInfo[currentNode]?.label || "Processing..."}
              </CardTitle>
              <Badge variant="outline">{progress}%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {nodeInfo[currentNode]?.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Approval Section */}
      {approvalStatus === "pending" && progress >= 80 && !showFinalReport && (
        <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  Ready for Review
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Ex-Works Unit Cost: <span className="font-bold text-xl">${unitCost?.toFixed(4) || '0.0000'}</span>
                  <span className="text-xs ml-2">({currency})</span>
                </p>
                {aum && (
                  <p className="text-xs text-blue-500">
                    AUM: {(aum / 1000000).toFixed(0)}M units/year
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onApprove}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve & Generate Report
                </button>
                <button
                  onClick={onReject}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Report View */}
      {showFinalReport && (
        <FinalReport
          breakdown={breakdown}
          report={finalReport}
          productDescription={productDescription}
        />
      )}

      {/* Main Dashboard - 3 Tabs */}
      {!showFinalReport && (components.length > 0 || exWorksCostBreakdown) && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Bill of Materials</TabsTrigger>
            <TabsTrigger value="report">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Category Badge */}
            {categoryName && (
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{categoryName}</Badge>
                {subCategory && <Badge variant="outline">{subCategory}</Badge>}
                {aum && (
                  <Badge variant="outline" className="ml-auto">
                    AUM: {(aum / 1000000).toFixed(0)}M/year
                  </Badge>
                )}
              </div>
            )}

            <OverviewGrid
              unitCost={unitCost || 0}
              currency={currency || "USD"}
              componentCount={components.length}
              aum={aum}
              exWorksCostBreakdown={exWorksCostBreakdown}
              costPercentages={costPercentages}
              materialCosts={materialCosts}
            />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialsBreakdown
              costs={materialCosts || []}
              isLoading={currentNode === "materials"}
            />
          </TabsContent>

          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exWorksCostBreakdown && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Component</th>
                          <th className="text-right py-2">$/Unit</th>
                          <th className="text-right py-2">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Raw Material", value: exWorksCostBreakdown.rawMaterial, pct: costPercentages?.rawMaterial },
                          { name: "Conversion", value: exWorksCostBreakdown.conversion, pct: costPercentages?.conversion },
                          { name: "Labour", value: exWorksCostBreakdown.labour, pct: costPercentages?.labour },
                          { name: "Packing", value: exWorksCostBreakdown.packing, pct: costPercentages?.packing },
                          { name: "Overhead", value: exWorksCostBreakdown.overhead, pct: costPercentages?.overhead },
                          { name: "Margin", value: exWorksCostBreakdown.margin, pct: costPercentages?.margin },
                        ].map((row) => (
                          <tr key={row.name} className="border-b">
                            <td className="py-2">{row.name}</td>
                            <td className="text-right font-mono">${row.value.toFixed(4)}</td>
                            <td className="text-right text-muted-foreground">{((row.pct || 0) * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td className="py-2">Total Ex-Works</td>
                          <td className="text-right font-mono">${exWorksCostBreakdown.totalExWorks.toFixed(4)}</td>
                          <td className="text-right">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {detectionMessage && (
                  <p className="text-sm text-muted-foreground mt-4">{detectionMessage}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default CostingDashboard;
