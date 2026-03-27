"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

interface AISetupPromptProps {
  feature: string; // "digitize floor plans" | "generate designs" etc.
  onClose: () => void;
}

export function AISetupPrompt({ feature, onClose }: AISetupPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => { setDismissed(true); onClose(); }} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-ambient-lg max-w-md w-full">
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(111,81,0,0.1), rgba(139,105,20,0.05))" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#6f5100" }}>key</span>
              </span>
              <div>
                <h2 className="text-lg font-bold">AI Provider Required</h2>
                <p className="text-sm text-muted-foreground">
                  To {feature}, you need to connect an AI provider.
                </p>
              </div>
            </div>

            <div className="rounded-xl p-4 space-y-3" style={{ background: "linear-gradient(135deg, rgba(111,81,0,0.06), rgba(139,105,20,0.03))" }}>
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#16a34a" }}>rocket_launch</span>
                Recommended: Google Gemini (Free)
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#16a34a" }}>check</span>
                  No credit card required
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#16a34a" }}>check</span>
                  500 free images per day
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#16a34a" }}>check</span>
                  Floor plan analysis + design generation
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Link
                href="/settings/ai"
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-lg"
                style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>settings</span>
                Set Up AI Provider
              </Link>
              <button
                onClick={() => { setDismissed(true); onClose(); }}
                className="px-4 py-3 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
