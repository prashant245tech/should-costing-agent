"use client";

import React, { useState, useCallback } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { CostingDashboard } from "@/components/costing-dashboard";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

// State types
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

const initialState: CostingState = {
  productDescription: "",
  components: [],
  materialCosts: [],
  laborCosts: {
    assembly: 0,
    manufacturing: 0,
    finishing: 0,
    qualityControl: 0,
    totalHours: 0,
    totalCost: 0,
  },
  overheadPercentage: 0.25,
  overheadTotal: 0,
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
      totalCost: state.totalCost,
      progress: state.progress,
      approvalStatus: state.approvalStatus,
      componentsCount: state.components.length,
      hasReport: !!state.finalReport,
    }),
  });

  // Action: Analyze a product
  useCopilotAction({
    name: "analyzeProduct",
    description: "Analyze a product to calculate its should-cost estimate. Use this when the user describes a product they want to cost.",
    parameters: [
      {
        name: "productDescription",
        type: "string",
        description: "A detailed description of the product to analyze",
        required: true,
      },
    ],
    handler: async ({ productDescription }) => {
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
          body: JSON.stringify({ productDescription }),
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

        return `Analysis complete! I found ${data.components?.length || 0} components.
Total estimated cost: $${data.totalCost?.toFixed(2) || 0}.
Please review the breakdown in the dashboard and click "Approve" to generate the final report.`;
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
              components: state.components,
              materialCosts: state.materialCosts,
              materialsTotal: state.materialCosts.reduce((sum, m) => sum + m.totalCost, 0),
              laborCosts: state.laborCosts,
              overheadPercentage: state.overheadPercentage,
              overheadTotal: state.overheadTotal,
              totalCost: state.totalCost,
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

        return `Report generated successfully! The final cost estimate is $${state.totalCost.toFixed(2)}. You can view the detailed report in the dashboard and download it as needed.`;
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

  // Action: Reset the analysis
  useCopilotAction({
    name: "resetAnalysis",
    description: "Clear the current analysis and start fresh",
    parameters: [],
    handler: async () => {
      setState(initialState);
      return "Analysis cleared. You can now describe a new product to analyze.";
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
            components: state.components,
            materialCosts: state.materialCosts,
            materialsTotal: state.materialCosts.reduce((sum, m) => sum + m.totalCost, 0),
            laborCosts: state.laborCosts,
            overheadPercentage: state.overheadPercentage,
            overheadTotal: state.overheadTotal,
            totalCost: state.totalCost,
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
        className="h-full"
        instructions={`You are an expert cost analyst assistant helping users perform should-cost analysis for products.

Your capabilities:
1. Analyze products when users describe what they want to cost
2. Break down products into components (materials, labor, overhead)
3. Calculate material costs using current market prices
4. Estimate labor hours based on manufacturing complexity
5. Calculate overhead costs
6. Generate detailed cost reports with cost-saving recommendations

How to interact:
- When a user describes a product (e.g., "I want to cost a wooden dining table"), use the analyzeProduct action to start the analysis
- After analysis completes, remind users to review the dashboard and approve the estimate
- When users say "approve" or want to generate the report, use the approveEstimate action
- If users want to start over, use the resetAnalysis action

Be conversational and helpful. Ask clarifying questions if the product description is vague (e.g., dimensions, materials, quantity).

Current analysis status:
- Product: ${state.productDescription || "None"}
- Progress: ${state.progress}%
- Status: ${state.approvalStatus}
- Total Cost: ${state.totalCost ? `$${state.totalCost.toFixed(2)}` : "Not calculated"}
`}
        labels={{
          title: "Should Costing Agent",
          initial: "Hi! I'm your cost analysis assistant. Describe a product you'd like to cost, and I'll break down all the materials, labor, and overhead costs for you.\n\nFor example, try: \"I want to cost a wooden dining table that seats 6 people\"",
        }}
      >
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Should Costing Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered cost analysis for any product
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
