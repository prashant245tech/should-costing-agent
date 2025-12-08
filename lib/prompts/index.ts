import { CostingPrompts } from "./types";
import { defaultPrompts } from "./defaults";
import { foodPrompts } from "./food";

// Registry Map
// Keys can be "category" or "category/subcategory"
const registry: Record<string, CostingPrompts> = {
    "default": defaultPrompts,
    "food": foodPrompts,
    "food_beverage": foodPrompts,
    "food___beverage": foodPrompts,
    "packaging": defaultPrompts, // TODO: Add packaging-specific prompts
    "apparel": defaultPrompts,   // TODO: Add apparel-specific prompts
    "apparel___fashion": defaultPrompts,
    "consumer_electronics": defaultPrompts, // TODO: Add electronics-specific prompts
    "electronics": defaultPrompts,
    "furniture": defaultPrompts, // TODO: Add furniture-specific prompts
    "industrial": defaultPrompts,
    "general_manufacturing": defaultPrompts,
};

/**
 * Category definitions with IDs for classification
 */
export const CATEGORY_DEFINITIONS = [
    { id: "food-beverage", name: "Food & Beverage", description: "Food products, beverages, meals" },
    { id: "apparel", name: "Apparel & Textiles", description: "Clothing, footwear, accessories" },
    { id: "consumer-electronics", name: "Consumer Electronics", description: "Electronics, gadgets, devices" },
    { id: "packaging", name: "Packaging", description: "Boxes, containers, packaging materials" },
    { id: "furniture", name: "Furniture", description: "Furniture, fixtures" },
    { id: "industrial", name: "Industrial/Manufacturing", description: "Industrial equipment, metal fabrication" },
];

/**
 * Standardized categories that the Classifier should map to.
 */
export const SUPPORTED_CATEGORIES = CATEGORY_DEFINITIONS.map(c => c.id);

/**
 * Resolve the appropriate prompts for a given category and sub-category.
 * 
 * Logic:
 * 1. Try exact match "category/subCategory" (not yet implemented fully in registry keys but planned)
 * 2. Try category match (slugified)
 * 3. Fallback to default
 */
export function getPrompts(category: string, subCategory?: string): CostingPrompts {
    const normCategory = normalizeKey(category);
    const normSubCategory = subCategory ? normalizeKey(subCategory) : "";

    // 1. Specific Subcategory (Future proofing)
    // if (subCategory && registry[`${normCategory}/${normSubCategory}`]) {
    //   return registry[`${normCategory}/${normSubCategory}`];
    // }

    // 2. Category Match
    if (registry[normCategory]) {
        return registry[normCategory];
    }

    // 3. Fallback
    console.warn(`Category '${category}' not found in registry. Using default prompts.`);
    return defaultPrompts;
}

function normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "_");
}
