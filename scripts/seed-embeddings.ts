#!/usr/bin/env npx ts-node

/**
 * Script to seed/sync embeddings for all entities
 *
 * Usage:
 *   npx ts-node scripts/seed-embeddings.ts [--resync] [--batch-size=100]
 *
 * Options:
 *   --resync       Clear existing embeddings and regenerate all
 *   --batch-size   Number of items to process per batch (default: 100)
 */

import {
  syncAllMaterialEmbeddings,
  syncAllLaborRateEmbeddings,
  syncAllHistoricalCostEmbeddings,
  resyncAllEmbeddings,
} from "../lib/embedding-sync";
import { getEmbeddingProvider } from "../lib/embeddings";

async function main() {
  const args = process.argv.slice(2);
  const shouldResync = args.includes("--resync");

  // Parse batch size from args
  const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size="));
  const batchSize = batchSizeArg
    ? parseInt(batchSizeArg.split("=")[1], 10)
    : 100;

  console.log("========================================");
  console.log("  Embedding Sync Script");
  console.log("========================================");

  // Display configuration
  const provider = getEmbeddingProvider();
  console.log(`Provider: ${provider.getModel()}`);
  console.log(`Dimensions: ${provider.getDimensions()}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Mode: ${shouldResync ? "Full resync (clear + regenerate)" : "Incremental (new only)"}`);
  console.log("----------------------------------------");

  const startTime = Date.now();

  try {
    if (shouldResync) {
      // Full resync - clears all embeddings and regenerates
      console.log("\nPerforming full resync...\n");
      const results = await resyncAllEmbeddings(batchSize);

      console.log("\n========================================");
      console.log("  Resync Complete!");
      console.log("========================================");
      console.log(`Materials processed: ${results.materials}`);
      console.log(`Labor rates processed: ${results.laborRates}`);
      console.log(`Historical costs processed: ${results.historicalCosts}`);
    } else {
      // Incremental sync - only new items without embeddings
      console.log("\nSyncing material embeddings...");
      const materialsCount = await syncAllMaterialEmbeddings(batchSize);

      console.log("\nSyncing labor rate embeddings...");
      const laborRatesCount = await syncAllLaborRateEmbeddings(batchSize);

      console.log("\nSyncing historical cost embeddings...");
      const historicalCostsCount = await syncAllHistoricalCostEmbeddings(batchSize);

      console.log("\n========================================");
      console.log("  Sync Complete!");
      console.log("========================================");
      console.log(`Materials processed: ${materialsCount}`);
      console.log(`Labor rates processed: ${laborRatesCount}`);
      console.log(`Historical costs processed: ${historicalCostsCount}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nTotal time: ${elapsed}s`);
    console.log("----------------------------------------");

  } catch (error) {
    console.error("\nError during embedding sync:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
