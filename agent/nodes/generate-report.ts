import { complete, extractJSON } from "@/lib/llm";
import { CostingState, CostBreakdown } from "../state";
import { saveHistoricalCost, searchSimilarProducts } from "@/lib/db";
import { getPrompt } from "../prompts/registry";

export async function generateReport(state: CostingState): Promise<Partial<CostingState>> {
  const {
    productDescription,
    components,
    materialCosts,
    laborCosts,
    overheadPercentage,
    overheadTotal,
    totalCost,
    category,
    subcategory,
  } = state;

  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
  const laborTotal = laborCosts?.totalCost || 0;

  try {
    // Find similar products for comparison
    const similarProducts = await searchSimilarProducts(productDescription);

    // Get category-aware prompt
    let prompt = await getPrompt('report', {
      state,
      category,
      subcategory,
    });

    // Append similar products info if available
    if (similarProducts.length > 0) {
      prompt += `\n\n**Similar Historical Products for comparison:**\n${similarProducts.map(p => `- ${p.productName}: $${p.totalCost}`).join('\n')}`;
    }

    // Generate comprehensive report using AI
    const response = await complete(prompt, { maxTokens: 2000 });

    // Extract the report and cost-saving opportunities
    let reportText = response;
    let costSavingOpportunities: string[] = [];

    // Try to extract JSON with cost-saving opportunities
    const parsed = extractJSON<{ costSavingOpportunities: string[] }>(reportText, "object");
    if (parsed?.costSavingOpportunities) {
      costSavingOpportunities = parsed.costSavingOpportunities;
      // Remove the JSON from the report text
      const jsonMatch = reportText.match(/\{[\s\S]*"costSavingOpportunities"[\s\S]*\}/);
      if (jsonMatch) {
        reportText = reportText.replace(jsonMatch[0], "").trim();
      }
    }

    // Create the breakdown summary
    const breakdown: CostBreakdown = {
      materialsTotal,
      laborTotal,
      overheadTotal: overheadTotal || 0,
      grandTotal: totalCost || 0,
      summary: `Materials ($${materialsTotal.toFixed(2)}) + Labor ($${laborTotal.toFixed(2)}) + Overhead ($${(overheadTotal || 0).toFixed(2)}) = $${(totalCost || 0).toFixed(2)}`,
      costSavingOpportunities,
    };

    // Save to historical costs
    try {
      saveHistoricalCost({
        productName: productDescription.split(/[,.]|for|with/i)[0].trim().slice(0, 100),
        productDescription,
        totalCost: totalCost || 0,
        breakdown: {
          materials: materialCosts,
          labor: laborCosts,
          overhead: { percentage: overheadPercentage, total: overheadTotal },
          components,
        },
      });
    } catch (saveError) {
      console.error("Failed to save historical cost:", saveError);
    }

    return {
      breakdown,
      finalReport: reportText,
      currentNode: "report",
      progress: 100,
      messages: [
        {
          role: "assistant",
          content: `✅ **Should Cost Analysis Complete!**\n\n${reportText}`,
        },
      ],
    };
  } catch (error) {
    console.error("Error in generateReport:", error);
    return {
      currentNode: "report",
      error: `Failed to generate report: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
