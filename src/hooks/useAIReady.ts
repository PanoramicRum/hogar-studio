"use client";

import { useEffect, useState } from "react";

interface ProviderStatus {
  id: string;
  configured: boolean;
  capabilities: string[];
}

interface KeyStatus {
  configured: boolean;
}

export function useAIReady() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/ai/providers").then((r) => r.json()),
      fetch("/api/settings/ai").then((r) => r.json()).catch(() => null),
    ]).then(([provData, settingsData]) => {
      if (!Array.isArray(provData)) { setLoaded(true); return; }

      // Merge: a provider is configured if env var OR user key is set
      const userKeys: Record<string, KeyStatus> = settingsData?.keys || settingsData || {};

      const merged = provData.map((p: ProviderStatus) => {
        const userKey = userKeys[p.id] as KeyStatus | undefined;
        return {
          ...p,
          configured: p.configured || (userKey?.configured ?? false),
        };
      });

      setProviders(merged);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const hasAnyProvider = providers.some((p) => p.configured);
  const hasDigitization = providers.some((p) => p.configured && p.capabilities.includes("digitization"));
  const hasGeneration = providers.some((p) => p.configured && p.capabilities.includes("generation"));

  return { loaded, hasAnyProvider, hasDigitization, hasGeneration, providers };
}
