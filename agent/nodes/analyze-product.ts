import { complete, extractJSON } from "@/lib/llm";
import { CostingState, ProductComponent } from "../state";

export async function analyzeProduct(state: CostingState): Promise<Partial<CostingState>> {
  const { productDescription } = state;

  if (!productDescription) {
    return {
      currentNode: "analyze",
      error: "No product description provided",
    };
  }

  try {
    const response = await complete(
      `You are an expert manufacturing cost analyst. Analyze the following product and break it down into its components.

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
]`,
      { maxTokens: 2000 }
    );

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
