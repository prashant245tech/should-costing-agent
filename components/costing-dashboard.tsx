"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostWaterfallChart } from "@/components/charts/waterfall-chart";
import { DenseBOMTable } from "@/components/tables/dense-bom-table";
import { OverviewGrid } from "@/components/overview-grid";
import { AnalysisContextWidget } from "@/components/analysis-context-widget";
import { CategoryDetailPanel } from "@/components/category-detail-panel";
import {
  ExWorksCostBreakdown,
  CostPercentages,
  ProductComponent,
  MaterialCostItem
} from "@/lib/prompts/types";

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

import {
  Search,
  Package,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
  Settings2,
  Download,
  Share2,
  TrendingUp,
} from "lucide-react";

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

  // Analysis Selection State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Helper to normalize raw materials
  const rawMaterialSubComponents = exWorksCostBreakdown?.rawMaterialDetails?.components
    ? Object.fromEntries(
      exWorksCostBreakdown.rawMaterialDetails.components.map((c, i) => [
        `item-${i}`,
        {
          name: c.component,
          cost: c.totalCost,
          percentage: exWorksCostBreakdown.rawMaterialDetails?.total
            ? c.totalCost / exWorksCostBreakdown.rawMaterialDetails.total
            : 0,
          description: `${c.quantity} ${c.unit} @ ${currency}${c.pricePerUnit.toFixed(2)}/${c.unit}`
        }
      ])
    )
    : undefined;

  // Prepare Waterfall Data with Drill-down Context
  const waterfallData = exWorksCostBreakdown ? [
    {
      name: "Raw Material",
      value: exWorksCostBreakdown.rawMaterial,
      color: "#3b82f6",
      description: exWorksCostBreakdown.rawMaterialDetails?.description,
      details: rawMaterialSubComponents as any // Cast because SubComponent type is inferred locally in detail panel but keys match
    },
    {
      name: "Conversion",
      value: exWorksCostBreakdown.conversion,
      color: "#8b5cf6",
      description: exWorksCostBreakdown.conversionDetails?.description,
      details: exWorksCostBreakdown.conversionDetails?.subComponents,
      negotiationPoints: exWorksCostBreakdown.conversionDetails?.negotiationPoints
    },
    {
      name: "Labour",
      value: exWorksCostBreakdown.labour,
      color: "#10b981",
      description: exWorksCostBreakdown.labourDetails?.description,
      details: exWorksCostBreakdown.labourDetails?.subComponents,
      negotiationPoints: exWorksCostBreakdown.labourDetails?.negotiationPoints
    },
    {
      name: "Packing",
      value: exWorksCostBreakdown.packing,
      color: "#f59e0b",
      description: exWorksCostBreakdown.packingDetails?.description,
      details: exWorksCostBreakdown.packingDetails?.subComponents,
      negotiationPoints: exWorksCostBreakdown.packingDetails?.negotiationPoints
    },
    {
      name: "Overhead",
      value: exWorksCostBreakdown.overhead,
      color: "#ef4444",
      description: exWorksCostBreakdown.overheadDetails?.description,
      details: exWorksCostBreakdown.overheadDetails?.subComponents,
      negotiationPoints: exWorksCostBreakdown.overheadDetails?.negotiationPoints
    },
    {
      name: "Margin",
      value: exWorksCostBreakdown.margin,
      color: "#6b7280",
      description: exWorksCostBreakdown.marginAnalysis?.reasoning,
      details: undefined,
      negotiationPoints: exWorksCostBreakdown.marginAnalysis?.reasoning ? [exWorksCostBreakdown.marginAnalysis.reasoning] : []
    },
  ] : [];

  // Get info for the selected category panel
  const selectedCategoryData = selectedCategory
    ? waterfallData.find(d => d.name === selectedCategory)
    : waterfallData[0]; // Default to first item if nothing selected, or handle empty

  // Scenario State (Mock for frontend demo)
  const [scenarioVolume, setScenarioVolume] = useState(100); // 100% baseline

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

  // Show initial state (unchanged)...  

  if (!productDescription) {
    const examples = [
      "Oreo Cookie (Food & Bev)",
      "Cotton T-Shirt (Apparel)",
      "Aluminum Beverage Can",
      "Corrugated Shipping Box"
    ];

    return (
      <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <CardContent className="pt-12 pb-12">
          <div className="text-center max-w-lg mx-auto">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Enterprise Cost Modeling</h3>
            <p className="text-muted-foreground mb-8 text-base">
              Generate procurement-grade cost models with Ex-Works breakdown, AUM estimation, and variance analysis.
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
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to extract product name
  const productName = productDescription.split(':')[0].split(' with ')[0].substring(0, 60);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {productName}
          </h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {categoryName && (
              <Badge variant="outline" className="font-normal text-xs">
                {categoryName} {subCategory && ` / ${subCategory}`}
              </Badge>
            )}
            {aum && (
              <span className="flex items-center gap-1 border-l pl-4 ml-2">
                <FileText className="w-3 h-3" />
                Annual Production Volume: {(aum / 1000000).toFixed(1)}M/yr
              </span>
            )}
            <span className="flex items-center gap-1">
              <Settings2 className="w-3 h-3" />
              Scenario: Baseline
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-muted rounded-full" title="Share Analysis">
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-muted bg-white dark:bg-gray-800">
            <Download className="w-4 h-4" />
            Export Brief
          </button>
        </div>
      </div>

      {/* Progress Section */}
      {currentNode && progress < 100 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-medium">
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                {nodeInfo[currentNode]?.label || "Processing..."}
              </div>
              <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {!showFinalReport && (components.length > 0 || exWorksCostBreakdown) && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/40 p-1">
            <TabsTrigger value="overview">Executive Overview</TabsTrigger>
            <TabsTrigger value="materials">Cost Engineering (BOM)</TabsTrigger>
            <TabsTrigger value="waterfall">Detailed Breakdown</TabsTrigger>
            <TabsTrigger value="report">Negotiation Brief</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Product Context Widget */}
            <AnalysisContextWidget description={productDescription} />

            {approvalStatus === "pending" && progress >= 80 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Review Estimation</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Total Ex-Works: <span className="font-mono font-bold">${unitCost.toFixed(4)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={onReject} className="px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50 text-red-600 border-red-200">Reject</button>
                  <button onClick={onApprove} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm">Approve Model</button>
                </div>
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

          {/* Materials Tab (Excel Grid) */}
          <TabsContent value="materials" className="mt-4">
            <DenseBOMTable
              items={materialCosts}
              totalCost={materialCosts.reduce((sum, i) => sum + i.totalCost, 0)}
            />
          </TabsContent>

          {/* Waterfall Tab (Split View) */}
          <TabsContent value="waterfall" className="mt-4 h-[600px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Left: Interactive Waterfall Chart */}
              <div className="lg:col-span-8 h-full">
                <CostWaterfallChart
                  data={waterfallData}
                  currency={currency === "USD" ? "$" : currency}
                  title={`Cost Breakdown for ${productDescription}`}
                  onBarClick={(data) => setSelectedCategory(data.name)}
                  selectedIndex={selectedCategory ? waterfallData.findIndex(d => d.name === selectedCategory) : null}
                />
              </div>

              {/* Right: Detail Panel */}
              <div className="lg:col-span-4 h-full">
                {selectedCategoryData ? (
                  <CategoryDetailPanel
                    categoryName={selectedCategoryData.name}
                    totalCost={selectedCategoryData.value}
                    currency={currency === "USD" ? "$" : currency}
                    color={selectedCategoryData.color}
                    description={selectedCategoryData.description}
                    subComponents={selectedCategoryData.details}
                    negotiationPoints={selectedCategoryData.negotiationPoints}
                    onClose={() => setSelectedCategory(null)}
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center bg-muted/20 border-dashed">
                    <CardContent className="text-center p-6">
                      <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Detailed Breakdown</h3>
                      <p className="text-sm text-muted-foreground">
                        Click on any cost bar in the chart to view detailed sub-components and negotiation strategies.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Structure Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {exWorksCostBreakdown && (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">Component</th>
                          <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">$/Unit</th>
                          <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider">% of Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {waterfallData.map((row) => (
                          <tr key={row.name} className="hover:bg-muted/30">
                            <td className="py-2 px-4 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: row.color }} />
                              <div>
                                <div className="font-medium">{row.name}</div>
                                {row.description && (
                                  <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] leading-tight">
                                    {row.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-2 px-4 font-mono-numbers">${row.value.toFixed(4)}</td>
                            <td className="text-right py-2 px-4 text-muted-foreground w-32">
                              {((row.value / unitCost) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/20 font-bold border-t-2 border-border">
                          <td className="py-3 px-4">Total Ex-Works</td>
                          <td className="text-right py-3 px-4 font-mono-numbers">${unitCost.toFixed(4)}</td>
                          <td className="text-right py-3 px-4">100.0%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Final Report View */}
      {showFinalReport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full text-green-700 dark:text-green-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">Negotiation Brief Ready</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Analysis finalized and approved.</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>

          {/* Show Waterfall in Final Report too */}
          <div className="h-[400px]">
            <CostWaterfallChart
              data={waterfallData}
              currency={currency === "USD" ? "$" : currency}
              title="Final Cost Build-up"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CostingDashboard;
