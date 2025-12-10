import { NextRequest, NextResponse } from "next/server";
import { runAnalysis, generateApprovalReport } from "@/lib/costing";

// POST /api/analyze - Run Ex-Works cost analysis
export async function POST(req: NextRequest) {
  try {
    const { productDescription, action, currentState, aum } = await req.json();

    // Handle approval action
    if (action === "approve" && currentState) {
      const report = await generateApprovalReport(currentState);
      return NextResponse.json(report);
    }

    // Validate input
    if (!productDescription) {
      return NextResponse.json(
        { error: "Product description is required" },
        { status: 400 }
      );
    }

    // Run full analysis
    const result = await runAnalysis(productDescription, aum);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in cost analysis:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
