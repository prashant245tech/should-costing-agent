/**
 * Prompt Registry - Hierarchical prompt resolution system
 *
 * Resolution order (most specific to least specific):
 * 1. categories/{category}/{subcategory}/prompts.ts
 * 2. categories/{category}/prompts.ts
 * 3. base/prompts.ts
 *
 * To add a new category:
 *   1. Create agent/prompts/categories/{category}/prompts.ts
 *   2. Export the prompts you want to override (analyze, materials, labor, overhead, report)
 *   3. Optionally export a config object with category-specific settings
 *
 * To add a subcategory:
 *   1. Create agent/prompts/categories/{category}/{subcategory}/prompts.ts
 *   2. Export only the prompts that differ from the parent category
 */

import {
  PromptType,
  PromptBuilder,
  PromptContext,
  CategoryConfig,
  PromptModule,
  DEFAULT_LABOR_CATEGORIES,
  DEFAULT_OVERHEAD_RANGE,
} from './types';

// Import base prompts
import * as basePrompts from './base/prompts';

// Cache for loaded category modules
const categoryCache = new Map<string, PromptModule | null>();

/**
 * Dynamically load a prompt module for a category/subcategory
 * Returns null if the module doesn't exist
 */
async function loadPromptModule(category: string, subcategory?: string): Promise<PromptModule | null> {
  const cacheKey = subcategory ? `${category}/${subcategory}` : category;

  if (categoryCache.has(cacheKey)) {
    return categoryCache.get(cacheKey) || null;
  }

  try {
    let module: PromptModule;

    if (subcategory) {
      // Try to load subcategory-specific prompts
      module = await import(`./categories/${category}/${subcategory}/prompts`);
    } else {
      // Try to load category-specific prompts
      module = await import(`./categories/${category}/prompts`);
    }

    categoryCache.set(cacheKey, module);
    return module;
  } catch {
    // Module doesn't exist - that's fine, we'll fall back
    categoryCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Get the prompt builder for a specific prompt type, with hierarchical fallback
 */
export async function getPromptBuilder(
  promptType: PromptType,
  category?: string,
  subcategory?: string
): Promise<PromptBuilder> {
  // Try subcategory first (if specified)
  if (category && subcategory) {
    const subcatModule = await loadPromptModule(category, subcategory);
    if (subcatModule?.[promptType]) {
      return subcatModule[promptType]!;
    }
  }

  // Try category next (if specified)
  if (category) {
    const catModule = await loadPromptModule(category);
    if (catModule?.[promptType]) {
      return catModule[promptType]!;
    }
  }

  // Fall back to base prompts
  const baseBuilder = basePrompts[promptType];
  if (!baseBuilder) {
    throw new Error(`No base prompt found for type: ${promptType}`);
  }

  return baseBuilder;
}

/**
 * Get the prompt string for a specific prompt type
 * This is the main entry point for nodes to get prompts
 */
export async function getPrompt(
  promptType: PromptType,
  context: PromptContext
): Promise<string> {
  const builder = await getPromptBuilder(promptType, context.category, context.subcategory);
  return builder(context);
}

/**
 * Get category configuration with fallback to defaults
 */
export async function getCategoryConfig(
  category?: string,
  subcategory?: string
): Promise<CategoryConfig> {
  const defaultConfig: CategoryConfig = {
    name: 'General Manufacturing',
    description: 'Default configuration for manufactured products',
    laborCategories: DEFAULT_LABOR_CATEGORIES,
    overheadRange: DEFAULT_OVERHEAD_RANGE,
    commonUnits: ['piece', 'lb', 'kg', 'meter', 'sq_ft', 'board_foot'],
  };

  if (!category) {
    return defaultConfig;
  }

  // Try subcategory config first
  if (subcategory) {
    const subcatModule = await loadPromptModule(category, subcategory);
    if (subcatModule?.config) {
      return { ...defaultConfig, ...subcatModule.config };
    }
  }

  // Try category config
  const catModule = await loadPromptModule(category);
  if (catModule?.config) {
    return { ...defaultConfig, ...catModule.config };
  }

  return defaultConfig;
}

/**
 * List available categories (for UI dropdown, etc.)
 * This scans the categories directory
 */
export function getAvailableCategories(): { id: string; name: string }[] {
  // For now, return a static list. In production, you could scan the filesystem
  // or maintain a manifest file
  return [
    { id: 'food-beverage', name: 'Food & Beverage' },
    { id: 'apparel', name: 'Apparel & Textiles' },
    { id: 'consumer-electronics', name: 'Consumer Electronics' },
    { id: 'packaging', name: 'Packaging' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'industrial', name: 'Industrial/Manufacturing' },
  ];
}

/**
 * Clear the prompt cache (useful for development/hot-reloading)
 */
export function clearPromptCache(): void {
  categoryCache.clear();
}
