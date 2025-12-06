"use client";

import dynamic from "next/dynamic";

// Dynamically import the CostingApp with SSR disabled to avoid prerendering issues with CopilotKit
const CostingApp = dynamic(() => import("@/components/costing-app"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading Should Costing Agent...</p>
      </div>
    </div>
  ),
});

export default function ClientWrapper() {
  return <CostingApp />;
}
