import { complete, extractJSON } from "@/lib/llm";
import { CostingState, LaborCosts } from "../state";
import { findLaborRate } from "@/lib/db";

export async function calculateLaborCosts(state: CostingState): Promise<Partial<CostingState>> {
  const { productDescription, components, materialCosts } = state;

  if (!components || components.length === 0) {
    return {
      currentNode: "labor",
      error: "No components to estimate labor for",
    };
  }

  try {
    // Use AI to estimate labor hours based on product complexity
    const response = await complete(
      `As a manufacturing expert, estimate the labor hours needed to produce this product.

Product: ${productDescription}

Components:
${components.map(c => `- ${c.name} (${c.material})`).join('\n')}

Total material cost: $${materialCosts?.reduce((sum, m) => sum + m.totalCost, 0).toFixed(2) || 0}

Estimate hours for each category:
1. Manufacturing (cutting, shaping, forming materials)
2. Assembly (putting components together)
3. Finishing (painting, staining, polishing)
4. Quality Control (inspection, testing)

Also specify the skill level needed for each: entry, intermediate, or expert.

Return ONLY a JSON object in this exact format:
{
  "manufacturing": {"hours": 5, "skillLevel": "intermediate"},
  "assembly": {"hours": 2, "skillLevel": "entry"},
  "finishing": {"hours": 1.5, "skillLevel": "intermediate"},
  "qualityControl": {"hours": 0.5, "skillLevel": "entry"}
}`,
      { maxTokens: 1000 }
    );

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
    const manufacturingRate = findLaborRate("machining", laborEstimates.manufacturing?.skillLevel as "entry" | "intermediate" | "expert" || "intermediate")
      || findLaborRate("woodworking", "intermediate");
    const assemblyRate = findLaborRate("assembly", laborEstimates.assembly?.skillLevel as "entry" | "intermediate" | "expert" || "entry");
    const finishingRate = findLaborRate("finishing", laborEstimates.finishing?.skillLevel as "entry" | "intermediate" | "expert" || "intermediate");
    const qcRate = findLaborRate("quality_control", laborEstimates.qualityControl?.skillLevel as "entry" | "intermediate" | "expert" || "entry");

    const manufacturingHours = laborEstimates.manufacturing?.hours || 4;
    const assemblyHours = laborEstimates.assembly?.hours || 2;
    const finishingHours = laborEstimates.finishing?.hours || 1;
    const qcHours = laborEstimates.qualityControl?.hours || 0.5;

    const manufacturingCost = manufacturingHours * (manufacturingRate?.hourlyRate || 45);
    const assemblyCost = assemblyHours * (assemblyRate?.hourlyRate || 25);
    const finishingCost = finishingHours * (finishingRate?.hourlyRate || 35);
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
