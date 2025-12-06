import { StateGraph, END, START } from "@langchain/langgraph";
import { CostingStateAnnotation, CostingState } from "./state";
import { analyzeProduct } from "./nodes/analyze-product";
import { calculateMaterialCosts } from "./nodes/calculate-materials";
import { calculateLaborCosts } from "./nodes/calculate-labor";
import { analyzeOverhead } from "./nodes/analyze-overhead";
import { generateReport } from "./nodes/generate-report";

// Node wrapper to handle errors gracefully
function wrapNode(
  nodeFn: (state: CostingState) => Promise<Partial<CostingState>>,
  nodeName: string
) {
  return async (state: CostingState): Promise<Partial<CostingState>> => {
    try {
      const result = await nodeFn(state);
      return {
        ...result,
        currentNode: nodeName,
      };
    } catch (error) {
      console.error(`Error in node ${nodeName}:`, error);
      return {
        error: `Error in ${nodeName}: ${error instanceof Error ? error.message : "Unknown error"}`,
        currentNode: nodeName,
      };
    }
  };
}

// Conditional function to check if we should proceed to report generation
function shouldGenerateReport(state: CostingState): string {
  // Check for errors
  if (state.error) {
    return END;
  }
  
  // Check approval status
  if (state.approvalStatus === "approved") {
    return "report";
  }
  
  if (state.approvalStatus === "rejected") {
    return END;
  }
  
  // If pending, wait for user input (end this execution)
  return END;
}

// Build the workflow graph
export function buildCostingWorkflow() {
  const workflow = new StateGraph(CostingStateAnnotation);

  // Add all nodes
  workflow.addNode("analyze", wrapNode(analyzeProduct, "analyze"));
  workflow.addNode("materials", wrapNode(calculateMaterialCosts, "materials"));
  workflow.addNode("labor", wrapNode(calculateLaborCosts, "labor"));
  workflow.addNode("overhead", wrapNode(analyzeOverhead, "overhead"));
  workflow.addNode("report", wrapNode(generateReport, "report"));

  // Define the flow - use type assertion for edge connections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graph = workflow as any;
  graph.addEdge(START, "analyze");
  graph.addEdge("analyze", "materials");
  graph.addEdge("materials", "labor");
  graph.addEdge("labor", "overhead");

  // Add conditional edge for human approval
  graph.addConditionalEdges("overhead", shouldGenerateReport, {
    report: "report",
    [END]: END,
  });

  graph.addEdge("report", END);

  return workflow.compile();
}

// Create and export the compiled agent
export const costingAgent = buildCostingWorkflow();

// Helper function to run the full analysis
export async function runCostAnalysis(productDescription: string): Promise<CostingState> {
  const initialState: Partial<CostingState> = {
    productDescription,
    approvalStatus: "pending",
    progress: 0,
    messages: [],
  };

  const result = await costingAgent.invoke(initialState);
  return result as CostingState;
}

// Helper function to continue after approval
export async function continueAfterApproval(state: CostingState): Promise<CostingState> {
  const updatedState: Partial<CostingState> = {
    ...state,
    approvalStatus: "approved",
  };

  // Run just the report generation
  const reportResult = await generateReport(updatedState as CostingState);
  
  return {
    ...state,
    ...reportResult,
  } as CostingState;
}

export default costingAgent;
