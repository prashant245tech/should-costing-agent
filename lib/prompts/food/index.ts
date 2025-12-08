import { CostingPrompts, ProductComponent, CostData } from "../types";

export const foodPrompts: CostingPrompts = {
    categoryName: "Food & Beverage",

    systemRole: "You are an expert food industry procurement analyst specializing in recipe costing and Ex-Works pricing for CPG/FMCG products.",

    fullAnalysisPrompt: (productDescription: string, categoryList: string, aum?: number) => `
You are an expert food industry cost analyst. Create an Ex-Works should-cost model for food product procurement.

Product: "${productDescription}"
${aum ? `Annual Unit Movement (AUM): ${aum.toLocaleString()} units/year` : 'AUM: Estimate reasonable annual production volume for this product type'}

Available Categories:
${categoryList}

FOOD INDUSTRY COST BENCHMARKS:
- Labour: 5-12% of Ex-Works (highly automated production lines)
- Raw Materials: 40-60% (ingredients are major cost driver)
- Conversion: 10-15% (mixing, baking, forming, cooling equipment)
- Packing: 8-15% (primary packaging often significant)
- Overhead: 8-12% (quality control, food safety compliance)
- Margin: 8-15% (typical manufacturer margin)

Return a SINGLE JSON object:

{
  "category": "food-beverage",
  "subCategory": "cookies",
  "confidence": 0.95,
  "reasoning": "Baked goods with standard cookie production process",
  
  "aum": 50000000,
  "aumReasoning": "Major brand cookie - high volume production",
  
  "components": [
    {"name": "Wheat Flour", "material": "flour", "quantity": 0.008, "unit": "kg"},
    {"name": "Sugar", "material": "sugar", "quantity": 0.004, "unit": "kg"},
    {"name": "Vegetable Oil", "material": "oil", "quantity": 0.003, "unit": "kg"},
    {"name": "Cocoa Powder", "material": "cocoa", "quantity": 0.002, "unit": "kg"}
  ],
  
  "costPercentages": {
    "rawMaterial": 0.45,
    "conversion": 0.12,
    "labour": 0.08,
    "packing": 0.12,
    "overhead": 0.10,
    "margin": 0.13
  },
  
  "estimatedUnitCost": 0.08,
  "currency": "USD"
}

CRITICAL FOR FOOD PRODUCTS:
1. components: Ingredients per SINGLE UNIT (e.g., per cookie, not per package)
2. Include ALL ingredients (flour, sugar, fats, leavening, flavorings, etc.)
3. Labour should be 5-12% (food production is highly automated)
4. costPercentages MUST sum to 1.00
5. estimatedUnitCost: Factory cost per single unit

Return ONLY the JSON object.`,

    materialPrompt: (unknownMaterials: ProductComponent[]) => `
As a food industry cost analyst, estimate WHOLESALE commodity prices.

Ingredients to price:
${unknownMaterials.map((c) => `- "${c.name}" (${c.material}): ${c.quantity} ${c.unit} per unit`).join("\n")}

WHOLESALE FOOD INGREDIENT BENCHMARKS:
- Wheat Flour: $0.40-0.60/kg
- Sugar: $0.50-0.80/kg  
- Vegetable Oil: $1.00-1.50/kg
- Cocoa Powder: $3.00-5.00/kg
- Butter: $4.00-6.00/kg
- Eggs: $2.00-3.00/kg (liquid)
- Milk Powder: $3.00-4.00/kg

Return JSON with ingredient names as keys:
{"Wheat Flour": {"pricePerUnit": 0.50, "unit": "kg"}}`,

    reportPrompt: (data: CostData, similarProducts: any[]) => `
Generate a Food Industry Ex-Works Should-Cost Analysis.

**Product:** ${data.productDescription}
${data.aum ? `**Annual Volume:** ${data.aum.toLocaleString()} units` : ''}

**Recipe (per unit):**
${data.components.map((c) => `- ${c.name}: ${c.quantity} ${c.unit}`).join("\n")}

**Ingredient Costs:**
${data.materialCosts.map((m) => `- ${m.component}: $${m.totalCost.toFixed(4)}/unit`).join("\n")}

${data.exWorksCostBreakdown ? `
**Ex-Works Cost Structure:**
| Component | $/Unit | % |
|-----------|--------|---|
| Raw Material | $${data.exWorksCostBreakdown.rawMaterial.toFixed(4)} | ${((data.exWorksCostBreakdown.rawMaterial / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Conversion | $${data.exWorksCostBreakdown.conversion.toFixed(4)} | ${((data.exWorksCostBreakdown.conversion / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Labour | $${data.exWorksCostBreakdown.labour.toFixed(4)} | ${((data.exWorksCostBreakdown.labour / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Packing | $${data.exWorksCostBreakdown.packing.toFixed(4)} | ${((data.exWorksCostBreakdown.packing / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Overhead | $${data.exWorksCostBreakdown.overhead.toFixed(4)} | ${((data.exWorksCostBreakdown.overhead / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Margin | $${data.exWorksCostBreakdown.margin.toFixed(4)} | ${((data.exWorksCostBreakdown.margin / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| **TOTAL** | **$${data.exWorksCostBreakdown.totalExWorks.toFixed(4)}** | **100%** |
` : ''}

Create a food industry procurement report with:
1. Executive Summary with target price
2. Recipe Cost Analysis
3. Key Cost Drivers (commodity exposure)
4. Negotiation Points (ingredient substitutions, volume discounts)
5. Make vs Buy considerations

Return JSON: {"costSavingOpportunities": [...], "targetPrice": 0.08}`,
};
