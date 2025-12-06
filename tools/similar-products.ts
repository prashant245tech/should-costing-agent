import { searchSimilarProducts, findAllHistoricalCosts, HistoricalCost } from "@/lib/db";

export interface SimilarProductResult {
  found: boolean;
  products: Array<{
    name: string;
    description: string;
    totalCost: number;
    createdAt: Date;
  }>;
  message: string;
}

export function findSimilarProducts(productDescription: string): SimilarProductResult {
  const similar = searchSimilarProducts(productDescription);
  
  if (similar.length > 0) {
    return {
      found: true,
      products: similar.map(p => ({
        name: p.productName,
        description: p.productDescription,
        totalCost: p.totalCost,
        createdAt: p.createdAt,
      })),
      message: `Found ${similar.length} similar product(s) for comparison.`,
    };
  }

  return {
    found: false,
    products: [],
    message: "No similar products found in historical data.",
  };
}

export function getAllHistoricalCosts(): HistoricalCost[] {
  return findAllHistoricalCosts();
}

export function compareWithHistorical(
  productDescription: string,
  estimatedCost: number
): {
  similar: HistoricalCost[];
  averageSimilarCost: number;
  percentageDifference: number;
  message: string;
} {
  const similar = searchSimilarProducts(productDescription);
  
  if (similar.length === 0) {
    return {
      similar: [],
      averageSimilarCost: 0,
      percentageDifference: 0,
      message: "No historical data available for comparison.",
    };
  }

  const averageCost = similar.reduce((sum, p) => sum + p.totalCost, 0) / similar.length;
  const percentDiff = ((estimatedCost - averageCost) / averageCost) * 100;

  let comparisonMessage: string;
  if (percentDiff > 10) {
    comparisonMessage = `Your estimate is ${percentDiff.toFixed(1)}% higher than similar products. Consider reviewing costs.`;
  } else if (percentDiff < -10) {
    comparisonMessage = `Your estimate is ${Math.abs(percentDiff).toFixed(1)}% lower than similar products. Verify all costs are included.`;
  } else {
    comparisonMessage = `Your estimate is within ${Math.abs(percentDiff).toFixed(1)}% of similar products. Looks reasonable!`;
  }

  return {
    similar,
    averageSimilarCost: averageCost,
    percentageDifference: percentDiff,
    message: comparisonMessage,
  };
}
