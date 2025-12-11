"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DenseBOMTableProps {
    items: {
        component: string;
        material: string;
        quantity: number;
        unit: string;
        pricePerUnit: number;
        totalCost: number;
    }[];
    totalCost: number;
}

export function DenseBOMTable({ items, totalCost }: DenseBOMTableProps) {
    // Sort by total cost descending by default
    const sortedItems = [...items].sort((a, b) => b.totalCost - a.totalCost);

    return (
        <Card className="h-full w-full border">
            <CardHeader className="py-3 px-4 border-b bg-muted/40">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        Cost Engineering Grid (BOM)
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                        {items.length} Items
                    </Badge>
                </div>
            </CardHeader>
            <div className="overflow-auto max-h-[500px]">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[30%] text-xs font-semibold h-9">COMPONENT</TableHead>
                            <TableHead className="w-[20%] text-xs font-semibold h-9">MATERIAL SPEC</TableHead>
                            <TableHead className="w-[15%] text-right text-xs font-semibold h-9">QTY</TableHead>
                            <TableHead className="w-[15%] text-right text-xs font-semibold h-9">PRICE</TableHead>
                            <TableHead className="w-[15%] text-right text-xs font-semibold h-9 cursor-pointer hover:bg-muted/80">
                                <div className="flex items-center justify-end gap-1">
                                    TOTAL <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[5%] text-right text-xs font-semibold h-9">%</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedItems.map((item, idx) => {
                            const percentage = totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0;
                            return (
                                <TableRow key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 h-8 border-b-0">
                                    <TableCell className="py-1 text-sm font-medium text-foreground truncate max-w-[200px]" title={item.component}>
                                        {item.component}
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-muted-foreground truncate max-w-[150px]" title={item.material}>
                                        {item.material}
                                    </TableCell>
                                    <TableCell className="py-1 text-right text-sm font-mono-numbers text-muted-foreground">
                                        {item.quantity} <span className="text-[10px] text-muted-foreground/70">{item.unit}</span>
                                    </TableCell>
                                    <TableCell className="py-1 text-right text-sm font-mono-numbers text-muted-foreground">
                                        ${item.pricePerUnit.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="py-1 text-right text-sm font-mono-numbers font-semibold">
                                        ${item.totalCost.toFixed(4)}
                                    </TableCell>
                                    <TableCell className="py-1 text-right text-xs font-mono-numbers text-muted-foreground">
                                        {percentage.toFixed(1)}%
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {/* Summary Row */}
                        <TableRow className="bg-muted/30 border-t-2 border-border font-bold">
                            <TableCell className="py-2">TOTAL</TableCell>
                            <TableCell className="py-2 text-xs text-muted-foreground">
                                Excl. Add-ons
                            </TableCell>
                            <TableCell className="py-2" colSpan={2}></TableCell>
                            <TableCell className="py-2 text-right font-mono-numbers">
                                ${items.reduce((sum, i) => sum + i.totalCost, 0).toFixed(4)}
                            </TableCell>
                            <TableCell className="py-2 text-right">100%</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
