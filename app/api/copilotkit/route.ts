import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import OpenAI from "openai";

// Request counter for debugging
let requestCount = 0;
let llmCallCount = 0;

// Create fresh instances on each request in development to pick up env changes
// In production, we could cache these
function createOpenAIClient(): OpenAI {
  const baseURL = process.env.LLM_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/";
  const apiKey = process.env.LLM_API_KEY || process.env.GOOGLE_API_KEY || "dummy-key-for-build";

  console.log("[CopilotKit] OpenAI client config:", {
    baseURL,
    apiKeyPrefix: apiKey.substring(0, 10) + "...",
  });

  // Create client with fetch interceptor to log requests
  const client = new OpenAI({
    baseURL,
    apiKey,
    fetch: async (url, init) => {
      llmCallCount++;
      const callId = llmCallCount;

      console.log(`\n>>>>>> [LLM Call #${callId}] <<<<<<`);
      console.log(`[LLM #${callId}] URL:`, url);
      console.log(`[LLM #${callId}] Method:`, init?.method);
      console.log(`[LLM #${callId}] Headers:`, JSON.stringify(init?.headers, null, 2));

      // Log request body
      if (init?.body) {
        try {
          const bodyStr = typeof init.body === 'string' ? init.body : init.body.toString();
          const bodyJson = JSON.parse(bodyStr);
          console.log(`[LLM #${callId}] Request Body:`, JSON.stringify({
            model: bodyJson.model,
            messages: bodyJson.messages?.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content?.substring(0, 200) + (m.content?.length > 200 ? '...' : '')
            })),
            stream: bodyJson.stream,
            max_tokens: bodyJson.max_tokens,
          }, null, 2));
        } catch (e) {
          console.log(`[LLM #${callId}] Request Body (raw):`, init.body);
        }
      }

      // Make the actual request
      const startTime = Date.now();
      const response = await fetch(url, init);
      const elapsed = Date.now() - startTime;

      console.log(`[LLM #${callId}] Response Status:`, response.status, response.statusText);
      console.log(`[LLM #${callId}] Response Time:`, elapsed, 'ms');
      console.log(`[LLM #${callId}] Response Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      // If error, try to log response body
      if (!response.ok) {
        const clonedResponse = response.clone();
        try {
          const errorBody = await clonedResponse.text();
          console.log(`[LLM #${callId}] Error Response Body:`, errorBody);
        } catch (e) {
          console.log(`[LLM #${callId}] Could not read error body`);
        }
      }

      return response;
    },
  });

  return client;
}

function createServiceAdapter(): OpenAIAdapter {
  const model = process.env.LLM_MODEL || "gemini-2.0-flash";
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
  console.log(`[Request #${currentRequest}] Timestamp:`, new Date().toISOString());
  console.log(`[Request #${currentRequest}] URL:`, req.url);

  // Log environment variables being used
  console.log(`[Request #${currentRequest}] ENV LLM_MODEL:`, process.env.LLM_MODEL);
  console.log(`[Request #${currentRequest}] ENV LLM_BASE_URL:`, process.env.LLM_BASE_URL);

  // Create fresh adapter for each request (to pick up env changes in dev)
  const serviceAdapter = createServiceAdapter();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  try {
    console.log(`[Request #${currentRequest}] Calling handleRequest...`);
    const response = await handleRequest(req);
    console.log(`[Request #${currentRequest}] Response status:`, response.status);
    return response;
  } catch (error) {
    console.error(`[Request #${currentRequest}] Error:`, error);
    throw error;
  }
};
