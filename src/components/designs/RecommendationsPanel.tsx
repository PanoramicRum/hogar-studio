"use client";

import { useState } from "react";
import { useGuest } from "@/components/providers/GuestProvider";
import { toast } from "sonner";

interface Recommendation {
  title: string;
  description: string;
  category: string;
  priority: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  layout: "grid_view",
  color: "palette",
  furniture: "chair",
  lighting: "light",
  decor: "potted_plant",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200",
  low: "bg-gray-100 text-gray-600",
};

interface RecommendationsPanelProps {
  projectId: string;
}

export function RecommendationsPanel({ projectId }: RecommendationsPanelProps) {
  const { isGuest } = useGuest();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  async function handleGetRecommendations() {
    setLoading(true);
    setDismissed(new Set());

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isGuest) headers["x-guest-mode"] = "true";

    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers,
        body: JSON.stringify({ projectId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRecommendations(data);
          setExpanded(true);
        }
      } else {
        toast.error("Failed to get recommendations");
      }
    } catch {
      toast.error("Failed to get recommendations");
    }
    setLoading(false);
  }

  const visibleRecs = recommendations.filter((_, i) => !dismissed.has(i));

  return (
    <div className="rounded-xl surface-container-low overflow-hidden">
      <button
        onClick={() => recommendations.length > 0 ? setExpanded(!expanded) : handleGetRecommendations()}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#6f5100" }}>auto_awesome</span>
        <span className="font-semibold text-sm flex-1">AI Recommendations</span>
        {recommendations.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full surface-container-high">{visibleRecs.length}</span>
        )}
        <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: "18px" }}>
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 py-4 justify-center text-sm text-muted-foreground">
              <span className="material-symbols-outlined animate-pulse" style={{ fontSize: "16px" }}>auto_awesome</span>
              Analyzing your design...
            </div>
          )}

          {visibleRecs.map((rec, i) => (
            <div key={i} className="rounded-lg surface-container p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "16px", color: "#6f5100" }}>
                  {CATEGORY_ICONS[rec.category] || "lightbulb"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs">{rec.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${PRIORITY_STYLES[rec.priority] || ""}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                </div>
                <button onClick={() => setDismissed(new Set([...dismissed, i]))}
                  className="p-0.5 rounded hover:bg-muted shrink-0">
                  <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: "14px" }}>close</span>
                </button>
              </div>
            </div>
          ))}

          {!loading && (
            <button
              onClick={handleGetRecommendations}
              className="w-full py-2 text-xs font-medium rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
              style={{ color: "#6f5100" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>refresh</span>
              {recommendations.length > 0 ? "Refresh suggestions" : "Get AI Suggestions"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
