import { complete, extractJSON } from "@/lib/llm";
import { CostingState, ProductComponent } from "../state";
import { getPrompt } from "../prompts/registry";

export async function analyzeProduct(state: CostingState): Promise<Partial<CostingState>> {
  const { productDescription, category, subcategory } = state;

  if (!productDescription) {
    return {
      currentNode: "analyze",
      error: "No product description provided",
    };
  }

  try {
    // Get category-aware prompt
    const prompt = await getPrompt('analyze', {
      state,
      category,
      subcategory,
    });

    const response = await complete(prompt, { maxTokens: 2000 });

    // Parse the JSON response
    let components: ProductComponent[];
    const parsed = extractJSON<ProductComponent[]>(response, "array");

    if (parsed) {
      components = parsed;
    } else {
      console.error("Failed to parse components:", response);
      throw new Error("Failed to parse product components from AI response");
    }

    // Validate and clean components
    components = components.map((c) => ({
      name: String(c.name || "Unknown"),
      material: String(c.material || "unknown").toLowerCase(),
      quantity: Number(c.quantity) || 1,
      unit: String(c.unit || "piece").toLowerCase(),
    }));

    return {
      components,
      currentNode: "analyze",
      progress: 20,
      messages: [
        {
          role: "assistant",
          content: `I've analyzed the product and identified ${components.length} components: ${components.map((c) => c.name).join(", ")}.`,
        },
      ],
    };
  } catch (error) {
    console.error("Error in analyzeProduct:", error);
    return {
      currentNode: "analyze",
      error: `Failed to analyze product: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
