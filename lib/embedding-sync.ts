/**
 * Embedding synchronization service
 * Handles generating and updating embeddings for database entities
 */

import prisma from "./prisma";
import { generateEmbedding, generateEmbeddings } from "./embeddings";

// Type definitions for entities (matching Prisma models)
interface MaterialPrice {
  id: string;
  materialName: string;
  pricePerUnit: number | { toNumber(): number };
  unit: string;
  supplier: string | null;
  currency: string;
}

interface LaborRate {
  id: string;
  processType: string;
  region: string;
  hourlyRate: number | { toNumber(): number };
  skillLevel: string;
}

interface HistoricalCost {
  id: string;
  productName: string;
  productDescription: string;
  totalCost: number | { toNumber(): number };
  breakdown: unknown;
}

/**
 * Generate searchable text from a MaterialPrice entity
 * Combines relevant fields for rich semantic representation
 */
export function getMaterialEmbeddingText(material: MaterialPrice): string {
  const price =
    typeof material.pricePerUnit === "number"
      ? material.pricePerUnit
      : material.pricePerUnit.toNumber();

  return [
    material.materialName,
    `unit: ${material.unit}`,
    material.supplier ? `supplier: ${material.supplier}` : "",
    `price: ${price.toFixed(2)} ${material.currency} per ${material.unit}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * Generate searchable text from a LaborRate entity
 */
export function getLaborRateEmbeddingText(laborRate: LaborRate): string {
  const rate =
    typeof laborRate.hourlyRate === "number"
      ? laborRate.hourlyRate
      : laborRate.hourlyRate.toNumber();

  return [
    laborRate.processType,
    `skill level: ${laborRate.skillLevel}`,
    `region: ${laborRate.region}`,
    `hourly rate: ${rate.toFixed(2)} USD per hour`,
  ].join(" | ");
}

/**
 * Generate searchable text from a HistoricalCost entity
 */
export function getHistoricalCostEmbeddingText(cost: HistoricalCost): string {
  const total =
    typeof cost.totalCost === "number"
      ? cost.totalCost
      : cost.totalCost.toNumber();

  const breakdownStr =
    typeof cost.breakdown === "object" && cost.breakdown !== null
      ? Object.keys(cost.breakdown as Record<string, unknown>).join(", ")
      : "";

  return [
    cost.productName,
    cost.productDescription,
    `total cost: ${total.toFixed(2)} USD`,
    breakdownStr ? `components: ${breakdownStr}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * Convert embedding array to pgvector format string
 */
function toVectorString(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Sync embedding for a single material
 */
export async function syncMaterialEmbedding(materialId: string): Promise<void> {
  const material = await prisma.materialPrice.findUnique({
    where: { id: materialId },
  });

  if (!material) {
    throw new Error(`Material not found: ${materialId}`);
  }

  const text = getMaterialEmbeddingText(material as unknown as MaterialPrice);
  const embedding = await generateEmbedding(text);
  const vectorStr = toVectorString(embedding);

  await prisma.$executeRawUnsafe(
    `UPDATE "MaterialPrice" SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    materialId
  );
}

/**
 * Sync embedding for a single labor rate
 */
export async function syncLaborRateEmbedding(laborRateId: string): Promise<void> {
  const laborRate = await prisma.laborRate.findUnique({
    where: { id: laborRateId },
  });

  if (!laborRate) {
    throw new Error(`Labor rate not found: ${laborRateId}`);
  }

  const text = getLaborRateEmbeddingText(laborRate as unknown as LaborRate);
  const embedding = await generateEmbedding(text);
  const vectorStr = toVectorString(embedding);

  await prisma.$executeRawUnsafe(
    `UPDATE "LaborRate" SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    laborRateId
  );
}

/**
 * Sync embedding for a single historical cost
 */
export async function syncHistoricalCostEmbedding(costId: string): Promise<void> {
  const cost = await prisma.historicalCost.findUnique({
    where: { id: costId },
  });

  if (!cost) {
    throw new Error(`Historical cost not found: ${costId}`);
  }

  const text = getHistoricalCostEmbeddingText(cost as unknown as HistoricalCost);
  const embedding = await generateEmbedding(text);
  const vectorStr = toVectorString(embedding);

  await prisma.$executeRawUnsafe(
    `UPDATE "HistoricalCost" SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    costId
  );
}

/**
 * Sync all material embeddings in batches
 */
export async function syncAllMaterialEmbeddings(batchSize: number = 100): Promise<number> {
  let processed = 0;
  let offset = 0;

  while (true) {
    // Fetch materials without embeddings (or all if resyncing)
    const materials = await prisma.$queryRaw<MaterialPrice[]>`
      SELECT id, "materialName", "pricePerUnit", unit, supplier, currency
      FROM "MaterialPrice"
      WHERE embedding IS NULL
      ORDER BY id
      LIMIT ${batchSize}
      OFFSET ${offset}
    `;

    if (materials.length === 0) break;

    // Generate embedding texts
    const texts = materials.map((m) => getMaterialEmbeddingText(m));

    // Batch generate embeddings
    const embeddings = await generateEmbeddings(texts);

    // Update in database
    for (let i = 0; i < materials.length; i++) {
      const vectorStr = toVectorString(embeddings[i]);
      await prisma.$executeRawUnsafe(
        `UPDATE "MaterialPrice" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        materials[i].id
      );
    }

    processed += materials.length;
    console.log(`Processed ${processed} materials...`);

    // If we got fewer than batchSize, we're done
    if (materials.length < batchSize) break;
    offset += batchSize;
  }

  return processed;
}

/**
 * Sync all labor rate embeddings in batches
 */
export async function syncAllLaborRateEmbeddings(batchSize: number = 100): Promise<number> {
  let processed = 0;
  let offset = 0;

  while (true) {
    const laborRates = await prisma.$queryRaw<LaborRate[]>`
      SELECT id, "processType", region, "hourlyRate", "skillLevel"
      FROM "LaborRate"
      WHERE embedding IS NULL
      ORDER BY id
      LIMIT ${batchSize}
      OFFSET ${offset}
    `;

    if (laborRates.length === 0) break;

    const texts = laborRates.map((lr) => getLaborRateEmbeddingText(lr));
    const embeddings = await generateEmbeddings(texts);

    for (let i = 0; i < laborRates.length; i++) {
      const vectorStr = toVectorString(embeddings[i]);
      await prisma.$executeRawUnsafe(
        `UPDATE "LaborRate" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        laborRates[i].id
      );
    }

    processed += laborRates.length;
    console.log(`Processed ${processed} labor rates...`);

    if (laborRates.length < batchSize) break;
    offset += batchSize;
  }

  return processed;
}

/**
 * Sync all historical cost embeddings in batches
 */
export async function syncAllHistoricalCostEmbeddings(batchSize: number = 100): Promise<number> {
  let processed = 0;
  let offset = 0;

  while (true) {
    const costs = await prisma.$queryRaw<HistoricalCost[]>`
      SELECT id, "productName", "productDescription", "totalCost", breakdown
      FROM "HistoricalCost"
      WHERE embedding IS NULL
      ORDER BY id
      LIMIT ${batchSize}
      OFFSET ${offset}
    `;

    if (costs.length === 0) break;

    const texts = costs.map((c) => getHistoricalCostEmbeddingText(c));
    const embeddings = await generateEmbeddings(texts);

    for (let i = 0; i < costs.length; i++) {
      const vectorStr = toVectorString(embeddings[i]);
      await prisma.$executeRawUnsafe(
        `UPDATE "HistoricalCost" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        costs[i].id
      );
    }

    processed += costs.length;
    console.log(`Processed ${processed} historical costs...`);

    if (costs.length < batchSize) break;
    offset += batchSize;
  }

  return processed;
}

/**
 * Resync all embeddings (clears existing and regenerates)
 * Useful when changing embedding provider or model
 */
export async function resyncAllEmbeddings(batchSize: number = 100): Promise<{
  materials: number;
  laborRates: number;
  historicalCosts: number;
}> {
  console.log("Clearing existing embeddings...");

  // Clear all existing embeddings
  await prisma.$executeRaw`UPDATE "MaterialPrice" SET embedding = NULL`;
  await prisma.$executeRaw`UPDATE "LaborRate" SET embedding = NULL`;
  await prisma.$executeRaw`UPDATE "HistoricalCost" SET embedding = NULL`;

  console.log("Regenerating embeddings...");

  const materials = await syncAllMaterialEmbeddings(batchSize);
  const laborRates = await syncAllLaborRateEmbeddings(batchSize);
  const historicalCosts = await syncAllHistoricalCostEmbeddings(batchSize);

  return { materials, laborRates, historicalCosts };
}
