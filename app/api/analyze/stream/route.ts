import { NextRequest } from "next/server";
import { runAnalysisWithProgress, ProgressCallback } from "@/lib/costing";

// SSE streaming endpoint for real-time progress updates
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const productDescription = searchParams.get("productDescription");
  const aumParam = searchParams.get("aum");
  const aum = aumParam ? parseInt(aumParam, 10) : undefined;

  if (!productDescription) {
    return new Response(
      JSON.stringify({ error: "Product description is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send SSE events
  const sendEvent = async (type: string, data: Record<string, unknown>) => {
    const event = `data: ${JSON.stringify({ type, ...data })}\n\n`;
    await writer.write(encoder.encode(event));
  };

  // Progress callback for analysis steps
  const onProgress: ProgressCallback = async (step, percent, details) => {
    await sendEvent("progress", { step, percent, details });
  };

  // Run analysis in background
  (async () => {
    try {
      const result = await runAnalysisWithProgress(
        productDescription,
        aum,
        onProgress
      );
      await sendEvent("complete", { data: result });
    } catch (error) {
      await sendEvent("error", {
        message: error instanceof Error ? error.message : "Analysis failed",
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
