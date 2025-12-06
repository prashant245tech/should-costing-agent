import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import OpenAI from "openai";

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;
let serviceAdapterInstance: OpenAIAdapter | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: process.env.LLM_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: process.env.LLM_API_KEY || process.env.GOOGLE_API_KEY || "dummy-key-for-build",
    });
  }
  return openaiClient;
}

function getServiceAdapter(): OpenAIAdapter {
  if (!serviceAdapterInstance) {
    serviceAdapterInstance = new OpenAIAdapter({
      openai: getOpenAIClient(),
      model: process.env.LLM_MODEL || "gemini-2.0-flash",
    });
  }
  return serviceAdapterInstance;
}

// Simple runtime for chat functionality
const runtime = new CopilotRuntime({
  remoteEndpoints: [],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: getServiceAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
