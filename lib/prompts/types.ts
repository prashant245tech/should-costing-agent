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

// ============================================================================
// DETAILED SUB-COMPONENT BREAKDOWNS (for procurement negotiations)
// ============================================================================

/**
 * Base interface for cost sub-components
 * Each sub-component has a cost, percentage of category, and reasoning
 */
export interface CostSubComponent {
    name: string;
    cost: number;
    percentage: number; // As decimal (0.30 = 30% of category)
    description?: string;
    benchmarkRange?: { min: number; max: number }; // Industry benchmark for negotiation
}

/**
 * Conversion Cost Breakdown
 * Equipment, utilities, and process-related costs
 */
export interface ConversionBreakdown {
    total: number;
    subComponents: {
        equipmentDepreciation: CostSubComponent;  // Machine depreciation per unit
        utilities: CostSubComponent;               // Electricity, gas, water
        maintenance: CostSubComponent;             // Equipment maintenance allocation
        processConsumables: CostSubComponent;      // Tools, dies, molds wear
    };
    description?: string;
    negotiationPoints?: string[];
}

/**
 * Labour Cost Breakdown
 * Direct and indirect labor costs
 */
export interface LabourBreakdown {
    total: number;
    subComponents: {
        directLabor: CostSubComponent;      // Operators, line workers
        supervision: CostSubComponent;       // Line supervisors, shift leads
        qualityInspection: CostSubComponent; // In-line QC personnel
        materialHandling: CostSubComponent;  // Warehouse, logistics staff
    };
    laborRate?: number;        // $/hour average
    unitsPerLaborHour?: number; // Productivity metric
    automationLevel?: "low" | "medium" | "high" | "fully-automated";
    description?: string;
    negotiationPoints?: string[];
}

/**
 * Packing Cost Breakdown
 * Primary, secondary, and tertiary packaging
 */
export interface PackingBreakdown {
    total: number;
    subComponents: {
        primaryPackaging: CostSubComponent;    // Direct product contact (wrapper, container)
        secondaryPackaging: CostSubComponent;  // Consumer unit (box, sleeve, carton)
        tertiaryPackaging: CostSubComponent;   // Shipping (corrugated, pallets)
        labelsAndPrinting: CostSubComponent;   // Labels, printing, coding
    };
    description?: string;
    negotiationPoints?: string[];
}

/**
 * Overhead Cost Breakdown
 * Indirect costs and allocations
 */
export interface OverheadBreakdown {
    total: number;
    subComponents: {
        facilityAllocation: CostSubComponent;  // Rent, property, insurance
        qualityAssurance: CostSubComponent;    // QA systems, testing, compliance
        administration: CostSubComponent;      // General admin, HR allocation
        regulatoryCompliance: CostSubComponent; // Certifications, audits, standards
    };
    overheadRate?: number; // As percentage of direct costs
    description?: string;
    negotiationPoints?: string[];
}

/**
 * Margin Analysis
 * Kept semi-opaque but with reasoning based on market factors
 */
export interface MarginBreakdown {
    total: number;
    percentage: number; // As decimal (0.12 = 12%)
    factors: {
        industryAverage: number;      // Typical margin for this industry/product
        brandStrength: "weak" | "moderate" | "strong" | "dominant";
        competitivePosition: "commodity" | "differentiated" | "niche" | "premium";
        volumeImpact: "low-volume-premium" | "standard" | "high-volume-discount";
        relationshipTier: "transactional" | "preferred" | "strategic-partner";
    };
    reasoning: string;  // Why this margin is justified
    negotiationRange?: { min: number; max: number }; // Acceptable negotiation range
}

// ============================================================================
// ENHANCED EX-WORKS COST BREAKDOWN
// ============================================================================

/**
 * Ex-Works Cost Breakdown Structure (Enhanced)
 * Now includes detailed sub-component breakdowns for each category
 */
export interface ExWorksCostBreakdown {
    // Summary values (backward compatible)
    rawMaterial: number;      // Direct materials cost
    conversion: number;       // Machine time, depreciation, utilities
    labour: number;           // Direct labor (industry benchmarks)
    packing: number;          // Primary & secondary packaging
    overhead: number;         // All indirect costs
    margin: number;           // Supplier profit
    totalExWorks: number;     // Sum of all components

    // Detailed breakdowns (optional for backward compatibility)
    rawMaterialDetails?: {
        total: number;
        components: MaterialCostItem[];
        description?: string;
        negotiationPoints?: string[];
    };
    conversionDetails?: ConversionBreakdown;
    labourDetails?: LabourBreakdown;
    packingDetails?: PackingBreakdown;
    overheadDetails?: OverheadBreakdown;
    marginAnalysis?: MarginBreakdown;
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

    // LLM-generated product context for display
    analysisContext?: string;

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

    // Classification prompt (lightweight, category detection only)
    classifyPrompt?: (productDescription: string, categoryList: string) => string;

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

// ============================================================================
// CATEGORY CONFIGURATION (for extensible prompt system)
// ============================================================================

/**
 * Labor category definition for category-specific labor types
 */
export interface LaborCategory {
    id: string;
    name: string;
    description: string;
    defaultSkillLevel: "entry" | "intermediate" | "expert";
}

/**
 * Category configuration - defines category-specific settings
 * Used by the prompt registry to provide industry-specific defaults
 */
export interface CategoryConfig {
    id: string;
    name: string;
    description: string;

    // Labor categories specific to this industry
    laborCategories?: LaborCategory[];

    // Typical overhead range for this category
    overheadRange?: {
        min: number;   // e.g., 0.08
        max: number;   // e.g., 0.15
        typical: number;
    };

    // Common units for components in this category
    commonUnits?: string[];

    // Industry benchmarks for cost percentages
    industryBenchmarks?: {
        laborPercentage?: { min: number; max: number; typical: number };
        rawMaterialPercentage?: { min: number; max: number; typical: number };
        marginPercentage?: { min: number; max: number; typical: number };
    };

    // Any other category-specific metadata
    metadata?: Record<string, unknown>;
}

/**
 * Subcategory definition for hierarchical classification
 */
export interface SubcategoryDefinition {
    id: string;
    name: string;
    examples: string;  // Comma-separated examples: "cookies, cakes, breads"
}

/**
 * Category definition for UI display and classification
 */
export interface CategoryDefinition {
    id: string;
    name: string;
    description: string;
    subcategories?: SubcategoryDefinition[];
}

/**
 * Classification result from the classify prompt
 */
export interface ClassificationResult {
    category: string;
    subCategory: string;
    confidence: number;
    reasoning?: string;
}
