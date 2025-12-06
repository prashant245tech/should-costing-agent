import OpenAI from "openai";

// Centralized LLM configuration using OpenAI-compatible API
// This allows easy switching between providers (OpenAI, Gemini, local models, etc.)

export interface LLMConfig {
  baseURL?: string;
  apiKey?: string;
  model?: string;
}

// Default configuration - uses environment variables
const defaultConfig: LLMConfig = {
  baseURL: process.env.LLM_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.LLM_API_KEY || process.env.GOOGLE_API_KEY,
  model: process.env.LLM_MODEL || "gemini-2.0-flash",
};

// Create OpenAI client with custom base URL for any OpenAI-compatible API
function createClient(config: LLMConfig = {}): OpenAI {
  const mergedConfig = { ...defaultConfig, ...config };

  return new OpenAI({
    baseURL: mergedConfig.baseURL,
    apiKey: mergedConfig.apiKey,
  });
}

// Singleton client instance
let clientInstance: OpenAI | null = null;

function getClient(): OpenAI {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

// Get the configured model name
export function getModel(): string {
  return defaultConfig.model || "gemini-2.0-flash";
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface ChatCompletionResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Send a chat completion request to the LLM
 * Uses OpenAI-compatible API format
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const client = getClient();
  const model = options.model || getModel();

  const response = await client.chat.completions.create({
    model,
    messages: options.messages,
    max_tokens: options.maxTokens,
    temperature: options.temperature,
  });

  const choice = response.choices[0];
  if (!choice || !choice.message?.content) {
    throw new Error("No response content from LLM");
  }

  return {
    content: choice.message.content,
    usage: response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Simple text completion with a single user prompt
 * Convenience wrapper around chatCompletion
 */
export async function complete(prompt: string, options?: Omit<ChatCompletionOptions, "messages">): Promise<string> {
  const result = await chatCompletion({
    messages: [{ role: "user", content: prompt }],
    ...options,
  });
  return result.content;
}

/**
 * Extract JSON from LLM response
 * Handles common patterns where JSON is embedded in text
 */
export function extractJSON<T>(text: string, pattern: "object" | "array" = "object"): T | null {
  try {
    const regex = pattern === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const match = text.match(regex);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    // Try parsing the whole text as JSON
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Reset the client instance (useful for testing or config changes)
 */
export function resetClient(): void {
  clientInstance = null;
}

/**
 * Create a new client with custom configuration
 * Useful for using different providers in different contexts
 */
export function createCustomClient(config: LLMConfig): {
  chatCompletion: (options: ChatCompletionOptions) => Promise<ChatCompletionResult>;
  complete: (prompt: string, options?: Omit<ChatCompletionOptions, "messages">) => Promise<string>;
} {
  const client = createClient(config);
  const model = config.model || getModel();

  return {
    async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
      const response = await client.chat.completions.create({
        model: options.model || model,
        messages: options.messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message?.content) {
        throw new Error("No response content from LLM");
      }

      return {
        content: choice.message.content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    },

    async complete(prompt: string, opts?: Omit<ChatCompletionOptions, "messages">): Promise<string> {
      const result = await this.chatCompletion({
        messages: [{ role: "user", content: prompt }],
        ...opts,
      });
      return result.content;
    },
  };
}
