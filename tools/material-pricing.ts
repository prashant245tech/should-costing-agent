import { findMaterialPrice, findAllMaterialPrices, MaterialPrice } from "@/lib/db";

export interface MaterialPriceResult {
  found: boolean;
  materialName: string;
  pricePerUnit?: number;
  unit?: string;
  currency?: string;
  message: string;
}

export function getMaterialPrice(
  materialName: string,
  quantity: number = 1,
  unit?: string
): MaterialPriceResult {
  const material = findMaterialPrice(materialName);
  
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

export function listAllMaterials(): MaterialPrice[] {
  return findAllMaterialPrices();
}

export function searchMaterials(query: string): MaterialPrice[] {
  const allMaterials = findAllMaterialPrices();
  const searchTerm = query.toLowerCase();
  
  return allMaterials.filter(m => 
    m.materialName.toLowerCase().includes(searchTerm) ||
    searchTerm.includes(m.materialName.toLowerCase())
  );
}
