"use client";

import React, { useState, useCallback } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { CostingDashboard } from "@/components/costing-dashboard";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import {
  ExWorksCostBreakdown,
  CostPercentages,
  ProductComponent,
  MaterialCostItem
} from "@/lib/prompts/types";

// Local UI Types


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

  // AUM
  aum?: number;
  aumReasoning?: string;

  // Components & Materials
  components: ProductComponent[];
  materialCosts: MaterialCostItem[];

  // Ex-Works Cost Structure
  exWorksCostBreakdown?: ExWorksCostBreakdown;
  costPercentages?: CostPercentages;
  unitCost: number;
  currency: string;

  // Legacy (kept for compatibility)
  totalCost: number;

  // UI State
  breakdown: CostBreakdown | null;
  approvalStatus: ApprovalStatus;
  currentNode: string;
  progress: number;
  finalReport: string;
  error: string | null;
}

const initialState: CostingState = {
  productDescription: "",
  analysisContext: undefined,
  category: "",
  categoryName: "",
  subCategory: "",
  detectionMessage: "",
  aum: undefined,
  aumReasoning: "",
  components: [],
  materialCosts: [],
  exWorksCostBreakdown: undefined,
  costPercentages: undefined,
  unitCost: 0,
  currency: "USD",
  totalCost: 0,
  breakdown: null,
  approvalStatus: "pending",
  currentNode: "",
  progress: 0,
  finalReport: "",
  error: null,
};

function CostingAppContent() {
  const [state, setState] = useState<CostingState>(initialState);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Make state readable to CopilotKit
  useCopilotReadable({
    description: "The current state of the should-cost analysis",
    value: JSON.stringify({
      productDescription: state.productDescription,
      category: state.categoryName,
      unitCost: state.unitCost,
      aum: state.aum,
      progress: state.progress,
      approvalStatus: state.approvalStatus,
      componentsCount: state.components.length,
      hasReport: !!state.finalReport,
    }),
  });

  // Action: Analyze a product
  useCopilotAction({
    name: "analyzeProduct",
    description: "Analyze a product to calculate its Ex-Works should-cost estimate for procurement negotiations.",
    parameters: [
      {
        name: "productDescription",
        type: "string",
        description: "A detailed description of the product to analyze",
        required: true,
      },
      {
        name: "aum",
        type: "number",
        description: "Optional Annual Unit Movement (volume). If not provided, AI will estimate.",
        required: false,
      },
    ],
    handler: async ({ productDescription, aum }) => {
      setIsAnalyzing(true);
      setState((prev) => ({
        ...prev,
        productDescription,
        currentNode: "analyze",
        progress: 10,
        error: null,
      }));

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productDescription, aum }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Analysis failed");
        }

        setState((prev) => ({
          ...prev,
          ...data,
          currentNode: "overhead",
          progress: 80,
        }));

        const aumInfo = data.aum ? ` (AUM: ${(data.aum / 1000000).toFixed(0)}M units/year)` : "";

        return `${data.detectionMessage || "Analysis complete!"}${aumInfo}

Unit Cost: $${data.unitCost?.toFixed(4) || "0.00"}
Components: ${data.components?.length || 0}

Please review the breakdown and click "Approve" to generate the final report.`;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Analysis failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          currentNode: "",
          progress: 0,
        }));
        return `Error: ${errorMessage}. Please try again.`;
      } finally {
        setIsAnalyzing(false);
      }
    },
  });

  // Action: Approve the estimate
  useCopilotAction({
    name: "approveEstimate",
    description: "Approve the current cost estimate and generate the final report",
    parameters: [],
    handler: async () => {
      if (state.approvalStatus !== "pending" || state.progress < 80) {
        return "There's no pending estimate to approve. Please analyze a product first.";
      }

      setState((prev) => ({
        ...prev,
        approvalStatus: "approved",
        currentNode: "report",
        progress: 90,
      }));

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            currentState: {
              productDescription: state.productDescription,
              category: state.category,
              components: state.components,
              materialCosts: state.materialCosts,
              materialsTotal: state.materialCosts.reduce((sum, m) => sum + m.totalCost, 0),
              exWorksCostBreakdown: state.exWorksCostBreakdown,
              aum: state.aum,
              totalCost: state.unitCost,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Report generation failed");
        }

        setState((prev) => ({
          ...prev,
          ...data,
          currentNode: "report",
          progress: 100,
        }));

        return `Report generated! Ex-Works unit cost: $${state.unitCost.toFixed(4)}. View the full report in the dashboard.`;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Report generation failed";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          approvalStatus: "pending",
        }));
        return `Error generating report: ${errorMessage}`;
      }
    },
  });

  // Action: Reset
  useCopilotAction({
    name: "resetAnalysis",
    description: "Clear the current analysis and start fresh",
    parameters: [],
    handler: async () => {
      setState(initialState);
      return "Analysis cleared. Describe a new product to analyze.";
    },
  });

  const handleApprove = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      approvalStatus: "approved",
      currentNode: "report",
      progress: 90,
    }));

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          currentState: {
            productDescription: state.productDescription,
            category: state.category,
            components: state.components,
            materialCosts: state.materialCosts,
            materialsTotal: state.materialCosts.reduce((sum, m) => sum + m.totalCost, 0),
            exWorksCostBreakdown: state.exWorksCostBreakdown,
            aum: state.aum,
            totalCost: state.unitCost,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Report generation failed");
      }

      setState((prev) => ({
        ...prev,
        ...data,
        currentNode: "report",
        progress: 100,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Report generation failed";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        approvalStatus: "pending",
      }));
    }
  }, [state]);

  const handleReject = useCallback(() => {
    setState((prev) => ({
      ...prev,
      approvalStatus: "rejected",
    }));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <CopilotSidebar
        defaultOpen={true}
        clickOutsideToClose={true}
        className="flex-1 w-full"
        labels={{
          title: "Should Costing Agent",
          initial: "Hi! I'm your procurement cost analyst. Describe a product to get an Ex-Works cost breakdown for vendor negotiations.\n\nTry: \"Oreo cookie\" or \"Cotton t-shirt\"",
        }}
      >
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Should Costing Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ex-Works cost analysis for procurement negotiations
              </p>
            </header>

            <CostingDashboard
              state={state}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        </main>
      </CopilotSidebar>
    </div>
  );
}

export default function CostingApp() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CostingAppContent />
    </CopilotKit>
  );
}
