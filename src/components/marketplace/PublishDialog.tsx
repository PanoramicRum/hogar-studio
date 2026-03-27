"use client";

import { useState } from "react";
import { toast } from "sonner";

interface PublishDialogProps {
  type: "style" | "furniture" | "palette";
  data: Record<string, unknown>;
  defaultTitle?: string;
  onClose: () => void;
  onPublished: () => void;
}

export function PublishDialog({ type, data, defaultTitle, onClose, onPublished }: PublishDialogProps) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [description, setDescription] = useState("");
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (!title.trim()) { toast.error("Title required"); return; }
    setPublishing(true);

    const res = await fetch("/api/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title: title.trim(), description: description.trim(), data }),
    });

    if (res.ok) {
      toast.success("Published to Marketplace!");
      onPublished();
      onClose();
    } else {
      toast.error("Failed to publish");
    }
    setPublishing(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-ambient-lg max-w-md w-full">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-lg font-bold">Publish to Marketplace</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">{type}</span>
              <span className="text-xs text-muted-foreground">Share with the community</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="Describe what this includes and how to use it..."
                className="input-ghost w-full px-3 py-2.5 text-sm rounded-lg resize-none" />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-muted">Cancel</button>
              <button onClick={handlePublish} disabled={publishing || !title.trim()}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
                {publishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
