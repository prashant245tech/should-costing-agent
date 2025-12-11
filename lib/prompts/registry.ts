/**
 * Prompt Registry - Hierarchical prompt resolution system
 *
 * Resolution order (most specific to least specific):
 * 1. categories/{category}/prompts.ts
 * 2. base/prompts.ts
 *
 * To add a new category:
 *   1. Create lib/prompts/categories/{category}/prompts.ts
 *   2. Export `prompts` object implementing CostingPrompts (or partial override)
 *   3. Optionally create config.ts with CategoryConfig for category-specific settings
 *   4. Create index.ts to re-export prompts and config
 *
 * The registry will automatically merge category prompts with base prompts,
 * so you only need to override the prompts that differ from the base.
 */

import { CostingPrompts, CategoryConfig, CategoryDefinition } from "./types";
import { prompts as basePrompts } from "./base/prompts";

// Cache for loaded category modules
const promptCache = new Map<string, CostingPrompts>();
const configCache = new Map<string, CategoryConfig>();

/**
 * Normalize category key for consistent lookup
 * Converts "Food & Beverage" or "food_beverage" to "food-beverage"
 */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[&]/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Default category ID - used when no category matches
 */
export const DEFAULT_CATEGORY_ID = "default";

/**
 * Category definitions with subcategories for hierarchical classification
 */
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "food-beverage",
    name: "Food & Beverage",
    description: "Food products, beverages, meals",
    subcategories: [
      { id: "baked-goods", name: "Baked Goods", examples: "cookies, cakes, breads, pastries, muffins" },
      { id: "beverages", name: "Beverages", examples: "sodas, juices, coffee, tea, water, energy drinks" },
      { id: "snacks", name: "Snacks", examples: "chips, crackers, nuts, popcorn, pretzels" },
      { id: "dairy", name: "Dairy Products", examples: "milk, cheese, yogurt, ice cream, butter" },
      { id: "confectionery", name: "Confectionery", examples: "candy, chocolate, gum, mints" },
      { id: "prepared-meals", name: "Prepared Meals", examples: "frozen dinners, ready-to-eat, meal kits" },
      { id: "condiments", name: "Condiments & Sauces", examples: "ketchup, mustard, mayo, salad dressing" },
      { id: "canned-goods", name: "Canned & Preserved", examples: "canned vegetables, soups, jams, pickles" },
    ]
  },
  {
    id: "apparel",
    name: "Apparel & Textiles",
    description: "Clothing, footwear, accessories",
    subcategories: [
      { id: "tops", name: "Tops", examples: "t-shirts, shirts, blouses, sweaters, hoodies" },
      { id: "bottoms", name: "Bottoms", examples: "pants, jeans, shorts, skirts, leggings" },
      { id: "outerwear", name: "Outerwear", examples: "jackets, coats, vests, windbreakers" },
      { id: "footwear", name: "Footwear", examples: "shoes, sneakers, boots, sandals, slippers" },
      { id: "accessories", name: "Accessories", examples: "hats, bags, belts, scarves, gloves" },
      { id: "underwear", name: "Underwear & Basics", examples: "underwear, socks, bras, undershirts" },
      { id: "sportswear", name: "Sportswear", examples: "athletic wear, yoga pants, sports bras" },
    ]
  },
  {
    id: "consumer-electronics",
    name: "Consumer Electronics",
    description: "Electronics, gadgets, devices",
    subcategories: [
      { id: "mobile-devices", name: "Mobile Devices", examples: "smartphones, tablets, smartwatches" },
      { id: "computers", name: "Computers", examples: "laptops, desktops, monitors, keyboards" },
      { id: "audio-video", name: "Audio & Video", examples: "headphones, speakers, TVs, cameras" },
      { id: "home-appliances", name: "Small Appliances", examples: "toasters, blenders, coffee makers" },
      { id: "gaming", name: "Gaming", examples: "consoles, controllers, gaming accessories" },
      { id: "wearables", name: "Wearables", examples: "fitness trackers, smart glasses, VR headsets" },
    ]
  },
  {
    id: "packaging",
    name: "Packaging",
    description: "Boxes, containers, packaging materials",
    subcategories: [
      { id: "corrugated", name: "Corrugated Boxes", examples: "shipping boxes, cartons, mailers" },
      { id: "flexible", name: "Flexible Packaging", examples: "pouches, bags, wraps, films" },
      { id: "rigid-plastic", name: "Rigid Plastic", examples: "bottles, containers, jars, clamshells" },
      { id: "glass", name: "Glass Packaging", examples: "bottles, jars, vials" },
      { id: "metal", name: "Metal Packaging", examples: "cans, tins, aerosols, tubes" },
      { id: "labels", name: "Labels & Printing", examples: "labels, sleeves, printed materials" },
    ]
  },
  {
    id: "furniture",
    name: "Furniture",
    description: "Furniture, fixtures",
    subcategories: [
      { id: "seating", name: "Seating", examples: "chairs, sofas, stools, benches" },
      { id: "tables", name: "Tables & Desks", examples: "dining tables, desks, coffee tables" },
      { id: "storage", name: "Storage", examples: "cabinets, shelves, wardrobes, dressers" },
      { id: "bedroom", name: "Bedroom", examples: "beds, mattresses, nightstands" },
      { id: "outdoor", name: "Outdoor Furniture", examples: "patio furniture, garden benches" },
      { id: "office", name: "Office Furniture", examples: "office chairs, cubicles, filing cabinets" },
    ]
  },
  {
    id: "industrial",
    name: "Industrial/Manufacturing",
    description: "Industrial equipment, metal fabrication",
    subcategories: [
      { id: "machinery", name: "Machinery", examples: "motors, pumps, compressors, conveyors" },
      { id: "tools", name: "Tools & Hardware", examples: "hand tools, power tools, fasteners" },
      { id: "metal-parts", name: "Metal Parts", examples: "castings, forgings, machined parts" },
      { id: "plastic-parts", name: "Plastic Parts", examples: "injection molded, extruded, thermoformed" },
      { id: "electrical", name: "Electrical Components", examples: "wiring, switches, connectors, PCBs" },
      { id: "safety", name: "Safety Equipment", examples: "PPE, helmets, gloves, safety glasses" },
    ]
  },
  {
    id: "default",
    name: "General Manufacturing",
    description: "Products that don't fit other categories - use this if uncertain",
    subcategories: [
      { id: "general", name: "General", examples: "miscellaneous products, multi-category items" },
    ]
  },
];

/**
 * Supported category IDs (excludes 'default')
 */
export const SUPPORTED_CATEGORIES = CATEGORY_DEFINITIONS
  .filter(c => c.id !== DEFAULT_CATEGORY_ID)
  .map(c => c.id);

/**
 * Build a hierarchical category list string for classification prompts
 * Format:
 * - food-beverage: Food & Beverage
 *     - baked-goods: cookies, cakes, breads
 *     - beverages: sodas, juices, coffee
 * ...
 */
export function buildCategoryListForClassification(): string {
  return CATEGORY_DEFINITIONS.map(cat => {
    const subcats = cat.subcategories
      ?.map(s => `    - ${s.id}: ${s.examples}`)
      .join('\n') || '';
    return `- ${cat.id}: ${cat.name} (${cat.description})${subcats ? '\n' + subcats : ''}`;
  }).join('\n');
}

/**
 * Dynamically load prompts for a category
 * Returns merged prompts (category-specific + base fallbacks)
 */
async function loadCategoryPrompts(category: string): Promise<CostingPrompts> {
  const cacheKey = normalizeKey(category);

  // Check cache first
  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!;
  }

  try {
    // Try to dynamically import category-specific prompts
    const module = await import(`./categories/${cacheKey}/prompts`);

    // Merge with base prompts (category overrides take precedence)
    const mergedPrompts: CostingPrompts = {
      ...basePrompts,
      ...module.prompts,
    };

    promptCache.set(cacheKey, mergedPrompts);
    return mergedPrompts;
  } catch (error) {
    // Category doesn't exist or failed to load - use base prompts
    console.debug(`No category prompts found for "${category}", using base prompts`);
    promptCache.set(cacheKey, basePrompts);
    return basePrompts;
  }
}

/**
 * Dynamically load config for a category
 * Returns category config or default config
 */
async function loadCategoryConfig(category: string): Promise<CategoryConfig | null> {
  const cacheKey = normalizeKey(category);

  // Check cache first
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey) || null;
  }

  try {
    const module = await import(`./categories/${cacheKey}/config`);
    configCache.set(cacheKey, module.config);
    return module.config;
  } catch {
    // No config for this category
    configCache.set(cacheKey, null as any);
    return null;
  }
}

/**
 * Get prompts for a category (main entry point)
 *
 * @param category - Category ID (e.g., "food-beverage", "apparel")
 * @param subCategory - Optional subcategory (reserved for future use)
 * @returns CostingPrompts object with all prompt functions
 *
 * @example
 * const prompts = await getPrompts("food-beverage");
 * const analysis = prompts.fullAnalysisPrompt(description, categoryList);
 */
export async function getPromptsAsync(category: string, subCategory?: string): Promise<CostingPrompts> {
  if (!category || category === "default") {
    return basePrompts;
  }

  return loadCategoryPrompts(category);
}

/**
 * Synchronous version of getPrompts for backward compatibility
 * Uses cached prompts or returns base prompts if not cached
 *
 * Note: For new code, prefer getPromptsAsync() which supports dynamic loading
 */
export function getPrompts(category: string, subCategory?: string): CostingPrompts {
  if (!category || category === "default") {
    return basePrompts;
  }

  const cacheKey = normalizeKey(category);

  // Return cached if available
  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!;
  }

  // Trigger async load for future calls
  loadCategoryPrompts(category).catch(() => {});

  // For now, return base prompts (will be cached after async load completes)
  return basePrompts;
}

/**
 * Get category configuration
 *
 * @param category - Category ID
 * @returns CategoryConfig or null if no config exists
 */
export async function getCategoryConfig(category: string): Promise<CategoryConfig | null> {
  if (!category || category === "default") {
    return null;
  }

  return loadCategoryConfig(category);
}

/**
 * Get available categories for UI dropdowns
 */
export function getAvailableCategories(): CategoryDefinition[] {
  return CATEGORY_DEFINITIONS;
}

/**
 * Clear the prompt and config caches
 * Useful for development/hot-reloading
 */
export function clearPromptCache(): void {
  promptCache.clear();
  configCache.clear();
}

/**
 * Preload prompts for specified categories
 * Call this at app startup to warm the cache
 */
export async function preloadPrompts(categories?: string[]): Promise<void> {
  const toLoad = categories || SUPPORTED_CATEGORIES;
  await Promise.all(toLoad.map(cat => loadCategoryPrompts(cat)));
}
