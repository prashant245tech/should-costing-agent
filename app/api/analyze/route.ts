import { NextRequest, NextResponse } from "next/server";
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

// Extended analysis result with detailed breakdowns
interface DetailedAnalysisResult extends FullAnalysisResult {
  conversionDetails?: ConversionBreakdown;
  labourDetails?: LabourBreakdown;
  packingDetails?: PackingBreakdown;
  overheadDetails?: OverheadBreakdown;
  marginAnalysis?: MarginBreakdown;
}

// Log which LLM provider is active on first request
logProviderInfo();

// POST /api/analyze - Run Ex-Works cost analysis
export async function POST(req: NextRequest) {
  try {
    const { productDescription, action, currentState, aum } = await req.json();

    if (action === "approve" && currentState) {
      const prompts = getPrompts(currentState.category || "default");
      const report = await generateReport(currentState, prompts);
      return NextResponse.json({ success: true, ...report });
    }

    if (!productDescription) {
      return NextResponse.json(
        { error: "Product description is required" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error in cost analysis:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}

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
    }
  }

  const materialsTotal = materialCosts.reduce((sum, m) => sum + m.totalCost, 0);
  return { materialCosts, materialsTotal };
}

async function generateReport(state: CostData, prompts: CostingPrompts) {
  const similarProducts = await searchSimilarProducts(state.productDescription);

  console.log("Generating report...");
  const response = await complete(
    `${prompts.systemRole}\n\n${prompts.reportPrompt(state, similarProducts)}`,
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
      productName: state.productDescription.split(/[,.]|for|with/i)[0].trim().slice(0, 100),
      productDescription: state.productDescription,
      totalCost: state.exWorksCostBreakdown?.totalExWorks || state.totalCost,
      breakdown: {
        exWorks: state.exWorksCostBreakdown,
        materials: state.materialCosts,
        components: state.components,
        aum: state.aum,
      },
    });
  } catch (e) {
    console.error("Failed to save historical cost:", e);
  }

  return {
    finalReport: reportText,
    breakdown: {
      exWorksCostBreakdown: state.exWorksCostBreakdown,
      materialsTotal: state.materialsTotal,
      unitCost: state.exWorksCostBreakdown?.totalExWorks,
      costSavingOpportunities,
      targetPrice,
    },
    approvalStatus: "approved",
    progress: 100,
  };
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
