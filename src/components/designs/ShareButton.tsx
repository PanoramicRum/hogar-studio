"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
  imageUrl: string;
  projectName: string;
  roomName?: string | null;
  style?: string | null;
  perspective?: string | null;
}

export function ShareButton({ imageUrl, projectName, roomName, style, perspective }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function handleCopyLink() {
    setSharing(true);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, projectName, roomName, style, perspective }),
      });
      if (res.ok) {
        const { url } = await res.json();
        const fullUrl = `${window.location.origin}${url}`;
        await navigator.clipboard.writeText(fullUrl);
        toast.success("Link copied to clipboard!");
      } else {
        toast.error("Failed to create share link");
      }
    } catch {
      toast.error("Failed to share");
    }
    setSharing(false);
    setOpen(false);
  }

  async function handleNativeShare() {
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, projectName, roomName, style, perspective }),
      });
      if (res.ok) {
        const { url } = await res.json();
        const fullUrl = `${window.location.origin}${url}`;
        await navigator.share({
          title: `${projectName} — Hogar Studio`,
          text: `Check out this room design${roomName ? ` — ${roomName}` : ""}`,
          url: fullUrl,
        });
      }
    } catch {
      // User cancelled or not supported
    }
    setOpen(false);
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `hogar-${projectName.replace(/\s+/g, "-").toLowerCase()}.jpg`;
    a.click();
    toast.success("Image downloaded");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
        title="Share"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>share</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-background rounded-xl shadow-ambient-lg p-2 w-48 space-y-0.5">
            <button onClick={handleCopyLink} disabled={sharing}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>link</span>
              {sharing ? "Creating..." : "Copy Link"}
            </button>
            {"share" in navigator && (
              <button onClick={handleNativeShare}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
                Share...
              </button>
            )}
            <button onClick={handleDownload}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
              Download Image
            </button>
          </div>
        </>
      )}
    </div>
  );
}
