"use client";

import { useTranslations } from "next-intl";

interface GenerationProgressProps {
  style: string;
}

export function GenerationProgress({ style }: GenerationProgressProps) {
  const t = useTranslations("designs");

  return (
    <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30">
      <div className="w-full h-48 bg-muted rounded-lg animate-pulse mb-4" />
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce [animation-delay:150ms]" />
        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {t("generating")} {style}...
      </p>
    </div>
  );
}
