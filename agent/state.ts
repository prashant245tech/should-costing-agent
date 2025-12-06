import { Annotation } from "@langchain/langgraph";

// Component interface for product breakdown
export interface ProductComponent {
  name: string;
  material: string;
  quantity: number;
  unit: string;
  estimatedCost?: number;
}

// Labor cost breakdown
export interface LaborCosts {
  assembly: number;
  manufacturing: number;
  finishing: number;
  qualityControl: number;
  totalHours: number;
  totalCost: number;
}

// Material cost item
export interface MaterialCostItem {
  component: string;
  material: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
}

// Full cost breakdown
export interface CostBreakdown {
  materialsTotal: number;
  laborTotal: number;
  overheadTotal: number;
  grandTotal: number;
  summary: string;
  costSavingOpportunities?: string[];
}

// Approval status type
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

// Define the agent state annotation for LangGraph
export const CostingStateAnnotation = Annotation.Root({
  // Input from user
  productDescription: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),
  
  // Analysis results
  components: Annotation<ProductComponent[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),
  
  // Material costs
  materialCosts: Annotation<MaterialCostItem[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),
  
  // Labor costs
  laborCosts: Annotation<LaborCosts>({
    reducer: (_, y) => y,
    default: () => ({
      assembly: 0,
      manufacturing: 0,
      finishing: 0,
      qualityControl: 0,
      totalHours: 0,
      totalCost: 0,
    }),
  }),
  
  // Overhead
  overheadPercentage: Annotation<number>({
    reducer: (_, y) => y,
    default: () => 0.25, // Default 25% overhead
  }),
  overheadTotal: Annotation<number>({
    reducer: (_, y) => y,
    default: () => 0,
  }),
  
  // Totals
  totalCost: Annotation<number>({
    reducer: (_, y) => y,
    default: () => 0,
  }),
  
  // Full breakdown
  breakdown: Annotation<CostBreakdown | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
  
  // Human-in-the-loop
  approvalStatus: Annotation<ApprovalStatus>({
    reducer: (_, y) => y,
    default: () => 'pending',
  }),
  userFeedback: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),
  
  // Metadata for UI
  currentNode: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),
  progress: Annotation<number>({
    reducer: (_, y) => y,
    default: () => 0,
  }),
  
  // Messages for chat
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  
  // Final report
  finalReport: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),
  
  // Error handling
  error: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
});

// Export the state type for use in nodes
export type CostingState = typeof CostingStateAnnotation.State;
