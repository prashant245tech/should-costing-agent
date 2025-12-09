import OpenAI from "openai";

// Centralized LLM configuration using OpenAI-compatible API
// Supports: Azure AI Foundry, Google Gemini, OpenAI, Ollama, etc.

export type LLMProvider = "azure" | "gemini" | "openai" | "ollama" | "custom";

export interface LLMConfig {
  provider?: LLMProvider;
  baseURL?: string;
  apiKey?: string;
  model?: string;
  // Azure-specific
  azureApiVersion?: string;
  azureDeployment?: string;
}

// Provider-specific configurations
const PROVIDER_DEFAULTS: Record<LLMProvider, Partial<LLMConfig>> = {
  azure: {
    azureApiVersion: "2024-02-15-preview",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-2.0-flash",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  ollama: {
    baseURL: "http://localhost:11434/v1",
    model: "llama3.2",
  },
  custom: {},
};

// Detect provider from environment or URL
function detectProvider(): LLMProvider {
  const explicit = process.env.LLM_PROVIDER as LLMProvider;
  if (explicit && PROVIDER_DEFAULTS[explicit]) return explicit;

  const baseURL = process.env.LLM_BASE_URL || "";
  if (baseURL.includes("azure.com") || baseURL.includes("services.ai.azure")) return "azure";
  if (baseURL.includes("googleapis.com") || process.env.GOOGLE_API_KEY) return "gemini";
  if (baseURL.includes("openai.com")) return "openai";
  if (baseURL.includes("localhost:11434")) return "ollama";

  return "gemini"; // Default fallback
}

// Build configuration from environment variables
function buildConfig(): LLMConfig {
  const provider = detectProvider();
  const providerDefaults = PROVIDER_DEFAULTS[provider];

  return {
    provider,
    baseURL: process.env.LLM_BASE_URL || providerDefaults.baseURL,
    apiKey: process.env.LLM_API_KEY || process.env.GOOGLE_API_KEY || process.env.AZURE_API_KEY,
    model: process.env.LLM_MODEL || providerDefaults.model,
    azureApiVersion: process.env.AZURE_API_VERSION || providerDefaults.azureApiVersion,
    azureDeployment: process.env.AZURE_DEPLOYMENT,
  };
}

// Create OpenAI client with provider-specific configuration
export function createClient(config: LLMConfig = {}): OpenAI {
  const mergedConfig = { ...buildConfig(), ...config };
  const isAzure = mergedConfig.provider === "azure";

  let baseURL = mergedConfig.baseURL || "";

  if (isAzure && baseURL) {
    // Remove /chat/completions if present (OpenAI SDK will add it)
    baseURL = baseURL.replace(/\/chat\/completions\/?$/i, "").replace(/\/+$/, "");
  }

  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {
    baseURL,
    apiKey: mergedConfig.apiKey,
  };

  // Azure-specific configuration
  if (isAzure) {
    clientOptions.defaultHeaders = {
      "api-key": mergedConfig.apiKey || "",
    };
    clientOptions.defaultQuery = {
      "api-version": mergedConfig.azureApiVersion || "2024-08-01-preview",
    };
  }

  return new OpenAI(clientOptions);
}

// Get client configuration (for CopilotKit and other integrations)
export function getClientConfig(): {
  baseURL: string;
  apiKey: string;
  defaultHeaders?: Record<string, string>;
  defaultQuery?: Record<string, string>;
  isAzure: boolean;
} {
  const config = buildConfig();
  const isAzure = config.provider === "azure";
  let baseURL = config.baseURL || "";

  if (isAzure && baseURL) {
    baseURL = baseURL.replace(/\/chat\/completions\/?$/i, "").replace(/\/+$/, "");
  }

  const result: ReturnType<typeof getClientConfig> = {
    baseURL,
    apiKey: config.apiKey || "",
    isAzure,
  };

  if (isAzure) {
    result.defaultHeaders = {
      "api-key": config.apiKey || "",
    };
    result.defaultQuery = {
      "api-version": config.azureApiVersion || "2024-08-01-preview",
    };
  }

  return result;
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
  const config = buildConfig();
  return config.model || "gemini-2.0-flash";
}

// Get current provider info (useful for debugging/logging)
export function getProviderInfo(): { provider: LLMProvider; model: string; baseURL: string } {
  const config = buildConfig();
  return {
    provider: config.provider || "gemini",
    model: config.model || "gemini-2.0-flash",
    baseURL: config.baseURL || "",
  };
}

// Log provider info at startup (call once)
let hasLoggedProvider = false;
export function logProviderInfo(): void {
  if (hasLoggedProvider) return;
  hasLoggedProvider = true;
  const info = getProviderInfo();
  console.log(`🤖 LLM Provider: ${info.provider.toUpperCase()} | Model: ${info.model}`);
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

  // GPT-5 series uses max_completion_tokens instead of max_tokens
  // and supports reasoning_effort to control thinking depth
  const isGPT5 = model.toLowerCase().includes('gpt-5');

  const requestParams: Parameters<typeof client.chat.completions.create>[0] = {
    model,
    messages: options.messages,
    temperature: options.temperature,
  };

  // Use appropriate token limit parameter based on model
  if (isGPT5) {
    (requestParams as any).max_completion_tokens = options.maxTokens;
    // Set reasoning effort to low to minimize thinking tokens
    (requestParams as any).reasoning_effort = "low";
  } else {
    requestParams.max_tokens = options.maxTokens;
  }


  const response = await client.chat.completions.create(requestParams) as OpenAI.Chat.Completions.ChatCompletion;

  const choice = response.choices[0];

  // GPT-5 models may return content in different fields
  // Check message.content first, then try reasoning models' output field
  let content = choice?.message?.content;

  // For reasoning models like o1/gpt-5, response might be in different format
  if (!content && choice?.message) {
    // Try to get content from any available field
    const msg = choice.message as any;
    content = msg.content || msg.reasoning_content || msg.text || '';
  }

  if (!content) {
    console.error("LLM Response:", JSON.stringify(response, null, 2));
    throw new Error("No response content from LLM");
  }

  return {
    content,
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
