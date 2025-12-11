"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CHART_COLORS } from "@/lib/constants";

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
  analysisContext?: string;
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
  Target,
  Zap,
  AlertCircle,
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
    analysisContext,
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
          description: `${c.quantity} ${c.unit} @ ${currency}${c.pricePerUnit.toFixed(2)}/${c.unit}`,
          quantity: c.quantity,
          unit: c.unit,
          unitCost: c.pricePerUnit
        }
      ])
    )
    : undefined;

  // Prepare Waterfall Data with Drill-down Context
  const waterfallData = exWorksCostBreakdown ? [
    {
      name: "Raw Material",
      value: exWorksCostBreakdown.rawMaterial,
      color: CHART_COLORS.rawMaterial,
      description: exWorksCostBreakdown.rawMaterialDetails?.description,
      details: rawMaterialSubComponents as any // Cast because SubComponent type is inferred locally in detail panel but keys match
    },
    {
      name: "Packaging",
      value: exWorksCostBreakdown.packing,
      color: CHART_COLORS.packing,
      description: exWorksCostBreakdown.packingDetails?.description,
      details: exWorksCostBreakdown.packingDetails?.subComponents,
      negotiationPoints: exWorksCostBreakdown.packingDetails?.negotiationPoints
    },
    {
      name: "Conversion",
      value: exWorksCostBreakdown.conversion,
      color: CHART_COLORS.conversion,
      description: exWorksCostBreakdown.conversionDetails?.description,
      details: exWorksCostBreakdown.conversionDetails?.subComponents,
      negotiationPoints: exWorksCostBreakdown.conversionDetails?.negotiationPoints
    },
    {
      name: "Labor",
      value: exWorksCostBreakdown.labour,
      color: CHART_COLORS.labor,
      description: exWorksCostBreakdown.labourDetails?.description,
      details: exWorksCostBreakdown.labourDetails?.subComponents,
      negotiationPoints: exWorksCostBreakdown.labourDetails?.negotiationPoints
    },
    {
      name: "Overhead",
      value: exWorksCostBreakdown.overhead,
      color: CHART_COLORS.overhead,
      description: exWorksCostBreakdown.overheadDetails?.description,
      details: exWorksCostBreakdown.overheadDetails?.subComponents,
      negotiationPoints: exWorksCostBreakdown.overheadDetails?.negotiationPoints
    },
    {
      name: "Margin",
      value: exWorksCostBreakdown.margin,
      color: CHART_COLORS.margin,
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
          <Button variant="ghost" size="icon" className="rounded-full" title="Share Analysis" aria-label="Share Analysis">
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-gray-800" aria-label="Export Brief">
            <Download className="w-4 h-4" />
            Export Brief
          </Button>
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
        <Tabs defaultValue="overview" className="w-full relative z-10">
          <TabsList className="grid w-full grid-cols-4 bg-muted/40 p-1">
            <TabsTrigger value="overview">Executive Overview</TabsTrigger>
            <TabsTrigger value="materials">Cost Engineering (BOM)</TabsTrigger>
            <TabsTrigger value="waterfall">Detailed Breakdown</TabsTrigger>
            <TabsTrigger value="report">Negotiation Brief</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4 w-full">
            {/* Product Context Widget */}
            <AnalysisContextWidget description={analysisContext || productDescription} />

            {approvalStatus === "pending" && progress >= 80 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Review Estimation</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Total Ex-Works: <span className="font-mono font-bold">${unitCost.toFixed(4)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onReject} className="hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300">
                    Reject
                  </Button>
                  <Button variant="default" size="sm" onClick={onApprove} className="bg-blue-600 hover:bg-blue-700">
                    Approve Model
                  </Button>
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
          <TabsContent value="materials" className="mt-4 w-full">
            <DenseBOMTable
              items={materialCosts}
              totalCost={materialCosts.reduce((sum, i) => sum + i.totalCost, 0)}
            />
          </TabsContent>

          {/* Waterfall Tab (Vertical Hero Layout) */}
          <TabsContent value="waterfall" className="mt-4 w-full">
            <div className="flex flex-col gap-6 h-[900px] w-full">

              {/* Top Section: Hero Chart (60%) */}
              <div className="h-[60%] w-full">
                <CostWaterfallChart
                  data={waterfallData}
                  currency={currency === "USD" ? "$" : currency}
                  title="Cost Breakdown by Component"
                  onBarClick={(data) => setSelectedCategory(data.name)}
                  selectedIndex={selectedCategory ? waterfallData.findIndex(d => d.name === selectedCategory) : null}
                />
              </div>

              {/* Bottom Section: Breakdown Panel (40%) */}
              <div className="h-[40%] flex gap-6 min-h-0 w-full">
                {selectedCategoryData ? (
                  <>
                    {/* Left Column: Cost Drivers Table (2/3) */}
                    <Card className="flex-[2_1_0%] min-w-0 flex flex-col overflow-hidden border-t-4" style={{ borderTopColor: selectedCategoryData.color }}>
                      <CardHeader className="py-3 px-4 bg-muted/20 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            Primary Cost Drivers: {selectedCategoryData.name}
                          </CardTitle>
                          <Badge variant="outline" className="font-mono">
                            {currency}{selectedCategoryData.value.toFixed(4)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 overflow-auto flex-1">
                        {selectedCategoryData.details ? (
                          <table className="w-full text-sm text-left">
                            <thead className="bg-muted/5 sticky top-0 backdrop-blur-sm">
                              <tr className="border-b">
                                <th className="py-2 px-4 font-medium text-muted-foreground w-1/3">Driver Name</th>
                                <th className="py-2 px-4 font-medium text-muted-foreground text-right">Usage</th>
                                <th className="py-2 px-4 font-medium text-muted-foreground text-right">Unit Cost</th>
                                <th className="py-2 px-4 font-medium text-muted-foreground text-right">Total Cost</th>
                                <th className="py-2 px-4 font-medium text-muted-foreground text-right">% Contrib.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {Object.values(selectedCategoryData.details)
                                .sort((a: any, b: any) => b.cost - a.cost)
                                .map((item: any, idx) => (
                                  <tr key={idx} className="hover:bg-muted/20">
                                    <td className="py-2 px-4 font-medium text-sm">
                                      {item.name}
                                    </td>
                                    <td className="py-2 px-4 text-right text-muted-foreground text-xs font-mono">
                                      {item.quantity ? `${item.quantity} ${item.unit || ''}` : '-'}
                                    </td>
                                    <td className="py-2 px-4 text-right text-muted-foreground text-xs font-mono">
                                      {item.unitCost ? `${currency}${item.unitCost.toFixed(4)}` : '-'}
                                    </td>
                                    <td className="py-2 px-4 text-right font-mono text-sm">
                                      {currency}{item.cost.toFixed(4)}
                                    </td>
                                    <td className="py-2 px-4 text-right text-muted-foreground text-xs">
                                      {(item.percentage * 100).toFixed(1)}%
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                            <p>No itemized data available for this category.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Right Column: Negotiation Insight (1/3) */}
                    <Card className="flex-1 min-w-0 flex flex-col overflow-hidden">
                      <CardHeader className="py-3 px-4 bg-muted/20 border-b">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-600" />
                          Negotiation Insight
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 overflow-auto flex-1 bg-green-50/50 dark:bg-green-900/10">
                        {selectedCategoryData.negotiationPoints && selectedCategoryData.negotiationPoints.length > 0 ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              {selectedCategoryData.negotiationPoints.map((point: string, i: number) => (
                                <div key={i} className="flex gap-2 items-start text-sm text-green-900 dark:text-green-100 p-2 bg-white/50 dark:bg-black/20 rounded border border-green-100 dark:border-green-800">
                                  <Zap className="w-3 h-3 mt-1 text-green-600 shrink-0" />
                                  <span>{point}</span>
                                </div>
                              ))}
                            </div>
                            {selectedCategoryData.description && (
                              <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                                <span className="font-semibold block mb-1">About this category:</span>
                                {selectedCategoryData.description}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
                            <p className="text-sm">No specific negotiation insights generated for this category.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="w-full flex items-center justify-center bg-muted/20 border-dashed">
                    <CardContent className="text-center p-6">
                      <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Select a Category</h3>
                      <p className="text-sm text-muted-foreground">
                        Click on a bar in the chart above to view the cost breakdown and insights.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="mt-4 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Cost Structure Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {exWorksCostBreakdown && (
                  <div className="overflow-x-auto">
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
            <Button className="bg-green-600 hover:bg-green-700 gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
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
