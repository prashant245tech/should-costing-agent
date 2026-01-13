/**
 * Consumer Electronics Category Prompts
 *
 * Specialized prompts for electronics cost analysis including:
 * - BOM (Bill of Materials) analysis (IC, PCB, Passive, Mechanical)
 * - SMT (Surface Mount Technology) conversion costs
 * - Manual Assembly & Testing (ICT, FCT)
 * - Tooling & NRE amortization
 */

import { CostingPrompts, ProductComponent, CostData } from "../../types";

export const prompts: CostingPrompts = {
  categoryName: "Consumer Electronics",

  systemRole: "You are an expert electronics sourcing manager and cost engineer for High-Volume Consumer Electronics manufacturing (EMS/ODM), specializing in Ex-Works costing for Fortune 500 brands.",

  fullAnalysisPrompt: (productDescription: string, categoryList: string, aum?: number) => `
You are an expert electronics cost analyst. Create a DETAILED Ex-Works should-cost model for procurement negotiations.

Product: "${productDescription}"
${aum ? `Annual Unit Movement (AUM): ${aum.toLocaleString()} units/year` : 'AUM: Estimate reasonable annual production volume for this product type'}

Available Categories:
${categoryList}

INSTRUCTIONS for SUB-SECTOR SELECTION:
Identify the specific sub-sector of the product and apply the corresponding benchmarks below.

--- SECTOR 1: HANDHELD & WEARABLES (Smartphones, Watches, Earbuds) ---
- Raw Materials (BOM): 70-85% (High density interconnects, premium displays, miniaturized components)
- Conversion: 5-8% (Highly automated SMT, automated box build)
- Labour: 2-5% (Minimal manual touchpoints)
- Overhead: 5-10% (Expensive high-precision equipment depreciation)
- Key Drivers: Process technology (nm), miniaturization, display technology.

--- SECTOR 2: HOME APPLIANCES (Toasters, Blenders, Coffee Machines) ---
- Raw Materials (BOM): 55-65% (Motors, heating elements, injection molded plastics, stamped metal)
- Conversion: 12-18% (Injection molding, metal stamping, powder coating)
- Labour: 10-15% (Manual assembly lines, higher screw counts)
- Overhead: 8-12% (Larger facility footprint, warehousing)
- Key Drivers: Motor cost, material weight (steel/plastic prices), assembly time.

--- SECTOR 3: AUDIO/VIDEO & IOT (Speakers, Cameras, Smart Home) ---
- Raw Materials (BOM): 65-75% (Chipsets, sensors, optics, acoustics)
- Conversion: 8-12% (SMT, final assembly, specialized testing)
- Labour: 5-10% (Box build, testing)
- Overhead: 6-10% (Testing equipment, clean room for optics)
- Key Drivers: Chipset pricing, acoustic/optical component quality.

GENERAL CONVERSION BENCHMARKS (Electronics):
- SMT Placement: $0.0015 - $0.0025 per point
- Manual Assembly: $0.03 - $0.06 per minute (China/Vietnam)
- Testing (ICT/FCT): $0.10 - $0.50 per unit depending on test time

OVERHEAD & MARGIN GUIDELINES:
- EMS Margin (Tier 1): 5-8%
- ODM Margin (White label): 10-15%
- Overhead Rate: 15-25% of Value Add (Labour + Conversion)

Return a SINGLE JSON object that strictly adheres to this TypeScript interface:
62: 
63: \`\`\`typescript
64: interface DetailedAnalysisResult {
65:   category: "consumer-electronics";
66:   subCategory: string;
67:   confidence: number;
68:   reasoning: string;
69:   analysisContext: string;
70:   aum: number;
71:   aumReasoning: string;
72:   components: Array<{ name: string; material: string; quantity: number; unit: string }>;
73:   costPercentages: { rawMaterial: number; conversion: number; labour: number; packing: number; overhead: number; margin: number };
74:   
75:   // Sub-component breakdowns DO NOT contain "description" or "negotiationPoints" inside subComponents map
76:   conversionDetails: {
\`\`\`typescript
interface DetailedAnalysisResult {
  category: "consumer-electronics";
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
  "category": "consumer-electronics",
  "subCategory": "audio-video",
  "confidence": 0.95,
  "reasoning": "Bluetooth speaker identified as Audio/Video sector",

  "analysisContext": "Sector: Audio/Video. Key components: Qualcomm QCC3034 Bluetooth SoC, 2x5W Class-D amplifier, 3000mAh Li-ion battery. Housing: ABS/PC blend. Assembly: 23 screws, manual box build. Testing: Bluetooth pairing, audio frequency sweep.",

  "aum": 500000,
  "aumReasoning": "Successful consumer audio product volume for mid-tier brand",

  "components": [
    {"name": "Bluetooth Audio SoC", "material": "semiconductor-ic", "quantity": 1, "unit": "pc"},
    {"name": "Class-D Amplifier IC", "material": "semiconductor-ic", "quantity": 1, "unit": "pc"},
    {"name": "Li-ion Battery 3000mAh", "material": "battery-pack", "quantity": 1, "unit": "pc"},
    {"name": "Speaker Driver 5W", "material": "electromechanical", "quantity": 2, "unit": "pc"},
    {"name": "Main PCBA (Populated)", "material": "pcba-assembly", "quantity": 1, "unit": "pc"},
    {"name": "ABS Housing Set", "material": "plastic-injection", "quantity": 0.085, "unit": "kg"},
    {"name": "USB-C Connector", "material": "connector", "quantity": 1, "unit": "pc"},
    {"name": "Passive Components Kit", "material": "electronics-passive", "quantity": 1, "unit": "set"}
  ],

  "costPercentages": {
    "rawMaterial": 0.72,
    "conversion": 0.08,
    "labour": 0.05,
    "packing": 0.04,
    "overhead": 0.05,
    "margin": 0.06
  },

  "conversionDetails": {
    "total": 1.20,
    "subComponents": {
      "equipmentDepreciation": {"name": "Equipment Depreciation", "cost": 0.48, "percentage": 0.40, "description": "SMT line, reflow oven, AOI machine"},
      "utilities": {"name": "Utilities", "cost": 0.30, "percentage": 0.25, "description": "Electricity, nitrogen, compressed air"},
      "maintenance": {"name": "Maintenance", "cost": 0.24, "percentage": 0.20, "description": "SMT line maintenance, calibration"},
      "processConsumables": {"name": "Process Consumables", "cost": 0.18, "percentage": 0.15, "description": "Solder paste, stencils, test fixtures"}
    },
    "description": "SMT assembly + manual box build with screw fastening",
    "negotiationPoints": ["Reduce screw count with snap-fit design", "Consolidate SMT panels", "Parallel test stations"]
  },

  "labourDetails": {
    "total": 0.75,
    "subComponents": {
      "directLabor": {"name": "Direct Labor", "cost": 0.41, "percentage": 0.55, "description": "Box build operators", "laborRate": 4.50},
      "supervision": {"name": "Supervision", "cost": 0.08, "percentage": 0.10, "description": "Line leads and shift supervisors", "laborRate": 8.00},
      "qualityInspection": {"name": "Quality Inspection", "cost": 0.19, "percentage": 0.25, "description": "ICT/FCT operators, QC technicians", "laborRate": 5.50},
      "materialHandling": {"name": "Material Handling", "cost": 0.07, "percentage": 0.10, "description": "Kitting, staging, warehouse", "laborRate": 4.00}
    },
    "laborRate": 4.50,
    "unitsPerLaborHour": 6,
    "automationLevel": "medium",
    "description": "Semi-automated SMT with manual final assembly",
    "negotiationPoints": ["Increase automation for screw insertion", "Reduce test cycle time", "Optimize line balancing"]
  },

  "packingDetails": {
    "total": 0.60,
    "subComponents": {
      "primaryPackaging": {"name": "Primary Packaging", "cost": 0.27, "percentage": 0.45, "description": "Retail box with foam insert"},
      "secondaryPackaging": {"name": "Secondary Packaging", "cost": 0.18, "percentage": 0.30, "description": "USB-C cable, quick start guide"},
      "tertiaryPackaging": {"name": "Tertiary Packaging", "cost": 0.09, "percentage": 0.15, "description": "Master carton, 6 units"},
      "labelsAndPrinting": {"name": "Labels & Printing", "cost": 0.06, "percentage": 0.10, "description": "Serial label, warranty card, regulatory marks"}
    },
    "description": "Retail-ready premium packaging",
    "negotiationPoints": ["Remove included cable (sold separately)", "Simplify box structure", "Increase units per master carton"]
  },

  "overheadDetails": {
    "total": 0.75,
    "subComponents": {
      "facilityAllocation": {"name": "Facility Allocation", "cost": 0.23, "percentage": 0.30, "description": "Factory rent, ESD flooring, utilities"},
      "qualityAssurance": {"name": "Quality Assurance", "cost": 0.19, "percentage": 0.25, "description": "QA lab, reliability testing, certifications"},
      "administration": {"name": "Administration", "cost": 0.15, "percentage": 0.20, "description": "HR, finance, IT, management"},
      "regulatoryCompliance": {"name": "Regulatory Compliance", "cost": 0.18, "percentage": 0.25, "description": "FCC/CE testing, NPI engineering support"}
    },
    "overheadRate": 0.15,
    "description": "Tier 2 EMS factory overhead structure",
    "negotiationPoints": ["Share NRE costs across models", "Amortize tooling over higher volumes", "Consolidate certifications"]
  },

  "marginAnalysis": {
    "total": 0.90,
    "percentage": 0.06,
    "factors": {
      "industryAverage": 0.07,
      "brandStrength": "medium",
      "competitivePosition": "differentiated",
      "volumeImpact": "high-volume-discount",
      "relationshipTier": "strategic-partner"
    },
    "reasoning": "Standard EMS margin for consumer electronics. Mid-tier brand with good volumes (500K units) justifies 6% margin. Higher volumes and strategic relationship provide capacity priority. Differentiated product (not commodity) allows slightly above minimum EMS margins.",
    "negotiationRange": {"min": 0.04, "max": 0.08}
  },

  "estimatedUnitCost": 15.00,
  "currency": "USD"
}

CRITICAL FOR ELECTRONICS COMPLIANCE:
1. analysisContext: Explicitly state the SECTOR (Handheld, Appliance, Audio) and key technical specs (Chipset, PCB, Housing)
2. Follow the specific benchmark table for the identified SECTOR.
3. Raw Material (BOM) is typically 55-85% depending on the sector.
4. Labour is higher for Appliances (10-15%) than Handhelds (2-5%).
5. costPercentages MUST sum to 1.00
6. marginAnalysis.reasoning: Reference the EMS vs ODM business model.

Return ONLY the JSON object.`,

  materialPrompt: (unknownMaterials: ProductComponent[]) => `
As an electronics procurement expert, estimate WHOLESALE component prices for industrial quantities.

Components to price:
${unknownMaterials.map((c) => `- "${c.name}" (${c.material}): ${c.quantity} ${c.unit} per unit`).join("\n")}

ELECTRONICS COMPONENT PRICE BENCHMARKS:
- Bluetooth Audio SoC (Qualcomm QCC): $2.00-4.00/pc
- WiFi SoC (ESP32 class): $1.50-3.00/pc
- Class-D Amplifier IC: $0.30-1.00/pc
- Li-ion Battery (per 1000mAh): $0.80-1.20/pc
- 4-Layer PCB (bare): $0.03-0.06/sq cm
- PCBA Assembly (per 100 placements): $1.00-2.00/board
- ABS Plastic (injection molded): $2.50-4.00/kg
- AC Motor (Small appliance): $3.00-8.00/pc
- Heating Element: $1.50-3.00/pc
- Speaker Driver (5W): $0.80-1.50/pc
- USB-C Connector: $0.15-0.35/pc
- LCD Display (2" TFT): $2.00-4.00/pc
- Passive Components Kit (50 pcs): $0.30-0.60/set

Return JSON with component names as keys:
{"Bluetooth Audio SoC": {"pricePerUnit": 2.50, "unit": "pc"}}`,

  reportPrompt: (data: CostData, similarProducts: any[]) => `
Generate a professional Consumer Electronics Ex-Works Should-Cost Analysis for procurement negotiations.

**Product:** ${data.productDescription}
${data.aum ? `**Annual Volume:** ${data.aum.toLocaleString()} units` : ''}

**Bill of Materials (per unit):**
${data.components.map((c) => `- ${c.name}: ${c.quantity} ${c.unit} (${c.material})`).join("\n")}

**Component Costs:**
${data.materialCosts.map((m) => `- ${m.component}: $${m.totalCost.toFixed(4)}/unit`).join("\n")}

${data.exWorksCostBreakdown ? `
**Ex-Works Cost Breakdown (per unit):**
| Component | Cost | % |
|-----------|------|---|
| BOM (Materials) | $${data.exWorksCostBreakdown.rawMaterial.toFixed(4)} | ${((data.exWorksCostBreakdown.rawMaterial / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
| Manufacturing | $${data.exWorksCostBreakdown.conversion.toFixed(4)} | ${((data.exWorksCostBreakdown.conversion / data.exWorksCostBreakdown.totalExWorks) * 100).toFixed(1)}% |
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
1. Executive Summary (target price recommendation and SECTOR identification)
2. BOM Analysis (electronic vs mechanical cost split, critical components)
3. Manufacturing Cost Analysis (SMT efficiency, assembly complexity)
4. Key Cost Drivers (semiconductor pricing, tooling amortization)
5. Negotiation Leverage Points (alternative sourcing, design optimization)
6. Supply Chain Risk Assessment (single-source components, lead times)
7. NRE Considerations (tooling, certification costs)

Also return a JSON object at the end:
{"costSavingOpportunities": ["alternative component sourcing", "reduce screw count", "consolidate PCB panels"], "targetPrice": ${data.exWorksCostBreakdown ? (data.exWorksCostBreakdown.totalExWorks * 0.95).toFixed(2) : '14.50'}, "negotiationRange": {"min": ${data.exWorksCostBreakdown ? (data.exWorksCostBreakdown.totalExWorks * 0.90).toFixed(2) : '13.50'}, "max": ${data.exWorksCostBreakdown ? data.exWorksCostBreakdown.totalExWorks.toFixed(2) : '15.00'}}}`,
};
