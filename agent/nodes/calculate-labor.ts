import { complete, extractJSON } from "@/lib/llm";
import { CostingState, LaborCosts } from "../state";
import { findLaborRate } from "@/lib/db";
import { getPrompt, getCategoryConfig } from "../prompts/registry";

export async function calculateLaborCosts(state: CostingState): Promise<Partial<CostingState>> {
  const { productDescription, components, materialCosts, category, subcategory } = state;

  if (!components || components.length === 0) {
    return {
      currentNode: "labor",
      error: "No components to estimate labor for",
    };
  }

  try {
    // Get category-aware prompt and config
    const prompt = await getPrompt('labor', {
      state,
      category,
      subcategory,
    });
    const categoryConfig = await getCategoryConfig(category, subcategory);

    const response = await complete(prompt, { maxTokens: 1000 });

    let laborEstimates: Record<string, { hours: number; skillLevel: string }>;
    const parsed = extractJSON<Record<string, { hours: number; skillLevel: string }>>(response, "object");

    if (parsed) {
      laborEstimates = parsed;
    } else {
      // Use default estimates
      laborEstimates = {
        manufacturing: { hours: 4, skillLevel: "intermediate" },
        assembly: { hours: 2, skillLevel: "entry" },
        finishing: { hours: 1, skillLevel: "intermediate" },
        qualityControl: { hours: 0.5, skillLevel: "entry" },
      };
    }

    // Calculate costs using labor rates from database
    // Use category config labor categories if available, otherwise use defaults
    const laborCategories = categoryConfig.laborCategories || [];
    const hasCustomCategories = laborCategories.length > 0 && !laborCategories.find(c => c.id === 'manufacturing');

    // Get labor rates (await the async calls)
    const manufacturingRate = await findLaborRate("machining", laborEstimates.manufacturing?.skillLevel as "entry" | "intermediate" | "expert" || "intermediate")
      || await findLaborRate("woodworking", "intermediate");
    const assemblyRate = await findLaborRate("assembly", laborEstimates.assembly?.skillLevel as "entry" | "intermediate" | "expert" || "entry");
    const finishingRate = await findLaborRate("finishing", laborEstimates.finishing?.skillLevel as "entry" | "intermediate" | "expert" || "intermediate");
    const qcRate = await findLaborRate("quality_control", laborEstimates.qualityControl?.skillLevel as "entry" | "intermediate" | "expert" || "entry");

    // For custom categories (like food-beverage), map to appropriate rates
    const prepRate = hasCustomCategories ? await findLaborRate("prep", "entry") : null;
    const cookingRate = hasCustomCategories ? await findLaborRate("cooking", "intermediate") : null;

    const manufacturingHours = laborEstimates.manufacturing?.hours || laborEstimates.prep?.hours || 4;
    const assemblyHours = laborEstimates.assembly?.hours || 2;
    const finishingHours = laborEstimates.finishing?.hours || laborEstimates.cooking?.hours || 1;
    const qcHours = laborEstimates.qualityControl?.hours || 0.5;

    const manufacturingCost = manufacturingHours * (prepRate?.hourlyRate || manufacturingRate?.hourlyRate || 45);
    const assemblyCost = assemblyHours * (assemblyRate?.hourlyRate || 25);
    const finishingCost = finishingHours * (cookingRate?.hourlyRate || finishingRate?.hourlyRate || 35);
    const qcCost = qcHours * (qcRate?.hourlyRate || 28);

    const laborCosts: LaborCosts = {
      manufacturing: Math.round(manufacturingCost * 100) / 100,
      assembly: Math.round(assemblyCost * 100) / 100,
      finishing: Math.round(finishingCost * 100) / 100,
      qualityControl: Math.round(qcCost * 100) / 100,
      totalHours: Math.round((manufacturingHours + assemblyHours + finishingHours + qcHours) * 100) / 100,
      totalCost: Math.round((manufacturingCost + assemblyCost + finishingCost + qcCost) * 100) / 100,
    };

    return {
      laborCosts,
      currentNode: "labor",
      progress: 60,
      messages: [
        {
          role: "assistant",
          content: `Labor costs estimated: $${laborCosts.totalCost.toFixed(2)} for ${laborCosts.totalHours} hours of work.`,
        },
      ],
    };
  } catch (error) {
    console.error("Error in calculateLaborCosts:", error);
    return {
      currentNode: "labor",
      error: `Failed to calculate labor costs: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
