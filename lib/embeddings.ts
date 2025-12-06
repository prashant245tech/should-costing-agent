/**
 * Provider-agnostic embedding abstraction layer
 * Supports Google (text-embedding-004) and OpenAI (text-embedding-3-small) out of the box
 * Follows the same pattern as lib/llm.ts for consistency
 */

// Configuration interface
export interface EmbeddingConfig {
  provider: "google" | "openai";
  apiKey?: string;
  model?: string;
  dimensions?: number;
  baseURL?: string;
}

// Result interface
export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  usage?: { tokens: number };
}

// Provider interface for extensibility
export interface EmbeddingProvider {
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
  getDimensions(): number;
  getModel(): string;
}

// Default configurations per provider
const PROVIDER_DEFAULTS: Record<
  "google" | "openai",
  { model: string; dimensions: number; baseURL: string }
> = {
  google: {
    model: "text-embedding-004",
    dimensions: 768,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
  },
  openai: {
    model: "text-embedding-3-small",
    dimensions: 1536,
    baseURL: "https://api.openai.com/v1",
  },
};

// Google Embedding Provider
class GoogleEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimensions: number;
  private baseURL: string;

  constructor(config: EmbeddingConfig) {
    this.apiKey = config.apiKey || process.env.GOOGLE_API_KEY || "";
    this.model = config.model || PROVIDER_DEFAULTS.google.model;
    this.dimensions = config.dimensions || PROVIDER_DEFAULTS.google.dimensions;
    this.baseURL = config.baseURL || PROVIDER_DEFAULTS.google.baseURL;

    if (!this.apiKey) {
      throw new Error(
        "Google API key is required. Set EMBEDDING_API_KEY or GOOGLE_API_KEY environment variable."
      );
    }
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const url = `${this.baseURL}/models/${this.model}:batchEmbedContents?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${this.model}`,
          content: {
            parts: [{ text }],
          },
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Embedding API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return data.embeddings.map((embedding: { values: number[] }) => ({
      embedding: embedding.values,
      dimensions: embedding.values.length,
      model: this.model,
    }));
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModel(): string {
    return this.model;
  }
}

// OpenAI Embedding Provider
class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimensions: number;
  private baseURL: string;

  constructor(config: EmbeddingConfig) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";
    this.model = config.model || PROVIDER_DEFAULTS.openai.model;
    this.dimensions = config.dimensions || PROVIDER_DEFAULTS.openai.dimensions;
    this.baseURL = config.baseURL || PROVIDER_DEFAULTS.openai.baseURL;

    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key is required. Set EMBEDDING_API_KEY or OPENAI_API_KEY environment variable."
      );
    }
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const url = `${this.baseURL}/embeddings`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
        dimensions: this.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Embedding API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return data.data.map(
      (item: { embedding: number[]; index: number }, index: number) => ({
        embedding: item.embedding,
        dimensions: item.embedding.length,
        model: this.model,
        usage: index === 0 ? { tokens: data.usage?.total_tokens } : undefined,
      })
    );
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModel(): string {
    return this.model;
  }
}

// Default configuration from environment variables
function getDefaultConfig(): EmbeddingConfig {
  const provider = (process.env.EMBEDDING_PROVIDER as "google" | "openai") || "google";
  const defaults = PROVIDER_DEFAULTS[provider];

  return {
    provider,
    apiKey:
      process.env.EMBEDDING_API_KEY ||
      (provider === "google" ? process.env.GOOGLE_API_KEY : process.env.OPENAI_API_KEY),
    model: process.env.EMBEDDING_MODEL || defaults.model,
    dimensions: process.env.EMBEDDING_DIMENSIONS
      ? parseInt(process.env.EMBEDDING_DIMENSIONS, 10)
      : defaults.dimensions,
    baseURL: process.env.EMBEDDING_BASE_URL || defaults.baseURL,
  };
}

// Factory function to create embedding provider
export function createEmbeddingProvider(config?: Partial<EmbeddingConfig>): EmbeddingProvider {
  const mergedConfig = { ...getDefaultConfig(), ...config };

  switch (mergedConfig.provider) {
    case "google":
      return new GoogleEmbeddingProvider(mergedConfig);
    case "openai":
      return new OpenAIEmbeddingProvider(mergedConfig);
    default:
      throw new Error(`Unsupported embedding provider: ${mergedConfig.provider}`);
  }
}

// Singleton instance
let providerInstance: EmbeddingProvider | null = null;

/**
 * Get the singleton embedding provider instance
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  if (!providerInstance) {
    providerInstance = createEmbeddingProvider();
  }
  return providerInstance;
}

/**
 * Reset the singleton instance (useful for testing or config changes)
 */
export function resetEmbeddingProvider(): void {
  providerInstance = null;
}

/**
 * Generate embedding for a single text
 * Convenience function using the singleton provider
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = getEmbeddingProvider();
  const result = await provider.embed(text);
  return result.embedding;
}

/**
 * Generate embeddings for multiple texts
 * Convenience function using the singleton provider
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const provider = getEmbeddingProvider();
  const results = await provider.embedBatch(texts);
  return results.map((r) => r.embedding);
}

/**
 * Get the configured embedding dimensions
 */
export function getEmbeddingDimensions(): number {
  const provider = getEmbeddingProvider();
  return provider.getDimensions();
}

/**
 * Get the configured embedding model name
 */
export function getEmbeddingModel(): string {
  const provider = getEmbeddingProvider();
  return provider.getModel();
}
