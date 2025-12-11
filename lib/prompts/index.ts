/**
 * Prompt System - Public API
 *
 * This module provides a hierarchical, category-aware prompt system for
 * Ex-Works cost analysis. Categories can override specific prompts while
 * inheriting defaults from the base prompts.
 *
 * Usage:
 *   import { getPrompts, CATEGORY_DEFINITIONS } from "@/lib/prompts";
 *
 *   const prompts = getPrompts("food-beverage");
 *   const analysis = prompts.fullAnalysisPrompt(description, categoryList);
 *
 * To add a new category:
 *   1. Create lib/prompts/categories/{category-id}/prompts.ts
 *   2. Export `prompts` object with category-specific overrides
 *   3. Optionally add config.ts for category settings
 */

// Re-export from registry (main API)
export {
  getPrompts,
  getPromptsAsync,
  getCategoryConfig,
  getAvailableCategories,
  clearPromptCache,
  preloadPrompts,
  buildCategoryListForClassification,
  CATEGORY_DEFINITIONS,
  SUPPORTED_CATEGORIES,
  DEFAULT_CATEGORY_ID,
} from "./registry";

// Re-export types
export type {
  CostingPrompts,
  CategoryConfig,
  CategoryDefinition,
  SubcategoryDefinition,
  ClassificationResult,
  LaborCategory,
  ProductComponent,
  MaterialCostItem,
  CostData,
  ExWorksCostBreakdown,
  CostPercentages,
  FullAnalysisResult,
  LaborCosts,
  LaborEstimate,
  LaborEstimates,
  ConversionBreakdown,
  LabourBreakdown,
  PackingBreakdown,
  OverheadBreakdown,
  MarginBreakdown,
  CostSubComponent,
  IndustryType,
} from "./types";

// Re-export constants
export { INDUSTRY_LABOR_BENCHMARKS } from "./types";

// Re-export base prompts for direct access if needed
export { prompts as defaultPrompts } from "./base/prompts";
