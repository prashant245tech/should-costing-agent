import { complete, extractJSON } from "@/lib/llm";
import { CostingState } from "../state";

export async function analyzeOverhead(state: CostingState): Promise<Partial<CostingState>> {
  const { productDescription, materialCosts, laborCosts } = state;

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
    // Use AI to determine appropriate overhead percentage
    const response = await complete(
      `As a manufacturing cost analyst, determine the appropriate overhead percentage for this product.

Product: ${productDescription}

Direct Costs:
- Materials: $${materialsTotal.toFixed(2)}
- Labor: $${laborTotal.toFixed(2)}
- Total Direct: $${directCosts.toFixed(2)}

Consider overhead factors like:
- Facility costs (rent, utilities)
- Equipment depreciation
- Administrative costs
- Insurance
- Packaging and shipping preparation
- Tooling and maintenance

Manufacturing overhead typically ranges from 15% to 40% of direct costs.

Return ONLY a JSON object with:
{
  "overheadPercentage": 0.25,
  "reasoning": "Brief explanation of the percentage chosen"
}`,
      { maxTokens: 500 }
    );

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

    // Ensure overhead is within reasonable bounds (15-40%)
    const overheadPercentage = Math.min(0.40, Math.max(0.15, overheadData.overheadPercentage));
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
