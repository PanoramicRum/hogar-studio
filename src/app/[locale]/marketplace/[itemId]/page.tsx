"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user: { name: string | null };
  createdAt: string;
}

interface MarketplaceItemDetail {
  id: string;
  type: string;
  title: string;
  description: string;
  previewImageUrl: string | null;
  data: Record<string, unknown>;
  downloads: number;
  rating: number;
  user: { name: string | null };
  reviews: Review[];
  createdAt: string;
}

export default function MarketplaceItemPage() {
  const params = useParams();
  const { data: session } = useSession();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<MarketplaceItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    fetch(`/api/marketplace/${itemId}`)
      .then((r) => r.json())
      .then(setItem)
      .finally(() => setLoading(false));
  }, [itemId]);

  async function handleInstall() {
    const res = await fetch(`/api/marketplace/${itemId}`, { method: "POST" });
    if (res.ok) {
      toast.success("Downloaded! The content is ready to use.");
      if (item) setItem({ ...item, downloads: item.downloads + 1 });
    }
  }

  async function handleReview() {
    const res = await fetch(`/api/marketplace/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
    });
    if (res.ok) {
      toast.success("Review submitted!");
      setReviewComment("");
      // Refresh
      const updated = await fetch(`/api/marketplace/${itemId}`).then((r) => r.json());
      setItem(updated);
    }
  }

  if (loading || !item) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex gap-6 flex-col md:flex-row">
        <div className="w-full md:w-64 h-48 rounded-xl surface-container overflow-hidden shrink-0">
          {item.previewImageUrl ? (
            <img src={item.previewImageUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-muted-foreground/30" style={{ fontSize: "64px" }}>storefront</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">{item.type}</span>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>by {item.user.name || "Anonymous"}</span>
            <span>{item.downloads} downloads</span>
            {item.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#f59e0b" }}>star</span>
                {item.rating.toFixed(1)} ({item.reviews.length} reviews)
              </span>
            )}
          </div>
          <button onClick={handleInstall}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
            Install
          </button>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="font-bold text-sm">Reviews ({item.reviews.length})</h2>

        {session?.user && (
          <div className="rounded-xl surface-container-low p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Your rating:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setReviewRating(n)}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: "20px",
                    color: n <= reviewRating ? "#f59e0b" : "#d1d5db",
                    fontVariationSettings: n <= reviewRating ? "'FILL' 1" : "'FILL' 0",
                  }}>star</span>
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Leave a comment (optional)" rows={2}
              className="input-ghost w-full px-3 py-2 text-sm rounded-lg resize-none" />
            <button onClick={handleReview}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg"
              style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
              Submit Review
            </button>
          </div>
        )}

        {item.reviews.map((r) => (
          <div key={r.id} className="rounded-lg surface-container p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs">{r.user.name || "User"}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="material-symbols-outlined" style={{
                    fontSize: "12px", color: n <= r.rating ? "#f59e0b" : "#d1d5db",
                    fontVariationSettings: n <= r.rating ? "'FILL' 1" : "'FILL' 0",
                  }}>star</span>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
