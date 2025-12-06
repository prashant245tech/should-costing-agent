import { findLaborRate, findAllLaborRates, LaborRate, SkillLevel } from "@/lib/db";

export interface LaborRateResult {
  found: boolean;
  processType: string;
  hourlyRate?: number;
  skillLevel?: SkillLevel;
  region?: string;
  message: string;
}

export function getLaborRate(
  processType: string,
  skillLevel: SkillLevel = "intermediate",
  region: string = "US"
): LaborRateResult {
  const rate = findLaborRate(processType, skillLevel, region);
  
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

  // Try to find any matching process type
  const allRates = findAllLaborRates();
  const searchTerm = processType.toLowerCase();
  const partialMatch = allRates.find(r => 
    r.processType.toLowerCase().includes(searchTerm) ||
    searchTerm.includes(r.processType.toLowerCase())
  );

  if (partialMatch) {
    return {
      found: true,
      processType: partialMatch.processType,
      hourlyRate: partialMatch.hourlyRate,
      skillLevel: partialMatch.skillLevel,
      region: partialMatch.region,
      message: `Found similar: ${partialMatch.processType} (${partialMatch.skillLevel}): $${partialMatch.hourlyRate.toFixed(2)}/hour`,
    };
  }

  return {
    found: false,
    processType,
    message: `Labor rate for "${processType}" not found. Using default estimate.`,
  };
}

export function listAllLaborRates(): LaborRate[] {
  return findAllLaborRates();
}

export function getProcessTypes(): string[] {
  const rates = findAllLaborRates();
  return [...new Set(rates.map(r => r.processType))];
}

export function calculateLaborCost(
  processType: string,
  hours: number,
  skillLevel: SkillLevel = "intermediate",
  region: string = "US"
): { hourlyRate: number; totalCost: number; message: string } {
  const result = getLaborRate(processType, skillLevel, region);
  const hourlyRate = result.hourlyRate || 35; // Default rate
  const totalCost = hours * hourlyRate;

  return {
    hourlyRate,
    totalCost,
    message: `${hours} hours × $${hourlyRate.toFixed(2)}/hr = $${totalCost.toFixed(2)}`,
  };
}
