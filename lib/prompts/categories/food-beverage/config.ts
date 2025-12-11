/**
 * Food & Beverage Category Configuration
 *
 * Industry-specific settings for food product cost analysis
 */

import { CategoryConfig } from "../../types";

export const config: CategoryConfig = {
  id: "food-beverage",
  name: "Food & Beverage",
  description: "Food products, beverages, meals, and ingredients",

  // Food-specific labor categories
  laborCategories: [
    { id: "prep", name: "Preparation", description: "Ingredient prep, mixing, batching", defaultSkillLevel: "entry" },
    { id: "cooking", name: "Cooking/Processing", description: "Baking, frying, cooking operations", defaultSkillLevel: "intermediate" },
    { id: "assembly", name: "Assembly", description: "Product assembly, filling, forming", defaultSkillLevel: "entry" },
    { id: "packaging", name: "Packaging", description: "Packing, sealing, labeling", defaultSkillLevel: "entry" },
    { id: "qualityControl", name: "Quality Control", description: "Inspection, sampling, testing", defaultSkillLevel: "intermediate" },
  ],

  // Food industry typically has higher overhead due to compliance
  overheadRange: {
    min: 0.08,
    max: 0.15,
    typical: 0.10,
  },

  // Food-specific units
  commonUnits: ["g", "kg", "ml", "l", "oz", "lb", "each", "bunch", "cup", "tbsp", "tsp"],

  // Industry benchmarks
  industryBenchmarks: {
    laborPercentage: { min: 0.05, max: 0.12, typical: 0.08 },
    rawMaterialPercentage: { min: 0.40, max: 0.60, typical: 0.45 },
    marginPercentage: { min: 0.08, max: 0.15, typical: 0.12 },
  },

  // Food-specific metadata
  metadata: {
    requiresFoodSafety: true,
    typicalCertifications: ["HACCP", "FDA", "SQF", "BRC"],
    shelfLifeConsiderations: true,
    seasonalityFactors: true,
  },
};
