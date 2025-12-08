// Domain Types for Ex-Works Cost Model

export interface ProductComponent {
    name: string;
    material: string;
    quantity: number;
    unit: string;
    unitCost?: number; // Cost per unit of material
}

export interface MaterialCostItem {
    component: string;
    material: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalCost: number;
}

// Ex-Works Cost Breakdown Structure
export interface ExWorksCostBreakdown {
    rawMaterial: number;      // Direct materials cost
    conversion: number;       // Machine time, depreciation, utilities
    labour: number;           // Direct labor (industry benchmarks)
    packing: number;          // Primary & secondary packaging
    overhead: number;         // All indirect costs
    margin: number;           // Supplier profit
    totalExWorks: number;     // Sum of all components
}

// Percentages for transparency
export interface CostPercentages {
    rawMaterial: number;
    conversion: number;
    labour: number;
    packing: number;
    overhead: number;
    margin: number;
}

// Industry labor benchmarks
export type IndustryType =
    | "food-beverage"
    | "apparel"
    | "consumer-electronics"
    | "packaging"
    | "furniture"
    | "industrial";

export const INDUSTRY_LABOR_BENCHMARKS: Record<IndustryType, { min: number; max: number; typical: number }> = {
    "food-beverage": { min: 0.05, max: 0.12, typical: 0.08 },
    "apparel": { min: 0.20, max: 0.40, typical: 0.30 },
    "consumer-electronics": { min: 0.08, max: 0.15, typical: 0.12 },
    "packaging": { min: 0.08, max: 0.12, typical: 0.10 },
    "furniture": { min: 0.15, max: 0.25, typical: 0.20 },
    "industrial": { min: 0.10, max: 0.20, typical: 0.15 },
};

// Full Analysis Result with Ex-Works structure
export interface FullAnalysisResult {
    category: string;
    subCategory: string;
    confidence: number;
    reasoning: string;

    // Product breakdown
    components: ProductComponent[];

    // AUM (Annual Unit Movement)
    aum: number;           // Annual volume estimate
    aumReasoning: string;  // Why this volume was estimated

    // Ex-Works cost percentages (as ratios, e.g., 0.45 = 45%)
    costPercentages: {
        rawMaterial: number;
        conversion: number;
        labour: number;
        packing: number;
        overhead: number;
        margin: number;
    };

    // Unit cost estimate (before detailed material lookup)
    estimatedUnitCost: number;
    currency: string;
}

// Legacy types (kept for backward compatibility)
export interface LaborEstimate {
    hours: number;
    skillLevel: "entry" | "intermediate" | "expert";
}

export interface LaborEstimates {
    manufacturing: LaborEstimate;
    assembly: LaborEstimate;
    finishing: LaborEstimate;
    qualityControl: LaborEstimate;
}

export interface LaborCosts {
    manufacturing: number;
    assembly: number;
    finishing: number;
    qualityControl: number;
    totalHours: number;
    totalCost: number;
    [key: string]: number;
}

export interface CostData {
    productDescription: string;
    components: ProductComponent[];
    materialCosts: MaterialCostItem[];
    materialsTotal: number;
    laborCosts: LaborCosts;
    overheadPercentage: number;
    overheadTotal: number;
    totalCost: number;
    // New Ex-Works fields
    exWorksCostBreakdown?: ExWorksCostBreakdown;
    aum?: number;
}

// Prompt Interface
export interface CostingPrompts {
    categoryName: string;
    systemRole: string;

    // Ex-Works analysis prompt (returns full cost structure)
    fullAnalysisPrompt: (productDescription: string, categoryList: string, aum?: number) => string;

    // Material pricing (conditional)
    materialPrompt: (unknownMaterials: ProductComponent[]) => string;

    // Report generation
    reportPrompt: (data: CostData, similarProducts: any[]) => string;

    // Deprecated
    analysisPrompt?: (productDescription: string) => string;
    laborPrompt?: (args: { productDescription: string; components: ProductComponent[]; materialsTotal: number }) => string;
    overheadPrompt?: (productDescription: string) => string;
}
