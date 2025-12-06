/**
 * Semantic search functions using pgvector
 * Provides vector similarity search for materials, labor rates, and historical costs
 */

import prisma from "./prisma";
import { generateEmbedding } from "./embeddings";

// Search options interface
export interface SemanticSearchOptions {
  limit?: number; // Max results (default: 10)
  threshold?: number; // Similarity threshold 0-1 (default: 0.5)
}

// Generic search result with similarity score
export interface SearchResult<T> {
  item: T;
  score: number;
}

// Entity type definitions
export interface MaterialPrice {
  id: string;
  materialName: string;
  pricePerUnit: number;
  unit: string;
  supplier: string | null;
  currency: string;
  lastUpdated: Date;
}

export interface LaborRate {
  id: string;
  processType: string;
  region: string;
  hourlyRate: number;
  skillLevel: "entry" | "intermediate" | "expert";
  lastUpdated: Date;
}

export interface HistoricalCost {
  id: string;
  productName: string;
  productDescription: string;
  totalCost: number;
  breakdown: Record<string, unknown>;
  createdAt: Date;
  userId: string | null;
}

/**
 * Convert embedding array to pgvector format string
 */
function toVectorString(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Search materials by semantic similarity
 */
export async function searchMaterialsBySemantics(
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SearchResult<MaterialPrice>[]> {
  const { limit = 10, threshold = 0.5 } = options;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = toVectorString(queryEmbedding);

  // Execute similarity search using cosine distance
  // 1 - cosine_distance = cosine_similarity (0-1 range)
  const results = await prisma.$queryRawUnsafe<
    (MaterialPrice & { similarity: number })[]
  >(
    `
    SELECT
      id,
      "materialName",
      "pricePerUnit"::float as "pricePerUnit",
      unit,
      supplier,
      currency,
      "lastUpdated",
      1 - (embedding <=> $1::vector) as similarity
    FROM "MaterialPrice"
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) > $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    vectorStr,
    threshold,
    limit
  );

  return results.map((r) => ({
    item: {
      id: r.id,
      materialName: r.materialName,
      pricePerUnit: r.pricePerUnit,
      unit: r.unit,
      supplier: r.supplier,
      currency: r.currency,
      lastUpdated: r.lastUpdated,
    },
    score: r.similarity,
  }));
}

/**
 * Search labor rates by semantic similarity
 */
export async function searchLaborRatesBySemantics(
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SearchResult<LaborRate>[]> {
  const { limit = 10, threshold = 0.5 } = options;

  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = toVectorString(queryEmbedding);

  const results = await prisma.$queryRawUnsafe<
    (LaborRate & { similarity: number })[]
  >(
    `
    SELECT
      id,
      "processType",
      region,
      "hourlyRate"::float as "hourlyRate",
      "skillLevel",
      "lastUpdated",
      1 - (embedding <=> $1::vector) as similarity
    FROM "LaborRate"
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) > $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    vectorStr,
    threshold,
    limit
  );

  return results.map((r) => ({
    item: {
      id: r.id,
      processType: r.processType,
      region: r.region,
      hourlyRate: r.hourlyRate,
      skillLevel: r.skillLevel,
      lastUpdated: r.lastUpdated,
    },
    score: r.similarity,
  }));
}

/**
 * Search historical costs by semantic similarity
 */
export async function searchHistoricalCostsBySemantics(
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SearchResult<HistoricalCost>[]> {
  const { limit = 10, threshold = 0.5 } = options;

  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = toVectorString(queryEmbedding);

  const results = await prisma.$queryRawUnsafe<
    (HistoricalCost & { similarity: number })[]
  >(
    `
    SELECT
      id,
      "productName",
      "productDescription",
      "totalCost"::float as "totalCost",
      breakdown,
      "createdAt",
      "userId",
      1 - (embedding <=> $1::vector) as similarity
    FROM "HistoricalCost"
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) > $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    vectorStr,
    threshold,
    limit
  );

  return results.map((r) => ({
    item: {
      id: r.id,
      productName: r.productName,
      productDescription: r.productDescription,
      totalCost: r.totalCost,
      breakdown: r.breakdown as Record<string, unknown>,
      createdAt: r.createdAt,
      userId: r.userId,
    },
    score: r.similarity,
  }));
}

/**
 * Find the best matching material by name using semantic search
 * Returns the top result if it meets the threshold, otherwise null
 */
export async function findMaterialBySemantics(
  materialName: string,
  threshold: number = 0.6
): Promise<MaterialPrice | null> {
  const results = await searchMaterialsBySemantics(materialName, {
    limit: 1,
    threshold,
  });

  return results.length > 0 ? results[0].item : null;
}

/**
 * Find the best matching labor rate by process type using semantic search
 */
export async function findLaborRateBySemantics(
  processType: string,
  skillLevel?: "entry" | "intermediate" | "expert",
  region?: string,
  threshold: number = 0.6
): Promise<LaborRate | null> {
  // Build a rich query string
  const queryParts = [processType];
  if (skillLevel) queryParts.push(`${skillLevel} skill level`);
  if (region) queryParts.push(`in ${region}`);

  const results = await searchLaborRatesBySemantics(queryParts.join(" "), {
    limit: 5,
    threshold,
  });

  // Filter by exact skill level and region if provided
  if (skillLevel || region) {
    const filtered = results.filter((r) => {
      if (skillLevel && r.item.skillLevel !== skillLevel) return false;
      if (region && r.item.region !== region) return false;
      return true;
    });
    if (filtered.length > 0) return filtered[0].item;
  }

  return results.length > 0 ? results[0].item : null;
}

/**
 * Find similar historical products using semantic search
 */
export async function findSimilarHistoricalCosts(
  productDescription: string,
  limit: number = 5,
  threshold: number = 0.5
): Promise<SearchResult<HistoricalCost>[]> {
  return searchHistoricalCostsBySemantics(productDescription, {
    limit,
    threshold,
  });
}
