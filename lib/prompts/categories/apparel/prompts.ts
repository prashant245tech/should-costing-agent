/**
 * Apparel & Textiles Category Prompts
 *
 * Specialized prompts for garment cost analysis including:
 * - CMT (Cut, Make, Trim) costing
 * - Fabric consumption & yield efficiency
 * - SMV (Standard Minute Value) labor calculations
 * - Social compliance overhead
 */

import { CostingPrompts, ProductComponent, CostData } from "../../types";

export const prompts: CostingPrompts = {
  categoryName: "Apparel & Textiles",

  systemRole: "You are an expert textile and garment cost engineer specializing in CMT (Cut, Make, Trim) pricing, fabric consumption analysis, and Ex-Works costing for Fortune 500 apparel brands.",

  fullAnalysisPrompt: (productDescription: string, categoryList: string, aum?: number) => `
You are an expert apparel cost analyst. Create a DETAILED Ex-Works should-cost model for procurement negotiations.

Product: "${productDescription}"
${aum ? `Annual Unit Movement (AUM): ${aum.toLocaleString()} units/year` : 'AUM: Estimate reasonable annual production volume for this product type'}

Available Categories:
${categoryList}

APPAREL INDUSTRY COST BENCHMARKS:
- Raw Materials: 50-65% (fabric/trims are the major cost driver)
- Conversion: 8-15% (cutting, sewing equipment, finishing machinery)
- Labour: 10-25% (highly labor-intensive, varies by complexity and country)
- Packing: 2-5% (polybags, hangtags, retail-ready packaging)
- Overhead: 5-10% (factory overhead, social compliance, certifications)
- Margin: 5-15% (varies by brand strength, volume, relationship tier)

CONVERSION SUB-COMPONENT BENCHMARKS (Apparel):
- Equipment Depreciation: 30-40% of conversion (auto-cutters, sewing machines, pressing equipment)
- Utilities: 20-30% (electricity for machines, steam for pressing, compressed air)
- Maintenance: 15-25% (machine servicing, spare parts, technician labor)
- Process Consumables: 15-25% (cutting markers, needles, bobbins, pressing aids)

LABOUR SUB-COMPONENT BENCHMARKS (Apparel):
- Direct Labor: 55-70% of labour (sewing operators, cutting operators)
- Supervision: 10-15% (line supervisors, production managers)
- Quality Inspection: 10-20% (inline QC, end-of-line inspection, AQL audits)
- Material Handling: 5-15% (cut part bundling, WIP movement, finished goods)

PACKING SUB-COMPONENT BENCHMARKS (Apparel):
- Primary Packaging: 35-45% of packing (polybags, tissue, size stickers)
- Secondary Packaging: 25-35% (hangtags, care labels, price tickets)
- Tertiary Packaging: 15-25% (master cartons, inner cartons)
- Labels & Printing: 10-15% (main labels, care labels, size labels, printed hangtags)

OVERHEAD SUB-COMPONENT BENCHMARKS (Apparel):
- Facility Allocation: 30-40% of overhead (rent, utilities, depreciation)
- Quality Assurance: 15-25% (QA department, testing, certifications like OEKO-TEX)
- Administration: 15-25% (HR, finance, IT, management allocation)
- Regulatory Compliance: 15-25% (social audits BSCI/SEDEX, fire safety, labor compliance)

MARGIN ANALYSIS FACTORS:
- Industry Average: 5-12% for apparel manufacturing
- Brand Strength: Premium brands (Nike, Adidas) may accept higher factory margins for reliability
- Competitive Position: Basics have lower margins, fashion/technical garments higher
- Volume Impact: Higher volumes = better line efficiency = lower cost but higher capacity commitment
- Relationship: Strategic partners get priority capacity and better terms

Return a SINGLE JSON object that strictly adheres to this TypeScript interface:
67: 
68: \`\`\`typescript
69: interface DetailedAnalysisResult {
70:   category: "apparel";
71:   subCategory: string;
72:   confidence: number;
73:   reasoning: string;
74:   analysisContext: string;
75:   aum: number;
76:   aumReasoning: string;
77:   components: Array<{ name: string; material: string; quantity: number; unit: string }>;
78:   costPercentages: { rawMaterial: number; conversion: number; labour: number; packing: number; overhead: number; margin: number };
79:   
80:   // Sub-component breakdowns DO NOT contain "description" or "negotiationPoints" inside subComponents map
81:   conversionDetails: {
\`\`\`typescript
interface DetailedAnalysisResult {
  category: "apparel";
  subCategory: string;
  confidence: number;
  reasoning: string;
  analysisContext: string;
  aum: number;
  aumReasoning: string;
  components: Array<{ name: string; material: string; quantity: number; unit: string }>;
  costPercentages: { rawMaterial: number; conversion: number; labour: number; packing: number; overhead: number; margin: number };
  
  // Sub-component breakdowns DO NOT contain "description" or "negotiationPoints" inside subComponents map
  conversionDetails: {
    total: number;
    subComponents: Record<string, { name: string; cost: number; percentage: number; description: string }>;
    description: string;       // SIBLING to subComponents
    negotiationPoints: string[]; // SIBLING to subComponents
  };
  labourDetails: {
    total: number;
    subComponents: Record<string, { name: string; cost: number; percentage: number; description: string; laborRate?: number }>;
    laborRate: number;
    unitsPerLaborHour: number;
    automationLevel: string;
    description: string;
    negotiationPoints: string[];
  };
  packingDetails: {
    total: number;
    subComponents: Record<string, { name: string; cost: number; percentage: number; description: string }>;
    description: string;
    negotiationPoints: string[];
  };
  overheadDetails: {
    total: number;
    subComponents: Record<string, { name: string; cost: number; percentage: number; description: string }>;
    overheadRate: number;
    description: string;
    negotiationPoints: string[];
  };
  marginAnalysis: {
    total: number;
    percentage: number;
    factors: Record<string, any>;
    reasoning: string;
    negotiationRange: { min: number; max: number };
  };
  estimatedUnitCost: number;
  currency: string;
}
\`\`\`

Example Output:

{
  "category": "apparel",
  "subCategory": "tops",
  "confidence": 0.95,
  "reasoning": "Athletic performance t-shirt with technical fabric",

  "analysisContext": "Key materials: 150gsm polyester/elastane performance jersey, ribbed collar, reflective print. Manufacturing: automatic spreading/cutting, 14-operation sewing sequence, moisture-wicking finish. Packaging: individual polybag with hangtag. Compliance: OEKO-TEX certified, BSCI compliant factory. Typical unit: Size M adult.",

  "aum": 500000,
  "aumReasoning": "Major athletic brand seasonal order volume",

  "components": [
    {"name": "Performance Jersey Fabric", "material": "polyester-elastane", "quantity": 0.22, "unit": "kg"},
    {"name": "Ribbed Collar", "material": "polyester-rib", "quantity": 0.015, "unit": "kg"},
    {"name": "Sewing Thread", "material": "polyester-thread", "quantity": 150, "unit": "meter"},
    {"name": "Main Label", "material": "woven-label", "quantity": 1, "unit": "pc"},
    {"name": "Care Label", "material": "printed-label", "quantity": 1, "unit": "pc"},
    {"name": "Size Label", "material": "woven-label", "quantity": 1, "unit": "pc"}
  ],

  "costPercentages": {
    "rawMaterial": 0.52,
    "conversion": 0.12,
    "labour": 0.18,
    "packing": 0.04,
    "overhead": 0.06,
    "margin": 0.08
  },

  "conversionDetails": {
    "total": 0.72,
    "subComponents": {
      "equipmentDepreciation": {"name": "Equipment Depreciation", "cost": 0.25, "percentage": 0.35, "description": "Auto-cutter, lockstitch, overlock, coverstitch machines"},
      "utilities": {"name": "Utilities", "cost": 0.18, "percentage": 0.25, "description": "Electricity for sewing floor, steam for pressing"},
      "maintenance": {"name": "Maintenance", "cost": 0.15, "percentage": 0.21, "description": "Machine servicing, needle replacement, technician labor"},
      "processConsumables": {"name": "Process Consumables", "cost": 0.14, "percentage": 0.19, "description": "Cutting markers, pattern paper, pressing cloths"}
    },
    "description": "Standard CMT (Cut-Make-Trim) process with 14, sewing operations",
    "negotiationPoints": ["Line efficiency improvement targets", "Multi-style loading to reduce changeover", "Capacity pre-booking discounts"]
  },

  "labourDetails": {
    "total": 1.08,
    "subComponents": {
      "directLabor": {"name": "Direct Labor", "cost": 0.70, "percentage": 0.65, "description": "Sewing operators at SMV-based rates", "laborRate": 2.50},
      "supervision": {"name": "Supervision", "cost": 0.13, "percentage": 0.12, "description": "Line supervisors, IE engineers", "laborRate": 4.50},
      "qualityInspection": {"name": "Quality Inspection", "cost": 0.16, "percentage": 0.15, "description": "Inline QC, end-line 100% check", "laborRate": 3.00},
      "materialHandling": {"name": "Material Handling", "cost": 0.09, "percentage": 0.08, "description": "Cut part bundling, WIP movement", "laborRate": 2.00}
    },
    "laborRate": 2.50,
    "unitsPerLaborHour": 5,
    "automationLevel": "low",
    "description": "Labor-intensive garment assembly with manual sewing operations",
    "negotiationPoints": ["Learning curve benefits for repeat orders", "Off-peak capacity utilization", "Skill level optimization"]
  },

  "packingDetails": {
    "total": 0.24,
    "subComponents": {
      "primaryPackaging": {"name": "Primary Packaging", "cost": 0.10, "percentage": 0.42, "description": "Self-seal polybag with suffocation warning"},
      "secondaryPackaging": {"name": "Secondary Packaging", "cost": 0.07, "percentage": 0.29, "description": "Retail hangtag with barcode"},
      "tertiaryPackaging": {"name": "Tertiary Packaging", "cost": 0.04, "percentage": 0.17, "description": "5-ply export carton, 24 units/carton"},
      "labelsAndPrinting": {"name": "Labels & Printing", "cost": 0.03, "percentage": 0.12, "description": "Main label, care label, size label"}
    },
    "description": "Retail-ready individual packing",
    "negotiationPoints": ["Bulk packing for e-commerce", "Local sourcing of hangtags", "Carton size optimization"]
  },

  "overheadDetails": {
    "total": 0.36,
    "subComponents": {
      "facilityAllocation": {"name": "Facility Allocation", "cost": 0.13, "percentage": 0.36, "description": "Factory rent, utilities, depreciation"},
      "qualityAssurance": {"name": "Quality Assurance", "cost": 0.08, "percentage": 0.22, "description": "QA department, lab testing, OEKO-TEX certification"},
      "administration": {"name": "Administration", "cost": 0.07, "percentage": 0.20, "description": "HR, finance, IT, management"},
      "regulatoryCompliance": {"name": "Regulatory Compliance", "cost": 0.08, "percentage": 0.22, "description": "BSCI/SEDEX audits, fire safety, labor compliance"}
    },
    "overheadRate": 0.18,
    "description": "Compliant export factory with social certifications",
    "negotiationPoints": ["Multi-brand allocation of compliance costs", "Volume-based overhead absorption", "Capacity commitment discounts"]
  },

  "marginAnalysis": {
    "total": 0.48,
    "percentage": 0.08,
    "factors": {
      "industryAverage": 0.08,
      "brandStrength": "strong",
      "competitivePosition": "differentiated",
      "volumeImpact": "high-volume-discount",
      "relationshipTier": "strategic-partner"
    },
    "reasoning": "Nike is a premium athletic brand with strong supplier relationships. The performance fabric and technical construction justify higher factory margins (8%) vs basics (5%). High volume commitment and strategic partnership status provide reliability premium.",
    "negotiationRange": {"min": 0.05, "max": 0.12}
  },

  "estimatedUnitCost": 6.00,
  "currency": "USD"
}

CRITICAL FOR APPAREL PRODUCTS:
1. analysisContext: Provide comprehensive summary with fabric GSM/composition, construction details, finishing method, packaging, compliance certifications, and standard size reference
2. components: Materials per SINGLE GARMENT (fabric in kg based on consumption + waste, trims, labels)
3. Include ALL materials (fabric, collars/cuffs, thread, labels, trims, closures like buttons/zippers)
4. Labour should be 10-25% (apparel is labor-intensive, varies by garment complexity)
5. costPercentages MUST sum to 1.00
6. All *Details sub-components percentages should sum to 1.00 within their category
7. Detailed costs should align with costPercentages (e.g., labourDetails.total = estimatedUnitCost * costPercentages.labour)
8. marginAnalysis.reasoning MUST explain the margin based on brand strength, garment complexity, and volume
9. Include negotiationPoints for each category - these help procurement teams

Return ONLY the JSON object.`,

  materialPrompt: (unknownMaterials: ProductComponent[]) => `
As an apparel industry cost analyst, estimate WHOLESALE textile/trim prices.

Materials to price:
${unknownMaterials.map((c) => `- "${c.name}" (${c.material}): ${c.quantity} ${c.unit} per unit`).join("\n")}

WHOLESALE TEXTILE/TRIM BENCHMARKS:
- Cotton Jersey (solid dyed): $5.00-7.00/kg
- Cotton Jersey (printed): $7.00-10.00/kg
- Polyester Performance: $6.00-9.00/kg
- Polyester/Elastane Blend: $8.00-12.00/kg
- Denim Fabric: $2.50-5.00/meter
- Rib Fabric: $6.00-8.00/kg
- Sewing Thread: $0.008-0.012/meter
- Woven Main Labels: $0.03-0.08/pc
- Printed Care Labels: $0.01-0.03/pc
- Hangtags: $0.05-0.15/pc
- Buttons: $0.02-0.10/pc
- Zippers: $0.15-0.50/pc
- Elastic: $0.10-0.30/meter

Return JSON with material names as keys:
{"Performance Jersey Fabric": {"pricePerUnit": 8.00, "unit": "kg"}}`,

  reportPrompt: (data: CostData, similarProducts: any[]) => `
Generate a professional Apparel Ex-Works Should-Cost Analysis for procurement negotiations.

**Product:** ${data.productDescription}
${data.aum ? `**Annual Volume:** ${data.aum.toLocaleString()} units` : ''}

**Bill of Materials (per garment):**
${data.components.map((c) => `- ${c.name}: ${c.quantity} ${c.unit} (${c.material})`).join("\n")}

**Material Costs:**
${data.materialCosts.map((m) => `- ${m.component}: $${m.totalCost.toFixed(4)}/unit`).join("\n")}

${data.exWorksCostBreakdown ? `
**Ex-Works Cost Breakdown (per unit):**
| Component | Cost | % |
|-----------|------|---|
| Fabric & Trims | $${data.exWorksCostBreakdown.rawMaterial.toFixed(4)} | ${((data.exWorksCostBreakdown.rawMaterial / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| CMT - Conversion | $${data.exWorksCostBreakdown.conversion.toFixed(4)} | ${((data.exWorksCostBreakdown.conversion / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| CMT - Labour | $${data.exWorksCostBreakdown.labour.toFixed(4)} | ${((data.exWorksCostBreakdown.labour / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Packing | $${data.exWorksCostBreakdown.packing.toFixed(4)} | ${((data.exWorksCostBreakdown.packing / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Factory Overhead | $${data.exWorksCostBreakdown.overhead.toFixed(4)} | ${((data.exWorksCostBreakdown.overhead / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Margin | $${data.exWorksCostBreakdown.margin.toFixed(4)} | ${((data.exWorksCostBreakdown.margin / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| **TOTAL EX-WORKS/FOB** | **$${data.exWorksCostBreakdown.totalExWorks.toFixed(4)}** | **100%** |
` : `**Total Cost:** $${data.totalCost.toFixed(2)}`}

${similarProducts.length > 0 ? `
**Similar Historical Orders:**
${similarProducts.map((p) => `- ${p.productName}: $${p.totalCost}`).join("\n")}
` : ''}

Create a procurement-focused markdown report with:
1. Executive Summary (target FOB price recommendation)
2. Fabric & Trim Analysis (consumption efficiency, yield opportunities)
3. CMT Cost Analysis (SMV optimization, line efficiency)
4. Key Cost Drivers (fabric type, construction complexity, finishing)
5. Negotiation Leverage Points (volume commitments, capacity booking, fabric booking)
6. Country of Origin Considerations (labor cost index, lead time, compliance)

Also return a JSON object at the end:
{"costSavingOpportunities": ["fabric substitution", "SMV reduction", "trim consolidation"], "targetPrice": ${data.exWorksCostBreakdown ? (data.exWorksCostBreakdown.totalExWorks * 0.95).toFixed(2) : '5.50'}, "negotiationRange": {"min": ${data.exWorksCostBreakdown ? (data.exWorksCostBreakdown.totalExWorks * 0.90).toFixed(2) : '5.00'}, "max": ${data.exWorksCostBreakdown ? data.exWorksCostBreakdown.totalExWorks.toFixed(2) : '6.00'}}}`,
};
