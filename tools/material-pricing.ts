import {
  findMaterialPrice,
  findAllMaterialPrices,
  searchMaterials as dbSearchMaterials,
  MaterialPrice,
} from "@/lib/db";

export interface MaterialPriceResult {
  found: boolean;
  materialName: string;
  pricePerUnit?: number;
  unit?: string;
  currency?: string;
  message: string;
  similarityScore?: number;
}

/**
 * Get price for a specific material using semantic search
 * Falls back to AI estimate if not found
 */
export async function getMaterialPrice(
  materialName: string,
  quantity: number = 1,
  unit?: string
): Promise<MaterialPriceResult> {
  const material = await findMaterialPrice(materialName);

  if (material) {
    const totalCost = quantity * material.pricePerUnit;
    return {
      found: true,
      materialName: material.materialName,
      pricePerUnit: material.pricePerUnit,
      unit: material.unit,
      currency: material.currency,
      message: `${material.materialName}: $${material.pricePerUnit.toFixed(2)} per ${material.unit}. For ${quantity} ${unit || material.unit}: $${totalCost.toFixed(2)}`,
    };
  }

  return {
    found: false,
    materialName,
    message: `Material "${materialName}" not found in database. An AI estimate will be used.`,
  };
}

/**
 * List all materials in the database
 */
export async function listAllMaterials(): Promise<MaterialPrice[]> {
  return findAllMaterialPrices();
}

/**
 * Search materials using semantic search
 * Returns materials matching the query by meaning, not just substring
 */
export async function searchMaterials(
  query: string,
  limit: number = 10
): Promise<MaterialPrice[]> {
  return dbSearchMaterials(query, limit);
}

// Re-export types
export type { MaterialPrice };
