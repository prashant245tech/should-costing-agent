-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to tables (if not already added by Prisma)
-- Note: Prisma schema handles column creation, this is for the extension and indexes

-- Create HNSW indexes for efficient similarity search at scale
-- HNSW (Hierarchical Navigable Small World) is optimal for large datasets
-- Parameters: m=16 (connections per layer), ef_construction=64 (build-time accuracy)

-- MaterialPrice embedding index
CREATE INDEX IF NOT EXISTS material_price_embedding_idx
  ON "MaterialPrice"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- LaborRate embedding index
CREATE INDEX IF NOT EXISTS labor_rate_embedding_idx
  ON "LaborRate"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- HistoricalCost embedding index
CREATE INDEX IF NOT EXISTS historical_cost_embedding_idx
  ON "HistoricalCost"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
