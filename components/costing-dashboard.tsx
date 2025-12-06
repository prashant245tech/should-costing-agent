"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CostBreakdownPieChart,
  MaterialCostBarChart,
} from "@/components/cost-breakdown-chart";
import { MaterialsBreakdown } from "@/components/materials-breakdown";
import { LaborEstimates } from "@/components/labor-estimates";
import { OverheadAnalysis } from "@/components/overhead-analysis";
import { FinalReport } from "@/components/final-report";
import { OverviewGrid } from "@/components/overview-grid";
import {
  Search,
  Package,
  Clock,
  Building2,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
  Copy,
} from "lucide-react";

// Define the state type inline to avoid import issues
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

interface LaborCosts {
  assembly: number;
  manufacturing: number;
  finishing: number;
  qualityControl: number;
  totalHours: number;
  totalCost: number;
}

interface CostBreakdown {
  materialsTotal: number;
  laborTotal: number;
  overheadTotal: number;
  grandTotal: number;
  summary: string;
  costSavingOpportunities?: string[];
}

type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_revision";

interface CostingState {
  productDescription: string;
  components: ProductComponent[];
  materialCosts: MaterialCostItem[];
  laborCosts: LaborCosts;
  overheadPercentage: number;
  overheadTotal: number;
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
    description: "Breaking down product into components...",
  },
  materials: {
    label: "Calculating Materials",
    icon: <Package className="h-4 w-4" />,
    description: "Looking up material prices and calculating costs...",
  },
  labor: {
    label: "Estimating Labor",
    icon: <Clock className="h-4 w-4" />,
    description: "Estimating manufacturing and assembly time...",
  },
  overhead: {
    label: "Analyzing Overhead",
    icon: <Building2 className="h-4 w-4" />,
    description: "Calculating overhead and total costs...",
  },
  report: {
    label: "Generating Report",
    icon: <FileText className="h-4 w-4" />,
    description: "Creating detailed cost report...",
  },
};

export function CostingDashboard({ state, onApprove, onReject }: CostingDashboardProps) {
  const {
    productDescription,
    components,
    materialCosts,
    laborCosts,
    overheadPercentage,
    overheadTotal,
    totalCost,
    breakdown,
    approvalStatus,
    currentNode,
    progress,
    finalReport,
    error,
  } = state;

  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
  const laborTotal = laborCosts?.totalCost || 0;
  const isProcessing = progress > 0 && progress < 100 && approvalStatus !== "pending";
  const showFinalReport = progress === 100 && breakdown && finalReport;

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
      "Wooden Dining Table for 6",
      "Steel Industrial Bracket",
      "Wireless Gaming Mouse",
      "Cotton T-Shirt with Print"
    ];

    return (
      <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <CardContent className="pt-12 pb-12">
          <div className="text-center max-w-lg mx-auto">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Start Your Cost Analysis</h3>
            <p className="text-muted-foreground mb-8 text-base">
              Describe any product to the AI assistant on the right to get a detailed breakdown of materials, labor, and overhead costs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
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
              Try typing one of these examples in the chat!
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

      {/* Approval Section - Show prominently when pending */}
      {approvalStatus === "pending" && progress >= 80 && !showFinalReport && (
        <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  Ready for Review
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Total Estimated Cost: <span className="font-bold text-xl">${totalCost?.toFixed(2) || '0.00'}</span>
                </p>
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

      {/* Main Dashboard - show when we have data but not final report */}
      {!showFinalReport && (components.length > 0 || materialsTotal > 0) && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Product Info Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-muted-foreground">Analysis for: <span className="text-foreground font-semibold">{productDescription}</span></h3>
            </div>

            <OverviewGrid
              totalCost={totalCost || 0}
              componentCount={components.length}
              materialsTotal={materialsTotal}
              laborTotal={laborTotal}
              overheadTotal={overheadTotal || 0}
              materialCosts={materialCosts}
            />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialsBreakdown
              costs={materialCosts || []}
              isLoading={currentNode === "materials"}
            />
          </TabsContent>

          <TabsContent value="labor">
            <LaborEstimates
              costs={laborCosts}
              isLoading={currentNode === "labor"}
            />
          </TabsContent>

          <TabsContent value="summary">
            <OverheadAnalysis
              materialsTotal={materialsTotal}
              laborTotal={laborTotal}
              overheadPercentage={overheadPercentage || 0.25}
              overheadTotal={overheadTotal || 0}
              totalCost={totalCost || 0}
              approvalStatus={approvalStatus}
              onApprove={onApprove}
              onReject={onReject}
              isLoading={currentNode === "overhead"}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default CostingDashboard;
