/**
 * Core costing logic - extracted for use by CopilotKit actions and API routes
 */
import { complete, extractJSON, logProviderInfo } from "@/lib/llm";
import { findMaterialPrice, searchSimilarProducts, saveHistoricalCost } from "@/lib/db";
import {
  getPrompts,
  getPromptsAsync,
  buildCategoryListForClassification,
  CATEGORY_DEFINITIONS,
  DEFAULT_CATEGORY_ID,
} from "@/lib/prompts";
import {
  CostingPrompts,
  ProductComponent,
  MaterialCostItem,
  CostData,
  FullAnalysisResult,
  ExWorksCostBreakdown,
  ConversionBreakdown,
  LabourBreakdown,
  PackingBreakdown,
  OverheadBreakdown,
  MarginBreakdown,
  ClassificationResult,
} from "@/lib/prompts/types";

// Log provider info once
logProviderInfo();

// Extended analysis result with detailed breakdowns
interface DetailedAnalysisResult extends FullAnalysisResult {
  conversionDetails?: ConversionBreakdown;
  labourDetails?: LabourBreakdown;
  packingDetails?: PackingBreakdown;
  overheadDetails?: OverheadBreakdown;
  marginAnalysis?: MarginBreakdown;
}

// Result types for external consumers
export interface AnalysisResult {
  success: boolean;
  category: string;
  categoryName: string;
  subCategory: string;
  detectionMessage: string;
  productDescription: string;
  analysisContext?: string;
  aum?: number;
  aumReasoning?: string;
  components: ProductComponent[];
  materialCosts: MaterialCostItem[];
  exWorksCostBreakdown: ExWorksCostBreakdown;
  costPercentages: {
    rawMaterial: number;
    conversion: number;
    labour: number;
    packing: number;
    overhead: number;
    margin: number;
  };
  unitCost: number;
  currency: string;
  approvalStatus: "pending" | "approved" | "rejected";
}

export interface ReportResult {
  success: boolean;
  finalReport: string;
  breakdown: {
    exWorksCostBreakdown?: ExWorksCostBreakdown;
    materialsTotal?: number;
    unitCost?: number;
    costSavingOpportunities: string[];
    targetPrice?: number;
  };
  approvalStatus: "approved";
  progress: number;
}

// Input type for report generation (simpler than legacy CostData)
export interface ReportInput {
  productDescription: string;
  category?: string;
  components: ProductComponent[];
  materialCosts: MaterialCostItem[];
  materialsTotal?: number;
  exWorksCostBreakdown?: ExWorksCostBreakdown;
  aum?: number;
  totalCost?: number;
}

/**
 * Run full Ex-Works cost analysis for a product
 */
export async function runAnalysis(
  productDescription: string,
  aum?: number
): Promise<AnalysisResult> {
  // Build hierarchical category list for classification
  const categoryList = buildCategoryListForClassification();

  // STEP 1: Lightweight classification to identify product category
  const defaultPrompts = getPrompts("default");

  console.log("Step 1: Classifying product...");
  const classifyResponse = await complete(
    defaultPrompts.classifyPrompt!(productDescription, categoryList),
    { maxTokens: 500 }
  );

  const classification = extractJSON<ClassificationResult>(classifyResponse, "object");

  // Use default category if classification fails
  const detectedCategory = classification?.category || DEFAULT_CATEGORY_ID;
  const detectedSubCategory = classification?.subCategory || "general";
  const confidence = classification?.confidence || 0.5;

  console.log(`Classified as: ${detectedCategory}/${detectedSubCategory} (${Math.round(confidence * 100)}% confidence)`);

  // STEP 2: Load category-specific prompts
  const prompts = await getPromptsAsync(detectedCategory, detectedSubCategory);
  const categoryDef = CATEGORY_DEFINITIONS.find(c => c.id === detectedCategory);

  console.log(`Using ${prompts.categoryName} prompts for detailed analysis...`);

  // STEP 3: Full analysis with category-specific prompts
  console.log("Step 2: Running detailed Ex-Works analysis...");
  const analysisResponse = await complete(
    `${prompts.systemRole}\n\n${prompts.fullAnalysisPrompt(productDescription, categoryList, aum)}`,
    { maxTokens: 16000 }
  );

  const analysis = extractJSON<DetailedAnalysisResult>(analysisResponse, "object");

  if (!analysis || !analysis.components || analysis.components.length === 0) {
    throw new Error("Failed to parse analysis response");
  }

  // Override category with our classification result (more reliable)
  analysis.category = detectedCategory;
  analysis.subCategory = detectedSubCategory;
  analysis.confidence = confidence;
  analysis.reasoning = classification?.reasoning || analysis.reasoning;

  console.log(`Detected: ${categoryDef?.name || detectedCategory} (${Math.round(confidence * 100)}%)`);
  console.log(`AUM: ${analysis.aum?.toLocaleString() || 'Not specified'}`);

  // Normalize components
  const components: ProductComponent[] = analysis.components.map((c) => ({
    name: String(c.name || "Unknown"),
    material: String(c.material || "unknown").toLowerCase(),
    quantity: Number(c.quantity) || 0.001,
    unit: String(c.unit || "kg").toLowerCase(),
  }));

  // Calculate material costs
  const { materialCosts, materialsTotal } = await calculateMaterialCosts(components, prompts);

  // Calculate Ex-Works breakdown from percentages
  const estimatedUnitCost = analysis.estimatedUnitCost || 1.00;
  const costPercentages = analysis.costPercentages || {
    rawMaterial: 0.45,
    conversion: 0.15,
    labour: 0.10,
    packing: 0.10,
    overhead: 0.10,
    margin: 0.10
  };

  // Use actual material cost if we have it, otherwise use estimate
  const actualRawMaterialCost = materialsTotal > 0 ? materialsTotal : estimatedUnitCost * costPercentages.rawMaterial;

  // Recalculate total based on actual raw material if available
  const rawMaterialPercent = costPercentages.rawMaterial;
  const totalFromMaterials = materialsTotal > 0 ? materialsTotal / rawMaterialPercent : estimatedUnitCost;

  // Build Ex-Works breakdown with detailed sub-components
  const conversionCost = totalFromMaterials * costPercentages.conversion;
  const labourCost = totalFromMaterials * costPercentages.labour;
  const packingCost = totalFromMaterials * costPercentages.packing;
  const overheadCost = totalFromMaterials * costPercentages.overhead;
  const marginCost = totalFromMaterials * costPercentages.margin;

  const exWorksCostBreakdown: ExWorksCostBreakdown = {
    rawMaterial: actualRawMaterialCost,
    conversion: conversionCost,
    labour: labourCost,
    packing: packingCost,
    overhead: overheadCost,
    margin: marginCost,
    totalExWorks: 0, // Will calculate

    // Include raw material details with actual material costs
    rawMaterialDetails: {
      total: actualRawMaterialCost,
      components: materialCosts,
      description: `Direct material costs for ${components.length} ingredients`,
      negotiationPoints: ["Commodity price fluctuations", "Volume discounts", "Alternative suppliers"]
    },

    // Include detailed breakdowns from LLM if available, or scale from percentages
    conversionDetails: analysis.conversionDetails ? scaleBreakdown(analysis.conversionDetails, conversionCost) : undefined,
    labourDetails: analysis.labourDetails ? scaleLabourBreakdown(analysis.labourDetails, labourCost) : undefined,
    packingDetails: analysis.packingDetails ? scaleBreakdown(analysis.packingDetails, packingCost) : undefined,
    overheadDetails: analysis.overheadDetails ? scaleOverheadBreakdown(analysis.overheadDetails, overheadCost) : undefined,
    marginAnalysis: analysis.marginAnalysis ? {
      ...analysis.marginAnalysis,
      total: marginCost,
      percentage: costPercentages.margin
    } : undefined,
  };

  exWorksCostBreakdown.totalExWorks =
    exWorksCostBreakdown.rawMaterial +
    exWorksCostBreakdown.conversion +
    exWorksCostBreakdown.labour +
    exWorksCostBreakdown.packing +
    exWorksCostBreakdown.overhead +
    exWorksCostBreakdown.margin;

  // Build detection message
  const detectionMessage = analysis.subCategory
    ? `Detected: **${categoryDef?.name || analysis.category}** → **${analysis.subCategory}** (${Math.round((analysis.confidence || 0.8) * 100)}% confidence). ${analysis.reasoning || ''}`
    : `Detected: **${categoryDef?.name || analysis.category}** (${Math.round((analysis.confidence || 0.8) * 100)}% confidence). ${analysis.reasoning || ''}`;

  return {
    success: true,
    category: analysis.category,
    categoryName: categoryDef?.name || analysis.category,
    subCategory: analysis.subCategory || "",
    detectionMessage,
    productDescription,

    // LLM-generated analysis context for display
    analysisContext: analysis.analysisContext || productDescription,

    // AUM
    aum: analysis.aum,
    aumReasoning: analysis.aumReasoning,

    // Components
    components,
    materialCosts,

    // Ex-Works breakdown
    exWorksCostBreakdown,
    costPercentages,

    // Summary
    unitCost: exWorksCostBreakdown.totalExWorks,
    currency: analysis.currency || "USD",

    approvalStatus: "pending",
  };
}

/**
 * Generate approval report for a completed analysis
 */
export async function generateApprovalReport(currentState: ReportInput): Promise<ReportResult> {
  const prompts = getPrompts(currentState.category || "default");
  const similarProducts = await searchSimilarProducts(currentState.productDescription);

  // Build CostData-compatible object for report prompt
  const materialsTotal = currentState.materialsTotal ?? 
    currentState.materialCosts.reduce((sum, m) => sum + m.totalCost, 0);
  
  const reportData: CostData = {
    productDescription: currentState.productDescription,
    components: currentState.components,
    materialCosts: currentState.materialCosts,
    materialsTotal,
    // Legacy fields with defaults
    laborCosts: {
      manufacturing: 0,
      assembly: 0,
      finishing: 0,
      qualityControl: 0,
      totalHours: 0,
      totalCost: currentState.exWorksCostBreakdown?.labour ?? 0,
    },
    overheadPercentage: 0.10,
    overheadTotal: currentState.exWorksCostBreakdown?.overhead ?? 0,
    totalCost: currentState.totalCost ?? currentState.exWorksCostBreakdown?.totalExWorks ?? 0,
    exWorksCostBreakdown: currentState.exWorksCostBreakdown,
    aum: currentState.aum,
  };

  console.log("Generating report...");
  const response = await complete(
    `${prompts.systemRole}\n\n${prompts.reportPrompt(reportData, similarProducts)}`,
    { maxTokens: 2500 }
  );

  let reportText = response;
  let costSavingOpportunities: string[] = [];
  let targetPrice: number | undefined;

  const parsed = extractJSON<{ costSavingOpportunities: string[]; targetPrice?: number }>(reportText, "object");
  if (parsed) {
    costSavingOpportunities = parsed.costSavingOpportunities || [];
    targetPrice = parsed.targetPrice;
    const jsonMatch = reportText.match(/\{[\s\S]*"costSavingOpportunities"[\s\S]*\}/);
    if (jsonMatch) {
      reportText = reportText.replace(jsonMatch[0], "").trim();
    }
  }

  // Save to historical costs
  try {
    await saveHistoricalCost({
      productName: currentState.productDescription.split(/[,.]|for|with/i)[0].trim().slice(0, 100),
      productDescription: currentState.productDescription,
      totalCost: currentState.exWorksCostBreakdown?.totalExWorks || currentState.totalCost || 0,
      breakdown: {
        exWorks: currentState.exWorksCostBreakdown,
        materials: currentState.materialCosts,
        components: currentState.components,
        aum: currentState.aum,
      },
    });
  } catch (e) {
    console.error("Failed to save historical cost:", e);
  }

  return {
    success: true,
    finalReport: reportText,
    breakdown: {
      exWorksCostBreakdown: currentState.exWorksCostBreakdown,
      materialsTotal,
      unitCost: currentState.exWorksCostBreakdown?.totalExWorks,
      costSavingOpportunities,
      targetPrice,
    },
    approvalStatus: "approved",
    progress: 100,
  };
}

/**
 * Calculate material costs for components
 */
async function calculateMaterialCosts(
  components: ProductComponent[],
  prompts: CostingPrompts
): Promise<{ materialCosts: MaterialCostItem[]; materialsTotal: number }> {
  const materialCosts: MaterialCostItem[] = [];
  const unknownMaterials: ProductComponent[] = [];

  // First pass: look up known materials in DB
  for (const component of components) {
    const materialPrice = await findMaterialPrice(component.material);

    if (materialPrice) {
      const totalCost = component.quantity * materialPrice.pricePerUnit;
      materialCosts.push({
        component: component.name,
        material: component.material,
        quantity: component.quantity,
        unit: materialPrice.unit,
        pricePerUnit: materialPrice.pricePerUnit,
        totalCost: Math.round(totalCost * 10000) / 10000, // 4 decimal places for unit costs
      });
    } else {
      unknownMaterials.push(component);
    }
  }

  // Second pass: estimate unknown materials (CONDITIONAL LLM CALL)
  if (unknownMaterials.length > 0) {
    console.log(`Pricing ${unknownMaterials.length} unknown materials...`);
    const response = await complete(
      `${prompts.systemRole}\n\n${prompts.materialPrompt(unknownMaterials)}`,
      { maxTokens: 8000 }
    );

    const estimates = extractJSON<Record<string, { pricePerUnit: number; unit: string }>>(response, "object");

    if (estimates) {
      for (const component of unknownMaterials) {
        let estimate = estimates[component.name]
          || estimates[component.material]
          || Object.entries(estimates).find(([key]) =>
            key.toLowerCase() === component.name.toLowerCase() ||
            key.toLowerCase() === component.material.toLowerCase()
          )?.[1]
          || { pricePerUnit: 1.00, unit: component.unit };

        const totalCost = component.quantity * estimate.pricePerUnit;
        materialCosts.push({
          component: component.name,
          material: component.material,
          quantity: component.quantity,
          unit: estimate.unit || component.unit,
          pricePerUnit: estimate.pricePerUnit,
          totalCost: Math.round(totalCost * 10000) / 10000,
        });
      }
    } else {
      // Fallback: if LLM fails to estimate, add all unknown materials with default pricing
      console.warn("LLM failed to estimate materials, using fallback pricing");
      for (const component of unknownMaterials) {
        const fallbackPrice = 1.00; // Default $1/unit
        const totalCost = component.quantity * fallbackPrice;
        materialCosts.push({
          component: component.name,
          material: component.material,
          quantity: component.quantity,
          unit: component.unit,
          pricePerUnit: fallbackPrice,
          totalCost: Math.round(totalCost * 10000) / 10000,
        });
      }
    }
  }

  const materialsTotal = materialCosts.reduce((sum, m) => sum + m.totalCost, 0);
  return { materialCosts, materialsTotal };
}

// Helper functions to scale LLM-provided breakdowns to actual calculated costs

/**
 * Scale a generic breakdown (conversion/packing) to match actual calculated cost
 * Preserves percentages but adjusts absolute costs
 */
function scaleBreakdown<T extends { total: number; subComponents: Record<string, { cost: number; percentage: number; name: string; description?: string }> }>(
  breakdown: T,
  actualTotal: number
): T {
  const scaleFactor = actualTotal / (breakdown.total || 1);

  const scaledSubComponents = Object.fromEntries(
    Object.entries(breakdown.subComponents).map(([key, sub]) => [
      key,
      {
        ...sub,
        cost: Math.round(sub.cost * scaleFactor * 10000) / 10000,
      }
    ])
  ) as T['subComponents'];

  return {
    ...breakdown,
    total: actualTotal,
    subComponents: scaledSubComponents,
  };
}

/**
 * Scale labour breakdown with additional labour-specific fields
 */
function scaleLabourBreakdown(breakdown: LabourBreakdown, actualTotal: number): LabourBreakdown {
  const scaled = scaleBreakdown(breakdown, actualTotal);
  return {
    ...scaled,
    laborRate: breakdown.laborRate,
    unitsPerLaborHour: breakdown.unitsPerLaborHour,
    automationLevel: breakdown.automationLevel,
  };
}

/**
 * Scale overhead breakdown with overhead rate
 */
function scaleOverheadBreakdown(breakdown: OverheadBreakdown, actualTotal: number): OverheadBreakdown {
  const scaled = scaleBreakdown(breakdown, actualTotal);
  return {
    ...scaled,
    overheadRate: breakdown.overheadRate,
  };
}
