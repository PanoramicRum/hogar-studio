"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface AIProviderCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  configured: boolean;
  capabilities: string[];
  maskedKey?: string | null;
  source?: "env" | "user" | null;
  canSave: boolean;
  onSave: (key: string) => Promise<void>;
  onRemove?: () => Promise<void>;
}

interface ProviderGuide {
  steps: string[];
  url: string;
  urlLabel: string;
  keyFormat: string;
  pricing: string;
}

const PROVIDER_GUIDES: Record<string, ProviderGuide> = {
  gemini: {
    steps: [
      "Go to Google AI Studio (link below)",
      'Click "Create API Key" in the top left',
      "Select or create a Google Cloud project",
      "Copy the generated API key",
    ],
    url: "https://aistudio.google.com/apikey",
    urlLabel: "Google AI Studio",
    keyFormat: "Starts with AIza...",
    pricing: "Free tier: 15 req/min. No credit card required.",
  },
  openai: {
    steps: [
      "Sign in at the OpenAI Platform",
      'Go to API Keys in settings',
      'Click "Create new secret key"',
      "Copy the key (shown only once)",
    ],
    url: "https://platform.openai.com/api-keys",
    urlLabel: "OpenAI Platform",
    keyFormat: "Starts with sk-...",
    pricing: "Pay-as-you-go. GPT-4o ~$2.50/1M tokens. DALL-E 3 ~$0.04/image.",
  },
  anthropic: {
    steps: [
      "Sign in at the Anthropic Console",
      'Go to Settings > API Keys',
      'Click "Create Key"',
      "Copy the key (shown only once)",
    ],
    url: "https://console.anthropic.com/settings/keys",
    urlLabel: "Anthropic Console",
    keyFormat: "Starts with sk-ant-...",
    pricing: "Pay-as-you-go. Claude Sonnet ~$3/1M tokens.",
  },
  replicate: {
    steps: [
      "Sign in with GitHub at Replicate",
      'Go to your avatar > "API tokens"',
      "Copy your default token",
    ],
    url: "https://replicate.com/account/api-tokens",
    urlLabel: "Replicate Dashboard",
    keyFormat: "Starts with r8_...",
    pricing: "Pay-per-prediction. ~$0.05-0.15/image.",
  },
  local: {
    steps: [
      "Start a local inference server (ComfyUI, Automatic1111, Ollama)",
      "Enable API mode",
      "Enter the endpoint URL below",
    ],
    url: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
    urlLabel: "Automatic1111 Setup Guide",
    keyFormat: "URL: http://localhost:PORT",
    pricing: "Free — runs on your hardware.",
  },
};

export function AIProviderCard({
  id, name, description, icon, configured, capabilities, maskedKey, source, canSave, onSave, onRemove,
}: AIProviderCardProps) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<Window | null>(null);

  const guide = PROVIDER_GUIDES[id];

  // Auto-focus input when returning from popup
  useEffect(() => {
    if (!popupOpen) return;
    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        setPopupOpen(false);
        inputRef.current?.focus();
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [popupOpen]);

  // Also focus on window focus (user alt-tabbed back)
  useEffect(() => {
    if (!popupOpen) return;
    function handleFocus() {
      inputRef.current?.focus();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [popupOpen]);

  function openDashboard() {
    if (!guide) return;
    const w = 800;
    const h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    popupRef.current = window.open(
      guide.url,
      `hogar_${id}_dashboard`,
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
    );
    setPopupOpen(true);
  }

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setKey(text.trim());
        toast.success("Key pasted from clipboard");
      } else {
        toast.error("Clipboard is empty");
      }
    } catch {
      toast.error("Clipboard access denied — use Ctrl+V to paste manually");
      inputRef.current?.focus();
    }
  }, []);

  async function handleSave() {
    if (!key.trim()) return;
    setSaving(true);
    try {
      await onSave(key.trim());
      setKey("");
      setPopupOpen(false);
      toast.success(`${name} connected!`);
    } catch {
      toast.error("Failed to save key");
    }
    setSaving(false);
  }

  async function handleRemove() {
    if (!onRemove) return;
    setSaving(true);
    try {
      await onRemove();
      toast.success(`${name} key removed`);
    } catch {
      toast.error("Failed to remove key");
    }
    setSaving(false);
  }

  return (
    <>
      <div className="rounded-xl surface-container-low p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#6f5100" }}>{icon}</span>
            <div>
              <h3 className="font-bold text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {source && (
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full surface-container-high text-muted-foreground font-semibold">
                {source}
              </span>
            )}
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
              configured
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                : "bg-muted text-muted-foreground"
            }`}>
              {configured ? "Connected" : "Not configured"}
            </span>
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex gap-1.5 flex-wrap">
          {capabilities.map((cap) => (
            <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full surface-container-high text-muted-foreground capitalize">
              {cap}
            </span>
          ))}
        </div>

        {/* Current key (masked) — when configured */}
        {maskedKey && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600" style={{ fontSize: "14px" }}>check_circle</span>
            <p className="text-xs text-muted-foreground font-mono">{maskedKey}</p>
            {source === "user" && onRemove && (
              <button onClick={handleRemove} disabled={saving} className="text-[10px] text-destructive hover:underline ml-auto">
                Remove
              </button>
            )}
          </div>
        )}

        {/* Setup flow — when NOT configured and user can save */}
        {canSave && !configured && guide && (
          <div className="rounded-lg surface-container p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#6f5100" }}>key</span>
              Get your API key in 3 steps:
            </p>

            {/* Step 1: Open dashboard */}
            <button
              onClick={openDashboard}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg surface-container-lowest hover:shadow-ambient transition-all text-sm font-medium text-left"
              style={{ color: "#6f5100" }}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>1</span>
              Open {guide.urlLabel}
              <span className="ml-auto material-symbols-outlined" style={{ fontSize: "16px" }}>open_in_new</span>
            </button>

            {/* Inline instructions after popup opened */}
            {popupOpen && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200">
                <span className="material-symbols-outlined animate-pulse" style={{ fontSize: "16px" }}>hourglass_top</span>
                Create your key in the popup, then copy it and come back here
              </div>
            )}

            {/* Step 2+3: Paste and save */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>2</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type={showKey ? "text" : "password"}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Paste your key here..."
                  className="input-ghost w-full px-3 py-2 text-sm rounded-lg pr-10 font-mono"
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {showKey ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <button onClick={pasteFromClipboard}
                className="px-3 py-2 rounded-lg text-xs font-medium surface-container-highest hover:shadow-ambient transition-all shrink-0 flex items-center gap-1"
                title="Paste from clipboard">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>content_paste</span>
                Paste
              </button>
            </div>

            <button onClick={handleSave} disabled={!key.trim() || saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: key.trim() ? "linear-gradient(135deg, #6f5100, #8b6914)" : "#9ca3af" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/20">3</span>
              {saving ? "Saving..." : "Save & Connect"}
            </button>

            <p className="text-[10px] text-center text-muted-foreground">
              {guide.keyFormat} &middot; {guide.pricing}
            </p>
          </div>
        )}

        {/* Update key — when configured and user can save */}
        {canSave && configured && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter new key to update..."
                className="input-ghost w-full px-3 py-2 text-sm rounded-lg pr-10 font-mono"
              />
              <button type="button" onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {showKey ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <button onClick={pasteFromClipboard}
              className="px-3 py-2 rounded-lg text-xs surface-container-highest hover:shadow-ambient transition-all shrink-0"
              title="Paste from clipboard">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>content_paste</span>
            </button>
            {guide && (
              <button onClick={() => setShowGuide(true)}
                className="px-2 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 shrink-0"
                title="How to get this key">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>help</span>
              </button>
            )}
            <button onClick={handleSave} disabled={!key.trim() || saving}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
              {saving ? "..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Detailed guide modal (accessible via ? button on configured cards) */}
      {showGuide && guide && (
        <GuideModal guide={guide} name={name} onClose={() => setShowGuide(false)} />
      )}
    </>
  );
}

function GuideModal({ guide, name, onClose }: { guide: ProviderGuide; name: string; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-ambient-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-lg font-bold">How to get a {name} key</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="px-5 pb-5 space-y-5">
            <ol className="space-y-2.5">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>{i + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <a href={guide.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-lg surface-container-low hover:shadow-ambient transition-all text-sm font-medium"
              style={{ color: "#6f5100" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>open_in_new</span>
              {guide.urlLabel}
              <span className="ml-auto material-symbols-outlined text-muted-foreground" style={{ fontSize: "16px" }}>arrow_forward</span>
            </a>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg surface-container-high p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Key Format</p>
                <p className="text-xs font-mono">{guide.keyFormat}</p>
              </div>
              <div className="rounded-lg surface-container-high p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Pricing</p>
                <p className="text-xs text-muted-foreground">{guide.pricing}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-2.5 text-sm font-medium rounded-lg hover:bg-muted">Got it</button>
          </div>
        </div>
      </div>
    </>
  );
}
