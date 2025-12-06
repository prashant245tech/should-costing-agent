"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { FileText, Download, Copy, CheckCircle, Lightbulb } from "lucide-react";

interface CostBreakdown {
  materialsTotal: number;
  laborTotal: number;
  overheadTotal: number;
  grandTotal: number;
  summary: string;
  costSavingOpportunities?: string[];
}

interface FinalReportProps {
  breakdown: CostBreakdown;
  report: string;
  productDescription: string;
}

export function FinalReport({ breakdown, report, productDescription }: FinalReportProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `should-cost-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ["Category", "Amount"],
      ["Materials Total", breakdown.materialsTotal.toFixed(2)],
      ["Labor Total", breakdown.laborTotal.toFixed(2)],
      ["Overhead Total", breakdown.overheadTotal.toFixed(2)],
      ["Grand Total", breakdown.grandTotal.toFixed(2)],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `should-cost-breakdown-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Analysis Complete
            </span>
            <Badge variant="success">Final Report</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Materials</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(breakdown.materialsTotal)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Labor</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(breakdown.laborTotal)}
              </p>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Overhead</p>
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(breakdown.overheadTotal)}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-950/50 dark:to-green-950/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                {formatCurrency(breakdown.grandTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Saving Opportunities */}
      {breakdown.costSavingOpportunities && breakdown.costSavingOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Cost Saving Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {breakdown.costSavingOpportunities.map((opportunity, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{opportunity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Full Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detailed Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="bg-muted/50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({children}) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
                  h3: ({children}) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
                  p: ({children}) => <p className="mb-2">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({children}) => <li className="ml-2">{children}</li>,
                  table: ({children}) => <table className="w-full border-collapse my-3">{children}</table>,
                  thead: ({children}) => <thead className="bg-muted">{children}</thead>,
                  th: ({children}) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
                  td: ({children}) => <td className="border border-border px-3 py-2">{children}</td>,
                  strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                  code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
                }}
              >
                {report}
              </ReactMarkdown>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={handleCopyReport}>
            {copied ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy Report"}
          </Button>
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download MD
          </Button>
          <Button variant="outline" onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default FinalReport;
