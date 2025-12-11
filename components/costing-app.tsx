"use client";

import React, { useState, useCallback } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { CostingDashboard } from "@/components/costing-dashboard";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { usePersistedState } from "@/hooks/usePersistedState";
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
  const [state, setState, clearStoredState] = usePersistedState<CostingState>(initialState);
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

  // Action: Analyze a product (client-side to update UI state)
  useCopilotAction({
    name: "analyzeProduct",
    description: "Analyze a product to calculate its Ex-Works should-cost estimate for procurement negotiations.",
    followUp: false,  // Skip second LLM call - we return our own message
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
        progress: 5,
        error: null,
      }));

      return new Promise<string>((resolve) => {
        const params = new URLSearchParams({ productDescription });
        if (aum) params.set("aum", String(aum));
        
        const eventSource = new EventSource(`/api/analyze/stream?${params}`);
        
        eventSource.onmessage = (event) => {
          try {
            const { type, step, percent, details, data, message } = JSON.parse(event.data);
            
            if (type === "progress") {
              setState((prev) => ({
                ...prev,
                currentNode: step,
                progress: percent,
              }));
            } else if (type === "complete" && data) {
              setState((prev) => ({
                ...prev,
                ...data,
                currentNode: "overhead",
                progress: 80,
              }));
              eventSource.close();
              setIsAnalyzing(false);
              resolve(`✓ Analysis complete • Cost: $${data.unitCost?.toFixed(4)} • Review dashboard`);
            } else if (type === "error") {
              setState((prev) => ({
                ...prev,
                error: message || "Analysis failed",
                currentNode: "",
                progress: 0,
              }));
              eventSource.close();
              setIsAnalyzing(false);
              resolve(`Error: ${message}. Please try again.`);
            }
          } catch (e) {
            console.error("SSE parse error:", e);
          }
        };
        
        eventSource.onerror = () => {
          eventSource.close();
          setState((prev) => ({
            ...prev,
            error: "Connection lost",
            currentNode: "",
            progress: 0,
          }));
          setIsAnalyzing(false);
          resolve("Error: Connection lost. Please try again.");
        };
      });
    },
  });

  // Action: Approve the estimate (client-side to update UI state)
  useCopilotAction({
    name: "approveEstimate",
    description: "Approve the current cost estimate and generate the final report",
    followUp: false,  // Skip second LLM call
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

        return `✓ Report generated • View in dashboard`;
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

  // Action: Reset (client-side to update UI state)
  useCopilotAction({
    name: "resetAnalysis",
    description: "Clear the current analysis and start fresh",
    followUp: false,  // Skip second LLM call
    parameters: [],
    handler: async () => {
      clearStoredState(); // Clears localStorage and resets state
      return "✓ Reset complete";
    },
  });

  // Manual approve button handler
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
        clickOutsideToClose={false}
        className="flex-1 w-full"
        labels={{
          title: "Should Costing Agent",
          initial: "Hi! I'm your procurement cost analyst. Describe a product to get an Ex-Works cost breakdown for vendor negotiations.\n\nTry: \"Oreo cookie\" or \"Cotton t-shirt\"",
        }}
      >
        <main className="flex-1 p-6 md:p-8 overflow-y-scroll min-h-full">
          <div className="w-full max-w-[1600px] mx-auto">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Should Costing Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Ex-Works cost analysis for procurement negotiations
                </p>
              </div>

              {state.progress > 0 && (
                <button
                  onClick={() => clearStoredState()}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-700 dark:bg-gray-800 dark:text-red-400 dark:border-red-900 dark:hover:bg-gray-700 transition-colors"
                >
                  Reset Analysis
                </button>
              )}
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
