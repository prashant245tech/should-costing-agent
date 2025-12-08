/**
 * Food & Beverage category prompts
 *
 * This category handles food products, beverages, and prepared meals.
 * Key differences from general manufacturing:
 * - Components are "ingredients" not "materials"
 * - Labor categories focus on prep, cooking, packaging
 * - Overhead includes waste/spoilage factors
 * - Units are typically g, kg, ml, l, each
 */

import { PromptBuilder, PromptContext, CategoryConfig } from '../../types';

/**
 * Category configuration for Food & Beverage
 */
export const config: CategoryConfig = {
  name: 'Food & Beverage',
  description: 'Food products, beverages, and prepared meals',
  laborCategories: [
    { id: 'prep', name: 'Ingredient Prep', description: 'Washing, cutting, measuring ingredients', defaultSkillLevel: 'entry' },
    { id: 'cooking', name: 'Cooking/Processing', description: 'Cooking, baking, mixing, blending', defaultSkillLevel: 'intermediate' },
    { id: 'assembly', name: 'Assembly', description: 'Plating, layering, combining components', defaultSkillLevel: 'entry' },
    { id: 'packaging', name: 'Packaging', description: 'Portioning, sealing, labeling', defaultSkillLevel: 'entry' },
    { id: 'qualityControl', name: 'Quality Control', description: 'Taste testing, visual inspection, food safety checks', defaultSkillLevel: 'intermediate' },
  ],
  overheadRange: {
    min: 0.25,
    max: 0.45,
    typical: 0.35, // Higher due to waste, spoilage, compliance
  },
  commonUnits: ['g', 'kg', 'ml', 'l', 'oz', 'lb', 'each', 'bunch', 'cup', 'tbsp', 'tsp'],
  metadata: {
    wasteFactorDefault: 0.15, // 15% typical ingredient waste
    shelfLifeRelevant: true,
  },
};

/**
 * Analyze food product into ingredient bill of materials
 */
export const analyze: PromptBuilder = ({ state }: PromptContext) => {
  const { productDescription } = state;

  return `You are an expert food cost analyst and recipe developer. Analyze the following food/beverage product and break it down into its ingredient bill of materials.

Product Description: ${productDescription}

For each ingredient, identify:
1. Ingredient name (standardized, e.g., "all-purpose flour" not just "flour")
2. Quantity needed per unit produced
3. Unit of measurement (g, kg, ml, l, oz, each, etc.)
4. Prep waste factor if applicable (e.g., vegetable trimming)

Consider:
- All raw ingredients (main and supporting)
- Seasonings, spices, and flavor enhancers
- Packaging materials (containers, labels, seals)
- Garnishes or toppings
- Prep waste (trimming, peeling typically 10-20% for produce)

Return ONLY a JSON array. Each item should have:
- name: string (ingredient name)
- material: string (same as name for food, or category like "packaging")
- quantity: number (amount needed)
- unit: string (g, kg, ml, each, etc.)
- wasteFactor: number (optional, e.g., 0.15 for 15% waste)

Example:
[
  {"name": "All-purpose flour", "material": "all-purpose flour", "quantity": 500, "unit": "g"},
  {"name": "Butter (unsalted)", "material": "butter", "quantity": 200, "unit": "g"},
  {"name": "Onions", "material": "onion", "quantity": 150, "unit": "g", "wasteFactor": 0.12}
]`;
};

/**
 * Estimate labor hours for food production
 */
export const labor: PromptBuilder = ({ state }: PromptContext) => {
  const { productDescription, components, materialCosts } = state;
  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;

  return `As a food production expert, estimate the labor hours needed to produce this food/beverage product.

Product: ${productDescription}

Ingredients:
${components?.map(c => `- ${c.name} (${c.quantity} ${c.unit})`).join('\n')}

Total ingredient cost: $${materialsTotal.toFixed(2)}

Estimate hours for each production stage:
1. Ingredient Prep (washing, cutting, measuring, mise en place)
2. Cooking/Processing (cooking, baking, mixing, blending)
3. Assembly (combining components, plating, layering)
4. Packaging (portioning, sealing, labeling)
5. Quality Control (taste testing, visual inspection, food safety)

Also specify the skill level needed: entry, intermediate, or expert.

Return ONLY a JSON object in this exact format:
{
  "prep": {"hours": 1, "skillLevel": "entry"},
  "cooking": {"hours": 2, "skillLevel": "intermediate"},
  "assembly": {"hours": 0.5, "skillLevel": "entry"},
  "packaging": {"hours": 0.5, "skillLevel": "entry"},
  "qualityControl": {"hours": 0.25, "skillLevel": "intermediate"}
}`;
};

/**
 * Determine overhead for food production (higher due to waste/compliance)
 */
export const overhead: PromptBuilder = ({ state }: PromptContext) => {
  const { productDescription, materialCosts, laborCosts } = state;
  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
  const laborTotal = laborCosts?.totalCost || 0;
  const directCosts = materialsTotal + laborTotal;

  return `As a food industry cost analyst, determine the appropriate overhead percentage for this food/beverage product.

Product: ${productDescription}

Direct Costs:
- Ingredients: $${materialsTotal.toFixed(2)}
- Labor: $${laborTotal.toFixed(2)}
- Total Direct: $${directCosts.toFixed(2)}

Consider food industry overhead factors:
- Facility costs (commercial kitchen rent, utilities)
- Equipment (ovens, refrigeration, mixers)
- Food safety compliance (HACCP, inspections, certifications)
- Ingredient waste and spoilage (typically 10-20%)
- Cold storage and refrigeration
- Packaging supplies and labels
- Insurance (food liability)
- Cleaning and sanitation

Food industry overhead typically ranges from 25% to 45% of direct costs.

Return ONLY a JSON object with:
{
  "overheadPercentage": 0.35,
  "reasoning": "Brief explanation including waste factor considered"
}`;
};
