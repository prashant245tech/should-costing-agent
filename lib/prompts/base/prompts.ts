/**
 * Base/Default Prompts
 *
 * These are the fallback prompts used when no category-specific prompts exist.
 * All category prompts should extend or override these defaults.
 */

import { CostingPrompts, ProductComponent, CostData } from "../types";

export const prompts: CostingPrompts = {
  categoryName: "General Manufacturing",

  systemRole: "You are an expert procurement cost analyst specializing in Ex-Works should-cost modeling for vendor negotiations.",

  /**
   * Lightweight classification prompt - identifies product category only
   * Used as first step before detailed analysis
   */
  classifyPrompt: (productDescription: string, categoryList: string) => `
You are a product classification expert. Your task is to classify a product into the most appropriate category and subcategory.

Product to classify: "${productDescription}"

Available Categories and Subcategories:
${categoryList}

INSTRUCTIONS:
1. Analyze the product description carefully
2. Choose the MOST SPECIFIC category and subcategory that matches
3. If the product doesn't clearly fit any category, use "default" as the category
4. Provide a confidence score (0.0 to 1.0) based on how well the product matches

Return ONLY a JSON object in this exact format (no other text):
{
  "category": "food-beverage",
  "subCategory": "baked-goods",
  "confidence": 0.95,
  "reasoning": "Cookies are baked goods in the food & beverage category"
}

IMPORTANT:
- Use exact category IDs from the list (e.g., "food-beverage", not "Food & Beverage")
- Use exact subcategory IDs from the list (e.g., "baked-goods", not "Baked Goods")
- If uncertain, use category "default" with subCategory "general"
- Keep reasoning brief (one sentence)`,

  fullAnalysisPrompt: (productDescription: string, categoryList: string, aum?: number) => `
You are an expert procurement cost analyst. Create an Ex-Works should-cost model for vendor negotiations.

Product: "${productDescription}"
${aum ? `Annual Unit Movement (AUM): ${aum.toLocaleString()} units/year` : 'AUM: Estimate a reasonable annual production volume'}

Available Categories:
${categoryList}

INDUSTRY LABOR BENCHMARKS (as % of total Ex-Works cost):
- Food & Beverage: 5-12% (highly automated)
- Apparel & Textiles: 20-40% (labor intensive)
- Consumer Electronics: 8-15% (SMT assembly automated)
- Packaging: 8-12% (high-speed lines)
- Furniture: 15-25% (mix of manual/automated)
- Industrial/Manufacturing: 10-20%

Return a SINGLE JSON object with this EXACT structure:

{
  "category": "food-beverage",
  "subCategory": "baked-goods",
  "confidence": 0.90,
  "reasoning": "Brief explanation",

  "analysisContext": "A comprehensive 2-3 sentence summary describing: key raw materials, manufacturing process overview, packaging type, food-safety/quality considerations, typical unit size, and shelf life expectations.",

  "aum": 1000000,
  "aumReasoning": "Standard annual volume for this product type",

  "components": [
    {"name": "Flour", "material": "wheat flour", "quantity": 0.030, "unit": "kg"},
    {"name": "Sugar", "material": "granulated sugar", "quantity": 0.015, "unit": "kg"}
  ],

  "costPercentages": {
    "rawMaterial": 0.45,
    "conversion": 0.15,
    "labour": 0.08,
    "packing": 0.10,
    "overhead": 0.12,
    "margin": 0.10
  },

  "estimatedUnitCost": 0.15,
  "currency": "USD",

  "conversionDetails": {
    "total": 0.15,
    "subComponents": {
      "equipmentDepreciation": {"name": "Equipment Depreciation", "cost": 0.05, "percentage": 0.33, "description": "Ovens and mixers"},
      "utilities": {"name": "Utilities", "cost": 0.05, "percentage": 0.33, "description": "Gas and electricity"},
      "maintenance": {"name": "Maintenance", "cost": 0.05, "percentage": 0.33}
    },
    "negotiationPoints": ["Ask for energy efficiency logs", "Review maintenance contracts"]
  },

  "labourDetails": {
    "total": 0.08,
    "laborRate": 25.0,
    "unitsPerLaborHour": 300,
    "subComponents": {
        "directLabor": {"name": "Direct Labor", "cost": 0.05, "percentage": 0.62, "description": "Line operators"},
        "supervision": {"name": "Supervision", "cost": 0.02, "percentage": 0.25},
        "qualityInspection": {"name": "QC", "cost": 0.01, "percentage": 0.13}
    },
    "negotiationPoints": ["Compare shift differentials", "Discuss automation roadmap"]
  },

  "packingDetails": {
    "total": 0.10,
    "subComponents": {
        "primaryPackaging": {"name": "Primary Film", "cost": 0.06, "percentage": 0.60},
        "secondaryPackaging": {"name": "Carton", "cost": 0.03, "percentage": 0.30},
        "labels": {"name": "Labels", "cost": 0.01, "percentage": 0.10}
    },
    "negotiationPoints": ["Vendor managed inventory for packaging", "Volume discounts on film"]
  },

  "overheadDetails": {
    "total": 0.12,
    "subComponents": {
        "facilityAllocation": {"name": "Facility", "cost": 0.06, "percentage": 0.50},
        "admin": {"name": "Admin", "cost": 0.04, "percentage": 0.33},
        "insurance": {"name": "Insurance", "cost": 0.02, "percentage": 0.17}
    },
    "negotiationPoints": ["Request allocation methodology audit"]
  },

  "marginAnalysis": {
    "total": 0.10,
    "percentage": 0.10,
    "reasoning": "Standard industry margin for high-volume food production",
    "negotiationRange": {"min": 0.08, "max": 0.12}
  }
}

CRITICAL INSTRUCTIONS:
1. costPercentages MUST sum to 1.00 (100%)
2. Use INDUSTRY BENCHMARKS for labour percentage
3. components: List materials per SINGLE UNIT of product
4. PROVIDE DETAILED BREAKDOWNS for conversion, labour, packing, overhead with sub-components and negotiation points
5. estimatedUnitCost: Realistic wholesale/manufacturing cost per unit
5. AUM affects conversion costs (higher volume = lower per-unit conversion)

Return ONLY the JSON object, no other text.`,

  materialPrompt: (unknownMaterials: ProductComponent[]) => `
As a procurement cost analyst, estimate wholesale material prices for industrial quantities.

Materials to price:
${unknownMaterials.map((c) => `- "${c.name}" (${c.material}): ${c.quantity} ${c.unit} per unit`).join("\n")}

Return ONLY a JSON object with material names as keys:
{"Flour": {"pricePerUnit": 0.50, "unit": "kg"}, "Sugar": {"pricePerUnit": 0.80, "unit": "kg"}}

Use realistic WHOLESALE/BULK prices, not retail.`,

  reportPrompt: (data: CostData, similarProducts: any[]) => `
Generate a professional Ex-Works Should-Cost Analysis for procurement negotiations.

**Product:** ${data.productDescription}
${data.aum ? `**Annual Volume:** ${data.aum.toLocaleString()} units` : ''}

**Bill of Materials (per unit):**
${data.components.map((c) => `- ${c.name}: ${c.quantity} ${c.unit} (${c.material})`).join("\n")}

**Material Costs:**
${data.materialCosts.map((m) => `- ${m.component}: $${m.totalCost.toFixed(4)}/unit`).join("\n")}

${data.exWorksCostBreakdown ? `
**Ex-Works Cost Breakdown (per unit):**
| Component | Cost | % |
|-----------|------|---|
| Raw Material | $${data.exWorksCostBreakdown.rawMaterial.toFixed(4)} | ${((data.exWorksCostBreakdown.rawMaterial / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Conversion | $${data.exWorksCostBreakdown.conversion.toFixed(4)} | ${((data.exWorksCostBreakdown.conversion / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Labour | $${data.exWorksCostBreakdown.labour.toFixed(4)} | ${((data.exWorksCostBreakdown.labour / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Packing | $${data.exWorksCostBreakdown.packing.toFixed(4)} | ${((data.exWorksCostBreakdown.packing / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Overhead | $${data.exWorksCostBreakdown.overhead.toFixed(4)} | ${((data.exWorksCostBreakdown.overhead / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Margin | $${data.exWorksCostBreakdown.margin.toFixed(4)} | ${((data.exWorksCostBreakdown.margin / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| **TOTAL EX-WORKS** | **$${data.exWorksCostBreakdown.totalExWorks.toFixed(4)}** | **100%** |
` : `**Total Cost:** $${data.totalCost.toFixed(2)}`}

${similarProducts.length > 0 ? `
**Similar Historical Products:**
${similarProducts.map((p) => `- ${p.productName}: $${p.totalCost}`).join("\n")}
` : ''}

Create a procurement-focused markdown report with:
1. Executive Summary (target price recommendation)
2. Cost Breakdown Analysis
3. Key Cost Drivers
4. Negotiation Leverage Points (where supplier has margin to negotiate)
5. Volume-Based Pricing Recommendations

Also return a JSON object at the end:
{"costSavingOpportunities": ["suggestion 1", "suggestion 2", "suggestion 3"], "targetPrice": 0.12, "negotiationRange": {"min": 0.10, "max": 0.15}}`,
};

// Re-export for backward compatibility
export const defaultPrompts = prompts;
