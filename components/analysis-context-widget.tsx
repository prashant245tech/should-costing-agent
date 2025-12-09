import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface AnalysisContextWidgetProps {
    description: string;
}

export function AnalysisContextWidget({ description }: AnalysisContextWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper to format the messy text into readable sections
    const formatDescription = (text: string) => {
        // Known keys to look for to split sections
        const keys = [
            "Key raw materials:",
            "Manufacturing steps:",
            "Packaging:",
            "Food-safety/quality:",
            "Typical single-serve",
            "Shelf life"
        ];

        // Simple heuristic: split by periods, but check if lines start with keys
        // A better approach for the "Key X: Y" pattern is to replace the key with a bold element

        let formattedHtml = text;

        // enhance keys
        keys.forEach(key => {
            const regex = new RegExp(`(${key})`, 'gi');
            formattedHtml = formattedHtml.replace(regex, '<br/><br/><strong class="text-foreground">$1</strong>');
        });

        // Clean up initial breaks if any
        if (formattedHtml.startsWith('<br/><br/>')) {
            formattedHtml = formattedHtml.substring(10);
        }

        return (
            <div
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formattedHtml }}
            />
        );
    };

    return (
        <Card className="transition-all duration-200">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Analysis Context
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 p-0"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isExpanded ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        {formatDescription(description)}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
