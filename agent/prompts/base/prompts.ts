/**
 * Base prompts - Default prompts for general manufacturing products
 * These are used as fallback when no category-specific prompt exists
 */

import { PromptBuilder, PromptContext, CategoryConfig, DEFAULT_LABOR_CATEGORIES, DEFAULT_OVERHEAD_RANGE } from '../types';

/**
 * Base configuration for general manufacturing
 */
export const config: CategoryConfig = {
  name: 'General Manufacturing',
  description: 'Default configuration for manufactured products',
  laborCategories: DEFAULT_LABOR_CATEGORIES,
  overheadRange: DEFAULT_OVERHEAD_RANGE,
  commonUnits: ['piece', 'lb', 'kg', 'meter', 'sq_ft', 'board_foot', 'gallon'],
};

/**
 * Analyze product and break down into components
 */
export const analyze: PromptBuilder = ({ state }: PromptContext) => {
  const { productDescription } = state;

  return `You are an expert manufacturing cost analyst. Analyze the following product and break it down into its components.

Product Description: ${productDescription}

For each component, identify:
1. Component name
2. Primary material
3. Estimated quantity needed
4. Unit of measurement (e.g., board_foot, lb, piece, sq_ft, meter, etc.)

Return your analysis as a JSON array of components. Each component should have:
- name: string (component name)
- material: string (primary material, use common names like "oak wood", "steel", "aluminum", etc.)
- quantity: number (estimated quantity)
- unit: string (unit of measurement)

Consider all parts including: main structure, fasteners, hardware, finishes, and any subcomponents.

Return ONLY the JSON array, no other text. Example format:
[
  {"name": "Tabletop", "material": "oak wood", "quantity": 12, "unit": "board_foot"},
  {"name": "Table Legs", "material": "oak wood", "quantity": 8, "unit": "board_foot"}
]`;
};

/**
 * Estimate material prices for unknown materials
 */
export const materials: PromptBuilder = ({ state }: PromptContext) => {
  const unknownComponents = state.components?.filter(c => {
    // This will be passed in context when we know which materials are unknown
    return true; // For now, include all
  }) || [];

  return `As a manufacturing cost expert, estimate the price per unit for these materials. Consider current market prices in USD.

Materials to estimate:
${unknownComponents.map(c => `- ${c.material} (${c.quantity} ${c.unit})`).join('\n')}

Return ONLY a JSON object with material names as keys and objects with pricePerUnit and unit as values.
Example: {"carbon fiber": {"pricePerUnit": 25.00, "unit": "lb"}}`;
};

/**
 * Estimate labor hours by category
 */
export const labor: PromptBuilder = ({ state }: PromptContext) => {
  const { productDescription, components, materialCosts } = state;
  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;

  return `As a manufacturing expert, estimate the labor hours needed to produce this product.

Product: ${productDescription}

Components:
${components?.map(c => `- ${c.name} (${c.material})`).join('\n')}

Total material cost: $${materialsTotal.toFixed(2)}

Estimate hours for each category:
1. Manufacturing (cutting, shaping, forming materials)
2. Assembly (putting components together)
3. Finishing (painting, staining, polishing)
4. Quality Control (inspection, testing)

Also specify the skill level needed for each: entry, intermediate, or expert.

Return ONLY a JSON object in this exact format:
{
  "manufacturing": {"hours": 5, "skillLevel": "intermediate"},
  "assembly": {"hours": 2, "skillLevel": "entry"},
  "finishing": {"hours": 1.5, "skillLevel": "intermediate"},
  "qualityControl": {"hours": 0.5, "skillLevel": "entry"}
}`;
};

/**
 * Determine overhead percentage
 */
export const overhead: PromptBuilder = ({ state }: PromptContext) => {
  const { productDescription, materialCosts, laborCosts } = state;
  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
  const laborTotal = laborCosts?.totalCost || 0;
  const directCosts = materialsTotal + laborTotal;

  return `As a manufacturing cost analyst, determine the appropriate overhead percentage for this product.

Product: ${productDescription}

Direct Costs:
- Materials: $${materialsTotal.toFixed(2)}
- Labor: $${laborTotal.toFixed(2)}
- Total Direct: $${directCosts.toFixed(2)}

Consider overhead factors like:
- Facility costs (rent, utilities)
- Equipment depreciation
- Administrative costs
- Insurance
- Packaging and shipping preparation
- Tooling and maintenance

Manufacturing overhead typically ranges from 15% to 40% of direct costs.

Return ONLY a JSON object with:
{
  "overheadPercentage": 0.25,
  "reasoning": "Brief explanation of the percentage chosen"
}`;
};

/**
 * Generate final report
 */
export const report: PromptBuilder = ({ state }: PromptContext) => {
  const {
    productDescription,
    components,
    materialCosts,
    laborCosts,
    overheadPercentage,
    overheadTotal,
    totalCost,
  } = state;

  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
  const laborTotal = laborCosts?.totalCost || 0;

  return `Generate a professional should-cost analysis report for this product.

**Product Description:** ${productDescription}

**Components:**
${components?.map(c => `- ${c.name}: ${c.quantity} ${c.unit} of ${c.material}`).join('\n')}

**Material Costs:**
${materialCosts?.map(m => `- ${m.component} (${m.material}): ${m.quantity} ${m.unit} × $${m.pricePerUnit} = $${m.totalCost.toFixed(2)}`).join('\n')}
**Materials Subtotal: $${materialsTotal.toFixed(2)}**

**Labor Costs:**
- Manufacturing: $${laborCosts?.manufacturing.toFixed(2)}
- Assembly: $${laborCosts?.assembly.toFixed(2)}
- Finishing: $${laborCosts?.finishing.toFixed(2)}
- Quality Control: $${laborCosts?.qualityControl.toFixed(2)}
- Total Hours: ${laborCosts?.totalHours}
**Labor Subtotal: $${laborTotal.toFixed(2)}**

**Overhead:**
- Rate: ${((overheadPercentage || 0) * 100).toFixed(0)}%
- Amount: $${overheadTotal?.toFixed(2)}

**TOTAL ESTIMATED COST: $${totalCost?.toFixed(2)}**

Create a detailed markdown report with:
1. Executive Summary (2-3 sentences)
2. Cost Breakdown Analysis
3. Key Cost Drivers
4. Cost Saving Opportunities (at least 3 specific suggestions)
5. Recommendations

Also return a JSON object at the end with cost-saving opportunities as an array:
{"costSavingOpportunities": ["suggestion 1", "suggestion 2", "suggestion 3"]}`;
};
