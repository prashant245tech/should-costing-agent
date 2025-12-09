import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingDown, Target, Zap } from "lucide-react";

interface SubComponent {
    name: string;
    cost: number;
    percentage: number;
    description?: string;
}

interface CategoryDetailPanelProps {
    categoryName: string;
    totalCost: number;
    currency: string;
    color: string;
    subComponents?: Record<string, SubComponent>;
    negotiationPoints?: string[];
    description?: string;
    onClose?: () => void;
}

export function CategoryDetailPanel({
    categoryName,
    totalCost,
    currency,
    color,
    subComponents,
    negotiationPoints,
    description,
    onClose
}: CategoryDetailPanelProps) {
    const subComponentList = subComponents ? Object.values(subComponents) : [];

    // Sort by cost descending
    const sortedComponents = [...subComponentList].sort((a, b) => b.cost - a.cost);

    return (
        <Card className="h-full border-l-4 shadow-sm" style={{ borderLeftColor: color }}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            {categoryName}
                            <Badge variant="outline" className="font-mono font-normal">
                                {currency}{totalCost.toFixed(4)}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                            {description || `Detailed breakdown of ${categoryName.toLowerCase()} costs.`}
                        </CardDescription>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6 overflow-y-auto h-[400px] pr-2">
                {/* Cost Drivers Table */}
                {sortedComponents.length > 0 ? (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <TrendingDown className="w-4 h-4 text-blue-500" />
                            Primary Cost Drivers
                        </h4>
                        <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-950/50">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="text-left py-2 px-3 font-medium w-1/2">Driver</th>
                                        <th className="text-right py-2 px-3 font-medium">Cost</th>
                                        <th className="text-right py-2 px-3 font-medium">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {sortedComponents.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                            <td className="py-2 px-3">
                                                <div className="font-medium">{item.name}</div>
                                                {item.description && (
                                                    <div className="text-xs text-muted-foreground line-clamp-1" title={item.description}>
                                                        {item.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-right py-2 px-3 font-mono text-xs">
                                                {currency}{item.cost.toFixed(4)}
                                            </td>
                                            <td className="text-right py-2 px-3 text-xs text-muted-foreground">
                                                {(item.percentage * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg dashed border border-muted">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No detailed sub-component data available for this category.</p>
                    </div>
                )}

                {/* Negotiation Strategy */}
                {negotiationPoints && negotiationPoints.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <Target className="w-4 h-4 text-green-600 dark:text-green-500" />
                            Negotiation Strategy
                        </h4>
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900 rounded-lg p-3">
                            <ul className="space-y-2">
                                {negotiationPoints.map((point, i) => (
                                    <li key={i} className="text-sm flex gap-2 items-start text-green-900 dark:text-green-100">
                                        <Zap className="w-3 h-3 mt-1 text-green-600 shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
