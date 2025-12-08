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

// Request counter for debugging
let requestCount = 0;
let llmCallCount = 0;

// Create fresh instances on each request in development to pick up env changes
function createOpenAIClient(): OpenAI {
  const config = getClientConfig();

  return new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    defaultHeaders: config.defaultHeaders,
    defaultQuery: config.defaultQuery,
    fetch: async (url, init) => {
      llmCallCount++;
      const callId = llmCallCount;

      // Clone init to modify
      const modifiedInit = { ...init };
      const headers = new Headers(init?.headers);

      // For Azure, replace Bearer token with api-key header
      if (config.isAzure) {
        headers.delete("authorization");
        headers.set("api-key", config.apiKey);

        // Add api-version to URL if not present
        const urlObj = new URL(url.toString());
        if (!urlObj.searchParams.has("api-version")) {
          urlObj.searchParams.set("api-version", config.defaultQuery?.["api-version"] || "2024-08-01-preview");
        }
        url = urlObj.toString();

        // GPT-5 models need max_completion_tokens instead of max_tokens
        if (init?.body && getModel().toLowerCase().includes("gpt-5")) {
          try {
            const bodyStr = typeof init.body === 'string' ? init.body : init.body.toString();
            const bodyJson = JSON.parse(bodyStr);
            if (bodyJson.max_tokens && !bodyJson.max_completion_tokens) {
              bodyJson.max_completion_tokens = bodyJson.max_tokens;
              delete bodyJson.max_tokens;
              modifiedInit.body = JSON.stringify(bodyJson);
            }
          } catch (e) {
            // Keep original body if parsing fails
          }
        }
      }

      modifiedInit.headers = headers;

      console.log(`\n>>>>>> [LLM Call #${callId}] <<<<<<`);
      console.log(`[LLM #${callId}] URL:`, url);
      console.log(`[LLM #${callId}] Azure Mode:`, config.isAzure);

      const startTime = Date.now();
      const response = await fetch(url, modifiedInit);
      const elapsed = Date.now() - startTime;

      console.log(`[LLM #${callId}] Response Status:`, response.status, response.statusText);
      console.log(`[LLM #${callId}] Response Time:`, elapsed, 'ms');

      if (!response.ok) {
        const clonedResponse = response.clone();
        try {
          const errorBody = await clonedResponse.text();
          console.log(`[LLM #${callId}] Error:`, errorBody);
        } catch (e) {
          // ignore
        }
      }

      return response;
    },
  });
}

function createServiceAdapter(): OpenAIAdapter {
  const model = getModel();
  console.log("[CopilotKit] Creating adapter with model:", model);

  return new OpenAIAdapter({
    openai: createOpenAIClient(),
    model,
  });
}

// Simple runtime for chat functionality
const runtime = new CopilotRuntime({
  remoteEndpoints: [],
});

export const POST = async (req: NextRequest) => {
  requestCount++;
  const currentRequest = requestCount;

  console.log(`\n========== [CopilotKit Request #${currentRequest}] ==========`);
  console.log(`[Request #${currentRequest}] Model:`, getModel());

  // Create fresh adapter for each request
  const serviceAdapter = createServiceAdapter();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  try {
    const response = await handleRequest(req);
    console.log(`[Request #${currentRequest}] Response status:`, response.status);
    return response;
  } catch (error) {
    console.error(`[Request #${currentRequest}] Error:`, error);
    throw error;
  }
};
