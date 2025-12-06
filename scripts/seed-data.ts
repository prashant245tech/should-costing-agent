#!/usr/bin/env npx ts-node

/**
 * Script to seed initial data into the database
 *
 * Usage:
 *   npx ts-node scripts/seed-data.ts [--clear]
 *
 * Options:
 *   --clear    Clear existing data before seeding
 */

import prisma from "../lib/prisma";
import {
  SEED_MATERIAL_PRICES,
  SEED_LABOR_RATES,
  SEED_HISTORICAL_COSTS,
} from "../lib/db";
import { Prisma } from "@prisma/client";

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");

  console.log("========================================");
  console.log("  Database Seeding Script");
  console.log("========================================");

  const startTime = Date.now();

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful\n");

    if (shouldClear) {
      console.log("Clearing existing data...");
      await prisma.historicalCost.deleteMany();
      await prisma.laborRate.deleteMany();
      await prisma.materialPrice.deleteMany();
      console.log("Existing data cleared\n");
    }

    // Seed Material Prices
    console.log("Seeding material prices...");
    let materialCount = 0;
    for (const material of SEED_MATERIAL_PRICES) {
      // Check if material already exists
      const existing = await prisma.materialPrice.findFirst({
        where: { materialName: material.materialName },
      });

      if (existing) {
        await prisma.materialPrice.update({
          where: { id: existing.id },
          data: {
            pricePerUnit: material.pricePerUnit,
            unit: material.unit,
            currency: material.currency,
            supplier: material.supplier || null,
            lastUpdated: new Date(),
          },
        });
      } else {
        await prisma.materialPrice.create({
          data: {
            materialName: material.materialName,
            pricePerUnit: material.pricePerUnit,
            unit: material.unit,
            currency: material.currency,
            supplier: material.supplier || null,
            lastUpdated: new Date(),
          },
        });
      }
      materialCount++;
    }
    console.log(`  Seeded ${materialCount} materials`);

    // Seed Labor Rates
    console.log("Seeding labor rates...");
    let laborCount = 0;
    for (const labor of SEED_LABOR_RATES) {
      // Check if labor rate already exists
      const existingRate = await prisma.laborRate.findFirst({
        where: {
          processType: labor.processType,
          region: labor.region,
          skillLevel: labor.skillLevel,
        },
      });

      if (existingRate) {
        await prisma.laborRate.update({
          where: { id: existingRate.id },
          data: {
            hourlyRate: labor.hourlyRate,
            lastUpdated: new Date(),
          },
        });
      } else {
        await prisma.laborRate.create({
          data: {
            processType: labor.processType,
            region: labor.region,
            hourlyRate: labor.hourlyRate,
            skillLevel: labor.skillLevel,
            lastUpdated: new Date(),
          },
        });
      }
      laborCount++;
    }
    console.log(`  Seeded ${laborCount} labor rates`);

    // Seed Historical Costs
    console.log("Seeding historical costs...");
    let costCount = 0;
    for (const cost of SEED_HISTORICAL_COSTS) {
      const existingCost = await prisma.historicalCost.findFirst({
        where: {
          productName: cost.productName,
        },
      });

      // Cast breakdown to InputJsonValue
      const breakdownJson = cost.breakdown as Prisma.InputJsonValue;

      if (existingCost) {
        await prisma.historicalCost.update({
          where: { id: existingCost.id },
          data: {
            productDescription: cost.productDescription,
            totalCost: cost.totalCost,
            breakdown: breakdownJson,
          },
        });
      } else {
        await prisma.historicalCost.create({
          data: {
            productName: cost.productName,
            productDescription: cost.productDescription,
            totalCost: cost.totalCost,
            breakdown: breakdownJson,
            userId: cost.userId || null,
          },
        });
      }
      costCount++;
    }
    console.log(`  Seeded ${costCount} historical costs`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n========================================");
    console.log("  Seeding Complete!");
    console.log("========================================");
    console.log(`Materials: ${materialCount}`);
    console.log(`Labor rates: ${laborCount}`);
    console.log(`Historical costs: ${costCount}`);
    console.log(`\nTotal time: ${elapsed}s`);

  } catch (error) {
    console.error("\nError during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
