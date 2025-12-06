import { NextRequest, NextResponse } from "next/server";
import { complete, extractJSON } from "@/lib/llm";
import { findMaterialPrice, findLaborRate, searchSimilarProducts, saveHistoricalCost } from "@/lib/db";

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

// POST /api/analyze - Run full cost analysis
export async function POST(req: NextRequest) {
  try {
    const { productDescription, action, currentState } = await req.json();

    if (action === "approve" && currentState) {
      // Generate final report
      const report = await generateReport(currentState);
      return NextResponse.json({ success: true, ...report });
    }

    if (!productDescription) {
      return NextResponse.json(
        { error: "Product description is required" },
        { status: 400 }
      );
    }

    // Step 1: Analyze product and extract components
    const components = await analyzeProduct(productDescription);

    // Step 2: Calculate material costs
    const { materialCosts, materialsTotal } = await calculateMaterialCosts(components);

    // Step 3: Calculate labor costs
    const laborCosts = await calculateLaborCosts(productDescription, components, materialsTotal);

    // Step 4: Calculate overhead
    const directCosts = materialsTotal + laborCosts.totalCost;
    const overheadPercentage = await calculateOverheadPercentage(productDescription);
    const overheadTotal = Math.round(directCosts * overheadPercentage * 100) / 100;
    const totalCost = Math.round((directCosts + overheadTotal) * 100) / 100;

    return NextResponse.json({
      success: true,
      productDescription,
      components,
      materialCosts,
      materialsTotal,
      laborCosts,
      overheadPercentage,
      overheadTotal,
      totalCost,
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

async function analyzeProduct(productDescription: string): Promise<ProductComponent[]> {
  const response = await complete(
    `You are an expert manufacturing cost analyst. Analyze the following product and break it down into its components.

Product Description: ${productDescription}

For each component, identify:
1. Component name
2. Primary material
3. Estimated quantity needed
4. Unit of measurement (e.g., board_foot, lb, piece, sq_ft, meter, etc.)

Return ONLY a JSON array of components. Each component should have:
- name: string (component name)
- material: string (primary material, use common names like "oak wood", "steel", "aluminum", etc.)
- quantity: number (estimated quantity)
- unit: string (unit of measurement)

Consider all parts including: main structure, fasteners, hardware, finishes, and any subcomponents.

Return ONLY the JSON array, no other text. Example format:
[
  {"name": "Tabletop", "material": "oak wood", "quantity": 12, "unit": "board_foot"},
  {"name": "Table Legs", "material": "oak wood", "quantity": 8, "unit": "board_foot"}
]`,
    { maxTokens: 2000 }
  );

  const components = extractJSON<ProductComponent[]>(response, "array");

  if (components) {
    return components.map((c: ProductComponent) => ({
      name: String(c.name || "Unknown"),
      material: String(c.material || "unknown").toLowerCase(),
      quantity: Number(c.quantity) || 1,
      unit: String(c.unit || "piece").toLowerCase(),
    }));
  }

  throw new Error("Failed to parse components");
}

async function calculateMaterialCosts(components: ProductComponent[]): Promise<{ materialCosts: MaterialCostItem[]; materialsTotal: number }> {
  const materialCosts: MaterialCostItem[] = [];
  const unknownMaterials: ProductComponent[] = [];

  // First pass: look up known materials
  for (const component of components) {
    const materialPrice = findMaterialPrice(component.material);

    if (materialPrice) {
      const totalCost = component.quantity * materialPrice.pricePerUnit;
      materialCosts.push({
        component: component.name,
        material: component.material,
        quantity: component.quantity,
        unit: materialPrice.unit,
        pricePerUnit: materialPrice.pricePerUnit,
        totalCost: Math.round(totalCost * 100) / 100,
      });
    } else {
      unknownMaterials.push(component);
    }
  }

  // Second pass: estimate unknown materials using AI
  if (unknownMaterials.length > 0) {
    const response = await complete(
      `As a manufacturing cost expert, estimate the price per unit for these materials. Consider current market prices in USD.

Materials to estimate:
${unknownMaterials.map(c => `- ${c.material} (${c.quantity} ${c.unit})`).join('\n')}

Return ONLY a JSON object with material names as keys and objects with pricePerUnit and unit as values.
Example: {"carbon fiber": {"pricePerUnit": 25.00, "unit": "lb"}}`,
      { maxTokens: 1000 }
    );

    const estimates = extractJSON<Record<string, { pricePerUnit: number; unit: string }>>(response, "object");

    if (estimates) {
      for (const component of unknownMaterials) {
        const estimate = estimates[component.material] || { pricePerUnit: 10.00, unit: component.unit };
        const totalCost = component.quantity * estimate.pricePerUnit;
        materialCosts.push({
          component: component.name,
          material: component.material,
          quantity: component.quantity,
          unit: estimate.unit || component.unit,
          pricePerUnit: estimate.pricePerUnit,
          totalCost: Math.round(totalCost * 100) / 100,
        });
      }
    }
  }

  const materialsTotal = materialCosts.reduce((sum, m) => sum + m.totalCost, 0);
  return { materialCosts, materialsTotal };
}

async function calculateLaborCosts(productDescription: string, components: ProductComponent[], materialsTotal: number): Promise<LaborCosts> {
  const response = await complete(
    `As a manufacturing expert, estimate the labor hours needed to produce this product.

Product: ${productDescription}

Components:
${components.map(c => `- ${c.name} (${c.material})`).join('\n')}

Total material cost: $${materialsTotal.toFixed(2)}

Estimate hours for each category and specify skill level (entry, intermediate, or expert):

Return ONLY a JSON object:
{
  "manufacturing": {"hours": 5, "skillLevel": "intermediate"},
  "assembly": {"hours": 2, "skillLevel": "entry"},
  "finishing": {"hours": 1.5, "skillLevel": "intermediate"},
  "qualityControl": {"hours": 0.5, "skillLevel": "entry"}
}`,
    { maxTokens: 1000 }
  );

  let laborEstimates = {
    manufacturing: { hours: 4, skillLevel: "intermediate" },
    assembly: { hours: 2, skillLevel: "entry" },
    finishing: { hours: 1, skillLevel: "intermediate" },
    qualityControl: { hours: 0.5, skillLevel: "entry" },
  };

  const parsed = extractJSON<typeof laborEstimates>(response, "object");
  if (parsed) {
    laborEstimates = { ...laborEstimates, ...parsed };
  }

  // Get rates from database
  const manufacturingRate = findLaborRate("machining", laborEstimates.manufacturing?.skillLevel as "entry" | "intermediate" | "expert" || "intermediate")?.hourlyRate || 45;
  const assemblyRate = findLaborRate("assembly", laborEstimates.assembly?.skillLevel as "entry" | "intermediate" | "expert" || "entry")?.hourlyRate || 25;
  const finishingRate = findLaborRate("finishing", laborEstimates.finishing?.skillLevel as "entry" | "intermediate" | "expert" || "intermediate")?.hourlyRate || 35;
  const qcRate = findLaborRate("quality_control", laborEstimates.qualityControl?.skillLevel as "entry" | "intermediate" | "expert" || "entry")?.hourlyRate || 28;

  const manufacturingCost = laborEstimates.manufacturing.hours * manufacturingRate;
  const assemblyCost = laborEstimates.assembly.hours * assemblyRate;
  const finishingCost = laborEstimates.finishing.hours * finishingRate;
  const qcCost = laborEstimates.qualityControl.hours * qcRate;
  const totalHours = laborEstimates.manufacturing.hours + laborEstimates.assembly.hours + laborEstimates.finishing.hours + laborEstimates.qualityControl.hours;

  return {
    manufacturing: Math.round(manufacturingCost * 100) / 100,
    assembly: Math.round(assemblyCost * 100) / 100,
    finishing: Math.round(finishingCost * 100) / 100,
    qualityControl: Math.round(qcCost * 100) / 100,
    totalHours: Math.round(totalHours * 100) / 100,
    totalCost: Math.round((manufacturingCost + assemblyCost + finishingCost + qcCost) * 100) / 100,
  };
}

async function calculateOverheadPercentage(productDescription: string): Promise<number> {
  const response = await complete(
    `As a manufacturing cost analyst, determine the appropriate overhead percentage for this product: "${productDescription}"

Consider: facility costs, equipment depreciation, utilities, insurance, administrative costs.
Manufacturing overhead typically ranges from 15% to 40%.

Return ONLY a JSON object: {"overheadPercentage": 0.25}`,
    { maxTokens: 200 }
  );

  const parsed = extractJSON<{ overheadPercentage: number }>(response, "object");
  if (parsed) {
    return Math.min(0.40, Math.max(0.15, parsed.overheadPercentage || 0.25));
  }
  return 0.25;
}

async function generateReport(state: {
  productDescription: string;
  components: ProductComponent[];
  materialCosts: MaterialCostItem[];
  materialsTotal: number;
  laborCosts: LaborCosts;
  overheadPercentage: number;
  overheadTotal: number;
  totalCost: number;
}) {
  const similarProducts = searchSimilarProducts(state.productDescription);

  const response = await complete(
    `Generate a professional should-cost analysis report for this product.

**Product Description:** ${state.productDescription}

**Components:**
${state.components.map(c => `- ${c.name}: ${c.quantity} ${c.unit} of ${c.material}`).join('\n')}

**Material Costs:**
${state.materialCosts.map(m => `- ${m.component} (${m.material}): ${m.quantity} ${m.unit} × $${m.pricePerUnit} = $${m.totalCost.toFixed(2)}`).join('\n')}
**Materials Subtotal: $${state.materialsTotal.toFixed(2)}**

**Labor Costs:**
- Manufacturing: $${state.laborCosts.manufacturing.toFixed(2)}
- Assembly: $${state.laborCosts.assembly.toFixed(2)}
- Finishing: $${state.laborCosts.finishing.toFixed(2)}
- Quality Control: $${state.laborCosts.qualityControl.toFixed(2)}
- Total Hours: ${state.laborCosts.totalHours}
**Labor Subtotal: $${state.laborCosts.totalCost.toFixed(2)}**

**Overhead:**
- Rate: ${(state.overheadPercentage * 100).toFixed(0)}%
- Amount: $${state.overheadTotal.toFixed(2)}

**TOTAL ESTIMATED COST: $${state.totalCost.toFixed(2)}**

${similarProducts.length > 0 ? `
**Similar Historical Products:**
${similarProducts.map(p => `- ${p.productName}: $${p.totalCost}`).join('\n')}
` : ''}

Create a detailed markdown report with:
1. Executive Summary (2-3 sentences)
2. Cost Breakdown Analysis
3. Key Cost Drivers
4. Cost Saving Opportunities (at least 3 specific suggestions)
5. Recommendations

Also return a JSON object at the end with cost-saving opportunities:
{"costSavingOpportunities": ["suggestion 1", "suggestion 2", "suggestion 3"]}`,
    { maxTokens: 2000 }
  );

  let reportText = response;
  let costSavingOpportunities: string[] = [];

  const parsed = extractJSON<{ costSavingOpportunities: string[] }>(reportText, "object");
  if (parsed?.costSavingOpportunities) {
    costSavingOpportunities = parsed.costSavingOpportunities;
    const jsonMatch = reportText.match(/\{[\s\S]*"costSavingOpportunities"[\s\S]*\}/);
    if (jsonMatch) {
      reportText = reportText.replace(jsonMatch[0], "").trim();
    }
  }

  // Save to historical costs
  try {
    saveHistoricalCost({
      productName: state.productDescription.split(/[,.]|for|with/i)[0].trim().slice(0, 100),
      productDescription: state.productDescription,
      totalCost: state.totalCost,
      breakdown: {
        materials: state.materialCosts,
        labor: state.laborCosts,
        overhead: { percentage: state.overheadPercentage, total: state.overheadTotal },
        components: state.components,
      },
    });
  } catch (e) {
    console.error("Failed to save historical cost:", e);
  }

  return {
    finalReport: reportText,
    breakdown: {
      materialsTotal: state.materialsTotal,
      laborTotal: state.laborCosts.totalCost,
      overheadTotal: state.overheadTotal,
      grandTotal: state.totalCost,
      summary: `Materials ($${state.materialsTotal.toFixed(2)}) + Labor ($${state.laborCosts.totalCost.toFixed(2)}) + Overhead ($${state.overheadTotal.toFixed(2)}) = $${state.totalCost.toFixed(2)}`,
      costSavingOpportunities,
    },
    approvalStatus: "approved",
    progress: 100,
  };
}
