import { complete, extractJSON } from "@/lib/llm";
import { CostingState, CostBreakdown } from "../state";
import { saveHistoricalCost, searchSimilarProducts } from "@/lib/db";

export async function generateReport(state: CostingState): Promise<Partial<CostingState>> {
  const {
    productDescription,
    components,
    materialCosts,
    laborCosts,
    overheadPercentage,
    overheadTotal,
    totalCost,
  } = state;

  const materialsTotal = materialCosts?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
  const laborTotal = laborCosts?.totalCost || 0;

  try {
    // Find similar products for comparison
    const similarProducts = searchSimilarProducts(productDescription);

    // Generate comprehensive report using AI
    const response = await complete(
      `Generate a professional should-cost analysis report for this product.

**Product Description:** ${productDescription}

**Components:**
${components?.map(c => `- ${c.name}: ${c.quantity} ${c.unit} of ${c.material}`).join('\n')}

**Material Costs:**
${materialCosts?.map(m => `- ${m.component} (${m.material}): ${m.quantity} ${m.unit} × $${m.pricePerUnit} = $${m.totalCost.toFixed(2)}`).join('\n')}
**Materials Subtotal: $${materialsTotal.toFixed(2)}**

**Labor Costs:**
- Manufacturing: $${laborCosts?.manufacturing.toFixed(2)}
- Assembly: $${laborCosts?.assembly.toFixed(2)}
- Finishing: $${laborCosts?.finishing.toFixed(2)}
- Quality Control: $${laborCosts?.qualityControl.toFixed(2)}
- Total Hours: ${laborCosts?.totalHours}
**Labor Subtotal: $${laborTotal.toFixed(2)}**

**Overhead:**
- Rate: ${(overheadPercentage * 100).toFixed(0)}%
- Amount: $${overheadTotal?.toFixed(2)}

**TOTAL ESTIMATED COST: $${totalCost?.toFixed(2)}**

${similarProducts.length > 0 ? `
**Similar Historical Products:**
${similarProducts.map(p => `- ${p.productName}: $${p.totalCost}`).join('\n')}
` : ''}

Create a detailed markdown report with:
1. Executive Summary (2-3 sentences)
2. Cost Breakdown Analysis
3. Key Cost Drivers
4. Cost Saving Opportunities (at least 3 specific suggestions)
5. Market Comparison (if similar products exist)
6. Recommendations

Also return a JSON object at the end with cost-saving opportunities as an array:
{"costSavingOpportunities": ["suggestion 1", "suggestion 2", "suggestion 3"]}`,
      { maxTokens: 2000 }
    );

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
