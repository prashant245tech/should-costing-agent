import { CostingPrompts, ProductComponent, CostData } from "./types";

export const defaultPrompts: CostingPrompts = {
    categoryName: "General Manufacturing",

    systemRole: "You are an expert procurement cost analyst specializing in Ex-Works should-cost modeling for vendor negotiations.",

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
  "currency": "USD"
}

CRITICAL INSTRUCTIONS:
1. costPercentages MUST sum to 1.00 (100%)
2. Use INDUSTRY BENCHMARKS for labour percentage
3. components: List materials per SINGLE UNIT of product
4. estimatedUnitCost: Realistic wholesale/manufacturing cost per unit
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
