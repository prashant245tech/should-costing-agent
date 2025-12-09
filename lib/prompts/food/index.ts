import { CostingPrompts, ProductComponent, CostData } from "../types";

export const foodPrompts: CostingPrompts = {
    categoryName: "Food & Beverage",

    systemRole: "You are an expert food industry procurement analyst specializing in recipe costing and Ex-Works pricing for CPG/FMCG products.",

    fullAnalysisPrompt: (productDescription: string, categoryList: string, aum?: number) => `
You are an expert food industry cost analyst. Create a DETAILED Ex-Works should-cost model for procurement negotiations.

Product: "${productDescription}"
${aum ? `Annual Unit Movement (AUM): ${aum.toLocaleString()} units/year` : 'AUM: Estimate reasonable annual production volume for this product type'}

Available Categories:
${categoryList}

FOOD INDUSTRY COST BENCHMARKS:
- Raw Materials: 40-60% (ingredients are major cost driver)
- Conversion: 10-15% (mixing, baking, forming, cooling equipment)
- Labour: 5-12% (highly automated production lines)
- Packing: 8-15% (primary packaging often significant)
- Overhead: 8-12% (quality control, food safety compliance)
- Margin: 8-15% (varies by brand strength, volume, competition)

CONVERSION SUB-COMPONENT BENCHMARKS (Food Industry):
- Equipment Depreciation: 35-45% of conversion (mixers, ovens, coolers, conveyors)
- Utilities: 25-35% (electricity for ovens, gas, refrigeration, water)
- Maintenance: 15-20% (preventive maintenance, spare parts)
- Process Consumables: 5-15% (molds, baking trays, processing aids)

LABOUR SUB-COMPONENT BENCHMARKS (Food Industry):
- Direct Labor: 50-60% of labour (line operators, machine operators)
- Supervision: 15-20% (shift supervisors, line leads)
- Quality Inspection: 15-20% (in-line QC, sampling)
- Material Handling: 10-15% (ingredient staging, finished goods)

PACKING SUB-COMPONENT BENCHMARKS (Food Industry):
- Primary Packaging: 40-50% of packing (wrappers, trays, films)
- Secondary Packaging: 25-35% (boxes, cartons, sleeves)
- Tertiary Packaging: 10-15% (shipping cases, pallets)
- Labels & Printing: 10-15% (product labels, batch coding, date marking)

OVERHEAD SUB-COMPONENT BENCHMARKS (Food Industry):
- Facility Allocation: 30-40% of overhead (rent, utilities, insurance)
- Quality Assurance: 25-35% (lab testing, food safety systems, HACCP)
- Administration: 20-25% (HR, finance, IT allocation)
- Regulatory Compliance: 10-20% (FDA, certifications, audits)

MARGIN ANALYSIS FACTORS:
- Industry Average: 8-15% for food manufacturing
- Brand Strength: Strong brands (Oreo, Coca-Cola) command higher margins
- Competitive Position: Commodity products have lower margins
- Volume Impact: High volume = lower margin per unit, better total return
- Relationship: Strategic partners may accept lower margins for volume guarantees

Return a SINGLE JSON object with DETAILED breakdowns:

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

  "conversionDetails": {
    "total": 0.0096,
    "subComponents": {
      "equipmentDepreciation": {"name": "Equipment Depreciation", "cost": 0.0038, "percentage": 0.40, "description": "High-speed baking line depreciation"},
      "utilities": {"name": "Utilities", "cost": 0.0029, "percentage": 0.30, "description": "Oven energy, refrigeration for cream"},
      "maintenance": {"name": "Maintenance", "cost": 0.0019, "percentage": 0.20, "description": "Preventive maintenance program"},
      "processConsumables": {"name": "Process Consumables", "cost": 0.0010, "percentage": 0.10, "description": "Baking trays, release agents"}
    },
    "description": "Automated baking and cream sandwich assembly line",
    "negotiationPoints": ["Equipment utilization rates", "Energy efficiency programs", "Maintenance contracts"]
  },

  "labourDetails": {
    "total": 0.0064,
    "subComponents": {
      "directLabor": {"name": "Direct Labor", "cost": 0.0035, "percentage": 0.55, "description": "Line operators at $18/hr"},
      "supervision": {"name": "Supervision", "cost": 0.0013, "percentage": 0.20, "description": "Shift supervisors"},
      "qualityInspection": {"name": "Quality Inspection", "cost": 0.0010, "percentage": 0.15, "description": "In-line QC sampling"},
      "materialHandling": {"name": "Material Handling", "cost": 0.0006, "percentage": 0.10, "description": "Ingredient staging"}
    },
    "laborRate": 18,
    "unitsPerLaborHour": 5000,
    "automationLevel": "high",
    "description": "Highly automated with minimal manual intervention",
    "negotiationPoints": ["Automation investments", "Productivity improvements", "Shift efficiency"]
  },

  "packingDetails": {
    "total": 0.0096,
    "subComponents": {
      "primaryPackaging": {"name": "Primary Packaging", "cost": 0.0043, "percentage": 0.45, "description": "Individual cookie tray and film wrap"},
      "secondaryPackaging": {"name": "Secondary Packaging", "cost": 0.0029, "percentage": 0.30, "description": "Printed retail carton"},
      "tertiaryPackaging": {"name": "Tertiary Packaging", "cost": 0.0014, "percentage": 0.15, "description": "Corrugated shipping case"},
      "labelsAndPrinting": {"name": "Labels & Printing", "cost": 0.0010, "percentage": 0.10, "description": "Batch coding, date marking"}
    },
    "description": "Standard retail packaging with tamper-evident seal",
    "negotiationPoints": ["Packaging material alternatives", "Print run consolidation", "Supplier rebates"]
  },

  "overheadDetails": {
    "total": 0.0080,
    "subComponents": {
      "facilityAllocation": {"name": "Facility Allocation", "cost": 0.0028, "percentage": 0.35, "description": "Manufacturing facility costs"},
      "qualityAssurance": {"name": "Quality Assurance", "cost": 0.0024, "percentage": 0.30, "description": "Food safety lab, HACCP system"},
      "administration": {"name": "Administration", "cost": 0.0016, "percentage": 0.20, "description": "G&A allocation"},
      "regulatoryCompliance": {"name": "Regulatory Compliance", "cost": 0.0012, "percentage": 0.15, "description": "FDA compliance, certifications"}
    },
    "overheadRate": 0.22,
    "description": "Standard food manufacturing overhead structure",
    "negotiationPoints": ["Multi-product facility allocation", "Certification cost sharing"]
  },

  "marginAnalysis": {
    "total": 0.0104,
    "percentage": 0.13,
    "factors": {
      "industryAverage": 0.12,
      "brandStrength": "strong",
      "competitivePosition": "differentiated",
      "volumeImpact": "high-volume-discount",
      "relationshipTier": "strategic-partner"
    },
    "reasoning": "Oreo is a dominant brand with strong market position. Despite high volumes reducing per-unit margin, the brand strength and differentiated product justify 13% margin. As strategic partner with guaranteed volumes, slight premium over industry average (12%) is acceptable.",
    "negotiationRange": {"min": 0.10, "max": 0.15}
  },

  "estimatedUnitCost": 0.08,
  "currency": "USD"
}

CRITICAL FOR FOOD PRODUCTS:
1. components: Ingredients per SINGLE UNIT (e.g., per cookie, not per package)
2. Include ALL ingredients (flour, sugar, fats, leavening, flavorings, etc.)
3. Labour should be 5-12% (food production is highly automated)
4. costPercentages MUST sum to 1.00
5. All *Details sub-components percentages should sum to 1.00 within their category
6. Detailed costs should align with costPercentages (e.g., conversionDetails.total = estimatedUnitCost * costPercentages.conversion)
7. marginAnalysis.reasoning MUST explain the margin based on brand strength, competition, and volume
8. Include negotiationPoints for each category - these help procurement teams

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
