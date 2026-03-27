"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PackageInfo {
  id: string;
  name: string;
  type: string;
  version: string;
  description: string;
  author: { name: string; url?: string };
  license: string;
  tags?: string[];
  styleCount: number;
  furnitureCount: number;
}

export function PackageCard({ pkg }: { pkg: PackageInfo }) {
  const typeBadgeColor = {
    style: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
    furniture: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
    bundle: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200",
  }[pkg.type] || "bg-gray-100 text-gray-800";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{pkg.name}</CardTitle>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${typeBadgeColor}`}>
            {pkg.type}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          v{pkg.version} by {pkg.author.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{pkg.description}</p>

        <div className="flex gap-3 text-xs text-muted-foreground">
          {pkg.styleCount > 0 && (
            <span>{pkg.styleCount} style{pkg.styleCount !== 1 ? "s" : ""}</span>
          )}
          {pkg.furnitureCount > 0 && (
            <span>{pkg.furnitureCount} furniture type{pkg.furnitureCount !== 1 ? "s" : ""}</span>
          )}
        </div>

        {pkg.tags && pkg.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pkg.tags.map((tag) => (
              <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/60">{pkg.license}</p>
      </CardContent>
    </Card>
  );
}
