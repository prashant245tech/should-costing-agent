/**
 * Database layer with Prisma + semantic search
 * Falls back to in-memory data when database is unavailable
 */

import prisma from "./prisma";
import {
  findMaterialBySemantics,
  findLaborRateBySemantics,
  findSimilarHistoricalCosts,
  searchMaterialsBySemantics,
  searchLaborRatesBySemantics,
  searchHistoricalCostsBySemantics,
} from "./semantic-search";

export type SkillLevel = "entry" | "intermediate" | "expert";

export interface MaterialPrice {
  id: string;
  materialName: string;
  pricePerUnit: number;
  unit: string;
  supplier?: string;
  currency: string;
  lastUpdated: Date;
}

export interface LaborRate {
  id: string;
  processType: string;
  region: string;
  hourlyRate: number;
  skillLevel: SkillLevel;
  lastUpdated: Date;
}

export interface HistoricalCost {
  id: string;
  productName: string;
  productDescription: string;
  totalCost: number;
  breakdown: Record<string, unknown>;
  createdAt: Date;
  userId?: string;
}

// Prisma result types (before client generation, these match the expected shape)
interface PrismaMaterialPriceResult {
  id: string;
  materialName: string;
  pricePerUnit: unknown; // Decimal type
  unit: string;
  supplier: string | null;
  currency: string;
  lastUpdated: Date;
}

interface PrismaLaborRateResult {
  id: string;
  processType: string;
  region: string;
  hourlyRate: unknown; // Decimal type
  skillLevel: string;
  lastUpdated: Date;
}

interface PrismaHistoricalCostResult {
  id: string;
  productName: string;
  productDescription: string;
  totalCost: unknown; // Decimal type
  breakdown: unknown; // Json type
  createdAt: Date;
  userId: string | null;
}

// ============ SEEDED DATA (for initial database population) ============
export const SEED_MATERIAL_PRICES: Omit<MaterialPrice, "id" | "lastUpdated">[] = [
  // Wood materials
  { materialName: "oak wood", pricePerUnit: 12.5, unit: "board_foot", currency: "USD" },
  { materialName: "pine wood", pricePerUnit: 4.5, unit: "board_foot", currency: "USD" },
  { materialName: "walnut wood", pricePerUnit: 18.0, unit: "board_foot", currency: "USD" },
  { materialName: "maple wood", pricePerUnit: 8.5, unit: "board_foot", currency: "USD" },
  { materialName: "cherry wood", pricePerUnit: 14.0, unit: "board_foot", currency: "USD" },
  { materialName: "plywood", pricePerUnit: 45.0, unit: "sheet", currency: "USD" },
  { materialName: "mdf", pricePerUnit: 35.0, unit: "sheet", currency: "USD" },
  // Metals
  { materialName: "steel", pricePerUnit: 0.85, unit: "lb", currency: "USD" },
  { materialName: "aluminum", pricePerUnit: 1.2, unit: "lb", currency: "USD" },
  { materialName: "stainless steel", pricePerUnit: 2.5, unit: "lb", currency: "USD" },
  { materialName: "copper", pricePerUnit: 4.5, unit: "lb", currency: "USD" },
  { materialName: "brass", pricePerUnit: 3.8, unit: "lb", currency: "USD" },
  { materialName: "iron", pricePerUnit: 0.45, unit: "lb", currency: "USD" },
  // Plastics
  { materialName: "abs plastic", pricePerUnit: 2.2, unit: "lb", currency: "USD" },
  { materialName: "polycarbonate", pricePerUnit: 3.5, unit: "lb", currency: "USD" },
  { materialName: "acrylic", pricePerUnit: 4.0, unit: "lb", currency: "USD" },
  { materialName: "pvc", pricePerUnit: 1.5, unit: "lb", currency: "USD" },
  { materialName: "hdpe", pricePerUnit: 1.8, unit: "lb", currency: "USD" },
  // Textiles
  { materialName: "cotton fabric", pricePerUnit: 8.0, unit: "yard", currency: "USD" },
  { materialName: "leather", pricePerUnit: 25.0, unit: "sq_ft", currency: "USD" },
  { materialName: "synthetic leather", pricePerUnit: 12.0, unit: "sq_ft", currency: "USD" },
  { materialName: "foam padding", pricePerUnit: 3.5, unit: "sq_ft", currency: "USD" },
  { materialName: "polyester fabric", pricePerUnit: 5.5, unit: "yard", currency: "USD" },
  // Glass & Ceramics
  { materialName: "tempered glass", pricePerUnit: 15.0, unit: "sq_ft", currency: "USD" },
  { materialName: "standard glass", pricePerUnit: 8.0, unit: "sq_ft", currency: "USD" },
  { materialName: "ceramic", pricePerUnit: 6.0, unit: "lb", currency: "USD" },
  // Hardware & Fasteners
  { materialName: "screws", pricePerUnit: 0.05, unit: "piece", currency: "USD" },
  { materialName: "bolts", pricePerUnit: 0.15, unit: "piece", currency: "USD" },
  { materialName: "nails", pricePerUnit: 0.02, unit: "piece", currency: "USD" },
  { materialName: "hinges", pricePerUnit: 3.5, unit: "piece", currency: "USD" },
  { materialName: "drawer slides", pricePerUnit: 12.0, unit: "pair", currency: "USD" },
  { materialName: "handles", pricePerUnit: 5.0, unit: "piece", currency: "USD" },
  { materialName: "knobs", pricePerUnit: 3.0, unit: "piece", currency: "USD" },
  // Finishes & Coatings
  { materialName: "wood stain", pricePerUnit: 25.0, unit: "gallon", currency: "USD" },
  { materialName: "polyurethane finish", pricePerUnit: 45.0, unit: "gallon", currency: "USD" },
  { materialName: "paint", pricePerUnit: 35.0, unit: "gallon", currency: "USD" },
  { materialName: "lacquer", pricePerUnit: 55.0, unit: "gallon", currency: "USD" },
  { materialName: "wood glue", pricePerUnit: 15.0, unit: "gallon", currency: "USD" },
  // Electronics components
  { materialName: "led lights", pricePerUnit: 0.5, unit: "piece", currency: "USD" },
  { materialName: "wiring", pricePerUnit: 0.25, unit: "foot", currency: "USD" },
  { materialName: "circuit board", pricePerUnit: 15.0, unit: "piece", currency: "USD" },
  { materialName: "motor", pricePerUnit: 25.0, unit: "piece", currency: "USD" },
  { materialName: "battery", pricePerUnit: 8.0, unit: "piece", currency: "USD" },
  // Rubber & Foam
  { materialName: "rubber", pricePerUnit: 2.5, unit: "lb", currency: "USD" },
  { materialName: "silicone", pricePerUnit: 8.0, unit: "lb", currency: "USD" },
  { materialName: "memory foam", pricePerUnit: 5.0, unit: "sq_ft", currency: "USD" },
  // Concrete & Stone
  { materialName: "concrete", pricePerUnit: 120.0, unit: "cubic_yard", currency: "USD" },
  { materialName: "marble", pricePerUnit: 75.0, unit: "sq_ft", currency: "USD" },
  { materialName: "granite", pricePerUnit: 60.0, unit: "sq_ft", currency: "USD" },
  { materialName: "quartz", pricePerUnit: 70.0, unit: "sq_ft", currency: "USD" },
];

export const SEED_LABOR_RATES: Omit<LaborRate, "id" | "lastUpdated">[] = [
  // Assembly
  { processType: "assembly", region: "US", hourlyRate: 25.0, skillLevel: "entry" },
  { processType: "assembly", region: "US", hourlyRate: 35.0, skillLevel: "intermediate" },
  { processType: "assembly", region: "US", hourlyRate: 50.0, skillLevel: "expert" },
  // Welding
  { processType: "welding", region: "US", hourlyRate: 35.0, skillLevel: "entry" },
  { processType: "welding", region: "US", hourlyRate: 50.0, skillLevel: "intermediate" },
  { processType: "welding", region: "US", hourlyRate: 75.0, skillLevel: "expert" },
  // Machining
  { processType: "machining", region: "US", hourlyRate: 40.0, skillLevel: "entry" },
  { processType: "machining", region: "US", hourlyRate: 60.0, skillLevel: "intermediate" },
  { processType: "machining", region: "US", hourlyRate: 85.0, skillLevel: "expert" },
  // Woodworking
  { processType: "woodworking", region: "US", hourlyRate: 30.0, skillLevel: "entry" },
  { processType: "woodworking", region: "US", hourlyRate: 45.0, skillLevel: "intermediate" },
  { processType: "woodworking", region: "US", hourlyRate: 65.0, skillLevel: "expert" },
  // Finishing
  { processType: "finishing", region: "US", hourlyRate: 25.0, skillLevel: "entry" },
  { processType: "finishing", region: "US", hourlyRate: 35.0, skillLevel: "intermediate" },
  { processType: "finishing", region: "US", hourlyRate: 50.0, skillLevel: "expert" },
  // Upholstery
  { processType: "upholstery", region: "US", hourlyRate: 28.0, skillLevel: "entry" },
  { processType: "upholstery", region: "US", hourlyRate: 40.0, skillLevel: "intermediate" },
  { processType: "upholstery", region: "US", hourlyRate: 55.0, skillLevel: "expert" },
  // Electronics Assembly
  { processType: "electronics_assembly", region: "US", hourlyRate: 30.0, skillLevel: "entry" },
  { processType: "electronics_assembly", region: "US", hourlyRate: 45.0, skillLevel: "intermediate" },
  { processType: "electronics_assembly", region: "US", hourlyRate: 70.0, skillLevel: "expert" },
  // Painting
  { processType: "painting", region: "US", hourlyRate: 22.0, skillLevel: "entry" },
  { processType: "painting", region: "US", hourlyRate: 32.0, skillLevel: "intermediate" },
  { processType: "painting", region: "US", hourlyRate: 45.0, skillLevel: "expert" },
  // Quality Control
  { processType: "quality_control", region: "US", hourlyRate: 28.0, skillLevel: "entry" },
  { processType: "quality_control", region: "US", hourlyRate: 40.0, skillLevel: "intermediate" },
  { processType: "quality_control", region: "US", hourlyRate: 55.0, skillLevel: "expert" },
  // Packaging
  { processType: "packaging", region: "US", hourlyRate: 18.0, skillLevel: "entry" },
  { processType: "packaging", region: "US", hourlyRate: 24.0, skillLevel: "intermediate" },
  { processType: "packaging", region: "US", hourlyRate: 32.0, skillLevel: "expert" },
];

export const SEED_HISTORICAL_COSTS: Omit<HistoricalCost, "id" | "createdAt">[] = [
  {
    productName: "Wooden Dining Table",
    productDescription: "6-foot oak dining table with 4 legs, seats 6 people",
    totalCost: 697.0,
    breakdown: {
      materials: { oak_tabletop: 150, legs: 60, hardware: 25, finish: 30 },
      labor: { manufacturing: 280, assembly: 50 },
      overhead: 102,
    },
  },
  {
    productName: "Office Chair",
    productDescription: "Ergonomic office chair with mesh back, adjustable height, armrests",
    totalCost: 285.0,
    breakdown: {
      materials: { frame: 45, mesh: 35, foam: 25, wheels: 20, hardware: 15 },
      labor: { manufacturing: 60, assembly: 30 },
      overhead: 55,
    },
  },
  {
    productName: "Bookshelf",
    productDescription: "5-shelf walnut bookshelf, 72 inches tall, 36 inches wide",
    totalCost: 425.0,
    breakdown: {
      materials: { walnut_boards: 180, hardware: 20, finish: 25 },
      labor: { manufacturing: 100, assembly: 40 },
      overhead: 60,
    },
  },
  {
    productName: "Coffee Table",
    productDescription: "Modern coffee table with tempered glass top and steel frame",
    totalCost: 320.0,
    breakdown: {
      materials: { tempered_glass: 75, steel_frame: 65, hardware: 15 },
      labor: { manufacturing: 80, assembly: 35 },
      overhead: 50,
    },
  },
  {
    productName: "Kitchen Cabinet Set",
    productDescription: "Set of 10 maple kitchen cabinets with soft-close hinges",
    totalCost: 2850.0,
    breakdown: {
      materials: { maple_boards: 800, hinges: 150, handles: 100, hardware: 200, finish: 150 },
      labor: { manufacturing: 650, assembly: 300, installation: 200 },
      overhead: 300,
    },
  },
];

// ============ IN-MEMORY FALLBACK DATA ============
// Used when database is unavailable (e.g., during development without PostgreSQL)
const fallbackMaterialPrices: MaterialPrice[] = SEED_MATERIAL_PRICES.map((m, i) => ({
  ...m,
  id: String(i + 1),
  lastUpdated: new Date(),
}));

const fallbackLaborRates: LaborRate[] = SEED_LABOR_RATES.map((l, i) => ({
  ...l,
  id: String(i + 1),
  lastUpdated: new Date(),
}));

const fallbackHistoricalCosts: HistoricalCost[] = SEED_HISTORICAL_COSTS.map((h, i) => ({
  ...h,
  id: String(i + 1),
  createdAt: new Date(),
}));

// ============ HELPER FUNCTIONS ============

/**
 * Check if the database is available
 */
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert Prisma Decimal to number
 */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

// ============ DATABASE QUERY FUNCTIONS ============

/**
 * Find material price by name using semantic search with exact match fallback
 */
export async function findMaterialPrice(materialName: string): Promise<MaterialPrice | undefined> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    // Try exact/partial match first via Prisma
    const exactMatch = await prisma.materialPrice.findFirst({
      where: {
        materialName: {
          contains: materialName,
          mode: "insensitive",
        },
      },
    });

    if (exactMatch) {
      return {
        id: exactMatch.id,
        materialName: exactMatch.materialName,
        pricePerUnit: toNumber(exactMatch.pricePerUnit),
        unit: exactMatch.unit,
        supplier: exactMatch.supplier || undefined,
        currency: exactMatch.currency,
        lastUpdated: exactMatch.lastUpdated,
      };
    }

    // Fall back to semantic search
    try {
      const semanticResult = await findMaterialBySemantics(materialName, 0.6);
      if (semanticResult) {
        return {
          ...semanticResult,
          supplier: semanticResult.supplier || undefined,
        };
      }
    } catch (error) {
      console.warn("Semantic search failed, using exact match only:", error);
    }

    return undefined;
  }

  // Fallback to in-memory data
  const searchTerm = materialName.toLowerCase().trim();
  return fallbackMaterialPrices.find(
    (m) =>
      m.materialName.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(m.materialName.toLowerCase())
  );
}

/**
 * Get all material prices
 */
export async function findAllMaterialPrices(): Promise<MaterialPrice[]> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const materials = await prisma.materialPrice.findMany();
    return materials.map((m: PrismaMaterialPriceResult) => ({
      id: m.id,
      materialName: m.materialName,
      pricePerUnit: toNumber(m.pricePerUnit),
      unit: m.unit,
      supplier: m.supplier || undefined,
      currency: m.currency,
      lastUpdated: m.lastUpdated,
    }));
  }

  return fallbackMaterialPrices;
}

/**
 * Search materials using semantic search
 */
export async function searchMaterials(query: string, limit: number = 10): Promise<MaterialPrice[]> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const results = await searchMaterialsBySemantics(query, { limit, threshold: 0.5 });
      return results.map((r) => ({
        ...r.item,
        supplier: r.item.supplier || undefined,
      }));
    } catch (error) {
      console.warn("Semantic search failed:", error);
    }
  }

  // Fallback to substring search
  const searchTerm = query.toLowerCase();
  return fallbackMaterialPrices
    .filter(
      (m) =>
        m.materialName.toLowerCase().includes(searchTerm) ||
        searchTerm.includes(m.materialName.toLowerCase())
    )
    .slice(0, limit);
}

/**
 * Find labor rate by process type using semantic search
 */
export async function findLaborRate(
  processType: string,
  skillLevel: SkillLevel = "intermediate",
  region: string = "US"
): Promise<LaborRate | undefined> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    // Try exact match first
    const exactMatch = await prisma.laborRate.findFirst({
      where: {
        processType: {
          contains: processType,
          mode: "insensitive",
        },
        skillLevel,
        region,
      },
    });

    if (exactMatch) {
      return {
        id: exactMatch.id,
        processType: exactMatch.processType,
        region: exactMatch.region,
        hourlyRate: toNumber(exactMatch.hourlyRate),
        skillLevel: exactMatch.skillLevel as SkillLevel,
        lastUpdated: exactMatch.lastUpdated,
      };
    }

    // Fall back to semantic search
    try {
      const semanticResult = await findLaborRateBySemantics(processType, skillLevel, region, 0.6);
      if (semanticResult) {
        return {
          ...semanticResult,
          skillLevel: semanticResult.skillLevel as SkillLevel,
        };
      }
    } catch (error) {
      console.warn("Semantic search failed:", error);
    }

    return undefined;
  }

  // Fallback to in-memory data
  const searchTerm = processType.toLowerCase().trim();
  return fallbackLaborRates.find(
    (l) =>
      l.processType.toLowerCase().includes(searchTerm) &&
      l.skillLevel === skillLevel &&
      l.region === region
  );
}

/**
 * Get all labor rates
 */
export async function findAllLaborRates(): Promise<LaborRate[]> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const rates = await prisma.laborRate.findMany();
    return rates.map((l: PrismaLaborRateResult) => ({
      id: l.id,
      processType: l.processType,
      region: l.region,
      hourlyRate: toNumber(l.hourlyRate),
      skillLevel: l.skillLevel as SkillLevel,
      lastUpdated: l.lastUpdated,
    }));
  }

  return fallbackLaborRates;
}

/**
 * Search labor rates using semantic search
 */
export async function searchLaborRates(query: string, limit: number = 10): Promise<LaborRate[]> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const results = await searchLaborRatesBySemantics(query, { limit, threshold: 0.5 });
      return results.map((r) => ({
        ...r.item,
        skillLevel: r.item.skillLevel as SkillLevel,
      }));
    } catch (error) {
      console.warn("Semantic search failed:", error);
    }
  }

  // Fallback to substring search
  const searchTerm = query.toLowerCase();
  return fallbackLaborRates
    .filter((l) => l.processType.toLowerCase().includes(searchTerm))
    .slice(0, limit);
}

/**
 * Search for similar products using semantic search
 */
export async function searchSimilarProducts(description: string): Promise<HistoricalCost[]> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const results = await findSimilarHistoricalCosts(description, 5, 0.5);
      return results.map((r) => ({
        ...r.item,
        userId: r.item.userId || undefined,
      }));
    } catch (error) {
      console.warn("Semantic search failed:", error);
    }
  }

  // Fallback to keyword search
  const searchTerms = description.toLowerCase().split(" ");
  return fallbackHistoricalCosts.filter((h) => {
    const productText = `${h.productName} ${h.productDescription}`.toLowerCase();
    return searchTerms.some((term) => productText.includes(term));
  });
}

/**
 * Search historical costs using semantic search
 */
export async function searchHistoricalCosts(
  query: string,
  limit: number = 10
): Promise<HistoricalCost[]> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const results = await searchHistoricalCostsBySemantics(query, { limit, threshold: 0.5 });
      return results.map((r) => ({
        ...r.item,
        userId: r.item.userId || undefined,
      }));
    } catch (error) {
      console.warn("Semantic search failed:", error);
    }
  }

  // Fallback to keyword search
  const searchTerms = query.toLowerCase().split(" ");
  return fallbackHistoricalCosts
    .filter((h) => {
      const productText = `${h.productName} ${h.productDescription}`.toLowerCase();
      return searchTerms.some((term) => productText.includes(term));
    })
    .slice(0, limit);
}

/**
 * Get all historical costs
 */
export async function findAllHistoricalCosts(): Promise<HistoricalCost[]> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const costs = await prisma.historicalCost.findMany();
    return costs.map((c: PrismaHistoricalCostResult) => ({
      id: c.id,
      productName: c.productName,
      productDescription: c.productDescription,
      totalCost: toNumber(c.totalCost),
      breakdown: c.breakdown as Record<string, unknown>,
      createdAt: c.createdAt,
      userId: c.userId || undefined,
    }));
  }

  return fallbackHistoricalCosts;
}

/**
 * Save a new historical cost record
 */
export async function saveHistoricalCost(
  cost: Omit<HistoricalCost, "id" | "createdAt">
): Promise<HistoricalCost> {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const created = await prisma.historicalCost.create({
      data: {
        productName: cost.productName,
        productDescription: cost.productDescription,
        totalCost: cost.totalCost,
        breakdown: cost.breakdown as any,
        userId: cost.userId,
      },
    });

    return {
      id: created.id,
      productName: created.productName,
      productDescription: created.productDescription,
      totalCost: toNumber(created.totalCost),
      breakdown: created.breakdown as Record<string, unknown>,
      createdAt: created.createdAt,
      userId: created.userId || undefined,
    };
  }

  // Fallback to in-memory
  const newCost: HistoricalCost = {
    ...cost,
    id: String(fallbackHistoricalCosts.length + 1),
    createdAt: new Date(),
  };
  fallbackHistoricalCosts.push(newCost);
  return newCost;
}

// Export all data for direct access if needed
export const db = {
  findMaterialPrice,
  findAllMaterialPrices,
  searchMaterials,
  findLaborRate,
  findAllLaborRates,
  searchLaborRates,
  searchSimilarProducts,
  searchHistoricalCosts,
  findAllHistoricalCosts,
  saveHistoricalCost,
  // Seed data exports
  SEED_MATERIAL_PRICES,
  SEED_LABOR_RATES,
  SEED_HISTORICAL_COSTS,
};

export default db;
