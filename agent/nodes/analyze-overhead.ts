import { complete, extractJSON } from "@/lib/llm";
import { CostingState } from "../state";
import { getPrompt, getCategoryConfig } from "../prompts/registry";

export async function analyzeOverhead(state: CostingState): Promise<Partial<CostingState>> {
  const { materialCosts, laborCosts, category, subcategory } = state;

  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
  const laborTotal = laborCosts?.totalCost || 0;
  const directCosts = materialsTotal + laborTotal;

  if (directCosts === 0) {
    return {
      currentNode: "overhead",
      error: "No direct costs to calculate overhead from",
    };
  }

  try {
    // Get category-aware prompt and config
    const prompt = await getPrompt('overhead', {
      state,
      category,
      subcategory,
    });
    const categoryConfig = await getCategoryConfig(category, subcategory);

    const response = await complete(prompt, { maxTokens: 500 });

    let overheadData: { overheadPercentage: number; reasoning: string };
    const parsed = extractJSON<{ overheadPercentage: number; reasoning: string }>(response, "object");

    if (parsed) {
      overheadData = parsed;
    } else {
      // Default to 25% overhead
      overheadData = {
        overheadPercentage: 0.25,
        reasoning: "Standard manufacturing overhead rate applied",
      };
    }

    // Ensure overhead is within reasonable bounds based on category config
    const { min, max } = categoryConfig.overheadRange || { min: 0.15, max: 0.40 };
    const overheadPercentage = Math.min(max, Math.max(min, overheadData.overheadPercentage));
    const overheadTotal = Math.round(directCosts * overheadPercentage * 100) / 100;
    const totalCost = Math.round((directCosts + overheadTotal) * 100) / 100;

    return {
      overheadPercentage,
      overheadTotal,
      totalCost,
      currentNode: "overhead",
      progress: 80,
      approvalStatus: "pending",
      messages: [
        {
          role: "assistant",
          content: `Overhead calculated at ${(overheadPercentage * 100).toFixed(0)}% ($${overheadTotal.toFixed(2)}). ${overheadData.reasoning}\n\n**Total Estimated Cost: $${totalCost.toFixed(2)}**\n\nPlease review and approve the cost estimate to generate the final report.`,
        },
      ],
    };
  } catch (error) {
    console.error("Error in analyzeOverhead:", error);
    return {
      currentNode: "overhead",
      error: `Failed to analyze overhead: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
