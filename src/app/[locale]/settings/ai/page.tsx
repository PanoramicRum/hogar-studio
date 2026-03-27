"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useGuest } from "@/components/providers/GuestProvider";
import { AIProviderCard } from "@/components/settings/AIProviderCard";
import { toast } from "sonner";

interface ProviderInfo {
  id: string;
  name: string;
  configured: boolean;
  capabilities: string[];
  model?: string;
  pricing?: string;
  recommended?: boolean;
}

interface KeyStatus {
  configured: boolean;
  masked: string | null;
  source: "env" | "user" | null;
}

const PROVIDER_META: Record<string, { description: string; icon: string }> = {
  replicate: { description: "SDXL + ControlNet for AI interior design renders", icon: "image" },
  openai: { description: "GPT-4o-mini vision + DALL-E 3 for generation", icon: "psychology" },
  anthropic: { description: "Claude Haiku for floor plan analysis", icon: "smart_toy" },
  gemini: { description: "Gemini 2.5 Flash for digitization and analysis", icon: "diamond" },
  local: { description: "OpenAI-compatible local model (ComfyUI, Automatic1111)", icon: "computer" },
};

export default function AIProvidersPage() {
  const { data: session, status } = useSession();
  const { isGuest } = useGuest();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [keyStatus, setKeyStatus] = useState<Record<string, KeyStatus>>({});
  const [defaults, setDefaults] = useState({ digitizer: "auto", generator: "auto" });
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const isAuthenticated = !!session?.user;

  const fetchData = useCallback(async () => {
    const [provRes, settingsRes] = await Promise.all([
      fetch("/api/ai/providers"),
      fetch("/api/settings/ai"),
    ]);
    const provData = await provRes.json();
    const settingsData = await settingsRes.json();
    if (Array.isArray(provData)) setProviders(provData);
    if (settingsData && !settingsData.error) {
      setKeyStatus(settingsData.keys || {});
      setDefaults(settingsData.defaults || { digitizer: "auto", generator: "auto" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isGuest && status === "unauthenticated") { router.push("/login"); return; }
    if (!isGuest && status !== "authenticated") return;
    fetchData();
  }, [status, router, isGuest, fetchData]);

  async function handleSave(provider: string, key: string) {
    const res = await fetch("/api/settings/ai", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    setKeyStatus(data.keys || {});
    setDefaults(data.defaults || defaults);
    await refreshProviders();
  }

  async function handleRemove(provider: string) {
    const res = await fetch("/api/settings/ai", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    setKeyStatus(data.keys || {});
    setDefaults(data.defaults || defaults);
    await refreshProviders();
  }

  async function handleDefaultChange(type: "digitizer" | "generator", value: string) {
    const body = type === "digitizer" ? { defaultDigitizer: value } : { defaultGenerator: value };
    const res = await fetch("/api/settings/ai", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setDefaults(data.defaults || defaults);
      toast.success(`Default ${type} updated`);
    }
  }

  async function refreshProviders() {
    const res = await fetch("/api/ai/providers");
    const data = await res.json();
    if (Array.isArray(data)) setProviders(data);
  }

  const configuredProviders = providers.filter((p) => {
    const ks = keyStatus[p.id] as KeyStatus | undefined;
    return ks?.configured || p.configured;
  });

  const digitizationProviders = providers.filter((p) => p.capabilities.includes("digitization"));
  const generationProviders = providers.filter((p) => p.capabilities.includes("generation"));
  const hasAnyConfigured = configuredProviders.length > 0;

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI Providers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect AI services and choose your preferred providers for each task.
        </p>
      </div>

      {/* Start for free banner */}
      {!hasAnyConfigured && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "linear-gradient(135deg, rgba(111,81,0,0.08), rgba(139,105,20,0.05))" }}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#6f5100" }}>rocket_launch</span>
            <div>
              <h2 className="text-lg font-bold">Start for free</h2>
              <p className="text-sm text-muted-foreground">
                Get a free Gemini API key — no credit card. Covers digitization + design generation (500 images/day).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {["Free tier", "No credit card", "500 images/day", "Floor plan analysis"].map((t) => (
              <span key={t} className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#16a34a" }}>check_circle</span> {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Default Provider Selection */}
      {hasAnyConfigured && isAuthenticated && (
        <div className="rounded-xl surface-container-low p-5 space-y-5">
          <div>
            <h2 className="font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6f5100" }}>tune</span>
              Default Providers
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Choose which AI provider to use by default. You can override per-request.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Digitization default */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Floor Plan Digitization
              </label>
              <select
                value={defaults.digitizer}
                onChange={(e) => handleDefaultChange("digitizer", e.target.value)}
                className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg"
              >
                <option value="auto">Auto (use first available)</option>
                {digitizationProviders.map((p) => {
                  const ks = keyStatus[p.id] as KeyStatus | undefined;
                  const configured = ks?.configured || p.configured;
                  return (
                    <option key={p.id} value={p.id} disabled={!configured}>
                      {p.name} {p.pricing ? `— ${p.pricing}` : ""} {!configured ? "(not connected)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Generation default */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Design Generation
              </label>
              <select
                value={defaults.generator}
                onChange={(e) => handleDefaultChange("generator", e.target.value)}
                className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg"
              >
                <option value="auto">Auto (use first available)</option>
                {generationProviders.map((p) => {
                  const ks = keyStatus[p.id] as KeyStatus | undefined;
                  const configured = ks?.configured || p.configured;
                  return (
                    <option key={p.id} value={p.id} disabled={!configured}>
                      {p.name} {p.pricing ? `— ${p.pricing}` : ""} {!configured ? "(not connected)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Connected providers summary */}
      {hasAnyConfigured && (
        <div>
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#16a34a" }}>check_circle</span>
            Connected ({configuredProviders.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {configuredProviders.map((p) => {
              const meta = PROVIDER_META[p.id] || { icon: "extension" };
              return (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg surface-container-low text-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#6f5100" }}>{meta.icon}</span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.model}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All providers — expandable cards */}
      <div>
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6f5100" }}>settings</span>
          {hasAnyConfigured ? "Manage Providers" : "Available Providers"}
        </h2>
        <div className="space-y-3">
          {providers.map((p) => {
            const meta = PROVIDER_META[p.id] || { description: "", icon: "extension" };
            const ks = keyStatus[p.id] as KeyStatus | undefined;
            const isConfigured = ks?.configured || p.configured;
            const isExpanded = expandedCard === p.id || (!hasAnyConfigured && p.recommended);

            return (
              <div key={p.id}>
                {/* Collapsed row */}
                {!isExpanded ? (
                  <button
                    onClick={() => setExpandedCard(expandedCard === p.id ? null : p.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl surface-container-low hover:shadow-ambient transition-all text-left"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#6f5100" }}>{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.name}</span>
                        {p.recommended && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(111,81,0,0.1)", color: "#6f5100" }}>Recommended</span>}
                        <span className="text-[10px] text-muted-foreground">{p.pricing}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isConfigured ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                      {isConfigured ? "Connected" : "Setup"}
                    </span>
                    <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: "18px" }}>expand_more</span>
                  </button>
                ) : (
                  /* Expanded card */
                  <div>
                    <button
                      onClick={() => setExpandedCard(null)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>expand_less</span>
                      Collapse
                    </button>
                    <AIProviderCard
                      id={p.id}
                      name={p.recommended ? `${p.name} — Recommended` : p.name}
                      description={`${meta.description}${p.pricing ? ` · ${p.pricing}` : ""}${p.model ? ` · Model: ${p.model}` : ""}`}
                      icon={meta.icon}
                      configured={isConfigured}
                      capabilities={p.capabilities}
                      maskedKey={ks?.masked}
                      source={ks?.source}
                      canSave={isAuthenticated}
                      onSave={(key) => handleSave(p.id, key)}
                      onRemove={ks?.source === "user" ? () => handleRemove(p.id) : undefined}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Guest / env vars help */}
      {isGuest && (
        <div className="rounded-xl p-4 flex items-center gap-3 surface-container">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#6f5100" }}>info</span>
          <p className="text-sm text-muted-foreground">
            Guest mode — sign in to save API keys and set default providers.
          </p>
        </div>
      )}
    </div>
  );
}
