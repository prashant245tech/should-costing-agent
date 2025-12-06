import {
  findLaborRate,
  findAllLaborRates,
  searchLaborRates as dbSearchLaborRates,
  LaborRate,
  SkillLevel,
} from "@/lib/db";

export interface LaborRateResult {
  found: boolean;
  processType: string;
  hourlyRate?: number;
  skillLevel?: SkillLevel;
  region?: string;
  message: string;
}

/**
 * Get labor rate for a process type using semantic search
 */
export async function getLaborRate(
  processType: string,
  skillLevel: SkillLevel = "intermediate",
  region: string = "US"
): Promise<LaborRateResult> {
  const rate = await findLaborRate(processType, skillLevel, region);

  if (rate) {
    return {
      found: true,
      processType: rate.processType,
      hourlyRate: rate.hourlyRate,
      skillLevel: rate.skillLevel,
      region: rate.region,
      message: `${rate.processType} (${rate.skillLevel}, ${rate.region}): $${rate.hourlyRate.toFixed(2)}/hour`,
    };
  }

  return {
    found: false,
    processType,
    message: `Labor rate for "${processType}" not found. Using default estimate.`,
  };
}

/**
 * List all labor rates in the database
 */
export async function listAllLaborRates(): Promise<LaborRate[]> {
  return findAllLaborRates();
}

/**
 * Search labor rates using semantic search
 */
export async function searchLaborRates(
  query: string,
  limit: number = 10
): Promise<LaborRate[]> {
  return dbSearchLaborRates(query, limit);
}

/**
 * Get unique process types from the database
 */
export async function getProcessTypes(): Promise<string[]> {
  const rates = await findAllLaborRates();
  return [...new Set(rates.map((r) => r.processType))];
}

/**
 * Calculate total labor cost for a process
 */
export async function calculateLaborCost(
  processType: string,
  hours: number,
  skillLevel: SkillLevel = "intermediate",
  region: string = "US"
): Promise<{ hourlyRate: number; totalCost: number; message: string }> {
  const result = await getLaborRate(processType, skillLevel, region);
  const hourlyRate = result.hourlyRate || 35; // Default rate
  const totalCost = hours * hourlyRate;

  return {
    hourlyRate,
    totalCost,
    message: `${hours} hours × $${hourlyRate.toFixed(2)}/hr = $${totalCost.toFixed(2)}`,
  };
}

// Re-export types
export type { LaborRate, SkillLevel };
