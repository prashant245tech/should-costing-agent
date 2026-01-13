import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getClientConfig, getModel, logProviderInfo } from "@/lib/llm";

// Log provider info at startup
logProviderInfo();

// Create OpenAI client with provider-specific configuration
// Uses the same config as lib/llm.ts for consistency
function createOpenAIClient(): OpenAI {
  const config = getClientConfig();

  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    defaultHeaders: config.defaultHeaders,
    defaultQuery: config.defaultQuery,
  };

  // Azure-specific: custom fetch to handle auth headers
  if (config.isAzure) {
    clientOptions.fetch = async (url, init) => {
      const headers = new Headers(init?.headers);
      headers.delete("authorization");
      headers.set("api-key", config.apiKey);

      const urlObj = new URL(url.toString());
      if (!urlObj.searchParams.has("api-version")) {
        urlObj.searchParams.set("api-version", config.defaultQuery?.["api-version"] || "2024-08-01-preview");
      }

      console.log("[CopilotKit LLM] Request to:", urlObj.toString());
      const startTime = Date.now();
      const response = await fetch(urlObj.toString(), { ...init, headers });
      console.log("[CopilotKit LLM] Response:", response.status, "in", Date.now() - startTime, "ms");
      
      return response;
    };
  }

  return new OpenAI(clientOptions);
}

function createServiceAdapter(): OpenAIAdapter {
  const model = getModel();
  console.log("[CopilotKit] Creating adapter with model:", model);

  return new OpenAIAdapter({
    openai: createOpenAIClient() as any,
    model,
  });
}

// Simple runtime - actions are defined client-side via useCopilotAction
const runtime = new CopilotRuntime({
  // No server-side actions - frontend handles actions and updates UI state directly
});

export const POST = async (req: NextRequest) => {
  console.log("\n========== [CopilotKit Request] ==========");
  console.log("[CopilotKit] Model:", getModel());

  // Create fresh adapter for each request
  const serviceAdapter = createServiceAdapter();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  try {
    const response = await handleRequest(req);
    console.log("[CopilotKit] Response status:", response.status);
    return response;
  } catch (error) {
    console.error("[CopilotKit] Error:", error);
    throw error;
  }
};
