import { complete, extractJSON } from "@/lib/llm";
import { CostingState, MaterialCostItem } from "../state";
import { findMaterialPrice } from "@/lib/db";

export async function calculateMaterialCosts(state: CostingState): Promise<Partial<CostingState>> {
  const { components } = state;

  if (!components || components.length === 0) {
    return {
      currentNode: "materials",
      error: "No components to calculate costs for",
    };
  }

  try {
    const materialCosts: MaterialCostItem[] = [];
    const unknownMaterials: string[] = [];

    // First pass: look up known materials using semantic search
    for (const component of components) {
      const materialPrice = await findMaterialPrice(component.material);

      if (materialPrice) {
        // Handle unit conversion if needed
        const adjustedQuantity = component.quantity;
        const adjustedPricePerUnit = materialPrice.pricePerUnit;

        // If units don't match, we'll use the database unit
        const totalCost = adjustedQuantity * adjustedPricePerUnit;

        materialCosts.push({
          component: component.name,
          material: component.material,
          quantity: adjustedQuantity,
          unit: materialPrice.unit,
          pricePerUnit: adjustedPricePerUnit,
          totalCost: Math.round(totalCost * 100) / 100,
        });
      } else {
        unknownMaterials.push(component.material);
      }
    }

    // Second pass: estimate unknown materials using AI
    if (unknownMaterials.length > 0) {
      const unknownComponents = components.filter(c =>
        unknownMaterials.includes(c.material)
      );

      const response = await complete(
        `As a manufacturing cost expert, estimate the price per unit for these materials. Consider current market prices in USD.

Materials to estimate:
${unknownComponents.map(c => `- ${c.material} (${c.quantity} ${c.unit})`).join('\n')}

Return ONLY a JSON object with material names as keys and objects with pricePerUnit and unit as values.
Example: {"carbon fiber": {"pricePerUnit": 25.00, "unit": "lb"}}`,
        { maxTokens: 1000 }
      );

      const estimates = extractJSON<Record<string, { pricePerUnit: number; unit: string }>>(response, "object");

      if (estimates) {
        for (const component of unknownComponents) {
          const estimate = estimates[component.material];
          if (estimate) {
            const totalCost = component.quantity * estimate.pricePerUnit;
            materialCosts.push({
              component: component.name,
              material: component.material,
              quantity: component.quantity,
              unit: estimate.unit || component.unit,
              pricePerUnit: estimate.pricePerUnit,
              totalCost: Math.round(totalCost * 100) / 100,
            });
          } else {
            // Fallback: estimate based on material type
            const fallbackPrice = 10.00; // Default fallback
            const totalCost = component.quantity * fallbackPrice;
            materialCosts.push({
              component: component.name,
              material: component.material,
              quantity: component.quantity,
              unit: component.unit,
              pricePerUnit: fallbackPrice,
              totalCost: Math.round(totalCost * 100) / 100,
            });
          }
        }
      } else {
        // Use fallback prices for unknown materials
        for (const component of unknownComponents) {
          const fallbackPrice = 10.00;
          const totalCost = component.quantity * fallbackPrice;
          materialCosts.push({
            component: component.name,
            material: component.material,
            quantity: component.quantity,
            unit: component.unit,
            pricePerUnit: fallbackPrice,
            totalCost: Math.round(totalCost * 100) / 100,
          });
        }
      }
    }

    const materialsTotal = materialCosts.reduce((sum, m) => sum + m.totalCost, 0);

    return {
      materialCosts,
      currentNode: "materials",
      progress: 40,
      messages: [
        {
          role: "assistant",
          content: `Material costs calculated: $${materialsTotal.toFixed(2)} total for ${materialCosts.length} items.`,
        },
      ],
    };
  } catch (error) {
    console.error("Error in calculateMaterialCosts:", error);
    return {
      currentNode: "materials",
      error: `Failed to calculate material costs: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
