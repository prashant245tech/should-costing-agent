import { complete, extractJSON } from "@/lib/llm";
import { CostingState } from "../state";
import { getAvailableCategories } from "../prompts/registry";

/**
 * Auto-detect product category and subcategory from the product description
 * This runs first in the workflow to determine which prompts to use
 *
 * The subcategory is a free-form suggestion - if a prompt file exists for it,
 * it will be used; otherwise falls back to the category prompt.
 */
export async function detectCategory(state: CostingState): Promise<Partial<CostingState>> {
  const { productDescription } = state;

  if (!productDescription) {
    return {
      currentNode: "detect-category",
      error: "No product description provided",
    };
  }

  // If category is already specified, skip detection
  if (state.category) {
    return {
      currentNode: "detect-category",
      progress: 5,
      messages: [
        {
          role: "assistant",
          content: `Using specified category: ${state.category}${state.subcategory ? ` / ${state.subcategory}` : ''}`,
        },
      ],
    };
  }

  try {
    const availableCategories = getAvailableCategories();
    const categoryList = availableCategories
      .map(c => `- ${c.id}: ${c.name}`)
      .join('\n');

    const response = await complete(
      `Classify this product into the most appropriate category and subcategory for cost analysis.

Product Description: ${productDescription}

Available Categories:
${categoryList}

Instructions:
1. Select the single best-matching category from the list above
2. Suggest a specific subcategory slug (lowercase, hyphenated) that best describes this product type
3. If no specific subcategory applies, set subcategory to null
4. If no category fits well, use "industrial" as the default

Subcategory examples by category:
- food-beverage: bakery, beverages, dairy, meat-seafood, snacks, prepared-meals, confectionery
- apparel: footwear, outerwear, activewear, formal-wear, accessories
- consumer-electronics: mobile-devices, audio, computing, wearables, home-appliances
- packaging: corrugated, flexible, rigid-plastic, glass, metal-cans
- furniture: seating, tables, storage, bedroom, outdoor

Return ONLY a JSON object with:
{
  "category": "category-id",
  "subcategory": "subcategory-slug-or-null",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`,
      { maxTokens: 400 }
    );

    const parsed = extractJSON<{
      category: string;
      subcategory: string | null;
      confidence: number;
      reasoning: string;
    }>(response, "object");

    if (parsed?.category) {
      // Validate the category exists
      const validCategory = availableCategories.find(c => c.id === parsed.category);

      if (validCategory) {
        // Clean up subcategory (ensure it's a valid slug or undefined)
        const subcategory = parsed.subcategory && parsed.subcategory !== 'null'
          ? parsed.subcategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          : undefined;

        const categoryLabel = subcategory
          ? `**${validCategory.name}** → **${subcategory}**`
          : `**${validCategory.name}**`;

        return {
          category: parsed.category,
          subcategory,
          currentNode: "detect-category",
          progress: 5,
          messages: [
            {
              role: "assistant",
              content: `Detected: ${categoryLabel} (${Math.round((parsed.confidence || 0.8) * 100)}% confidence). ${parsed.reasoning || ''}`,
            },
          ],
        };
      }
    }

    // Default to industrial/manufacturing if detection fails
    return {
      category: undefined,
      subcategory: undefined,
      currentNode: "detect-category",
      progress: 5,
      messages: [
        {
          role: "assistant",
          content: "Using general manufacturing analysis.",
        },
      ],
    };
  } catch (error) {
    console.error("Error in detectCategory:", error);
    // Don't fail the workflow, just proceed without category
    return {
      category: undefined,
      subcategory: undefined,
      currentNode: "detect-category",
      progress: 5,
      messages: [
        {
          role: "assistant",
          content: "Proceeding with general analysis.",
        },
      ],
    };
  }
}
