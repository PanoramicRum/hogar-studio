"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ShareData {
  id: string;
  imageUrl: string;
  projectName: string;
  roomName: string | null;
  style: string | null;
  perspective: string | null;
  viewCount: number;
  user: { name: string | null };
  comments: { id: string; authorName: string; text: string; reaction: string | null; createdAt: string }[];
}

const REACTIONS = [
  { id: "love", emoji: "❤️", label: "Love it" },
  { id: "like", emoji: "👍", label: "Looks good" },
  { id: "hmm", emoji: "🤔", label: "Not sure" },
  { id: "change", emoji: "🔄", label: "Change this" },
];

export default function SharePageClient() {
  const params = useParams();
  const shareId = params.id as string;

  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [authorName, setAuthorName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [selectedReaction, setSelectedReaction] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/shares/${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 410 ? "This link has expired" : "Not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shareId]);

  async function handleSubmitComment() {
    if (!authorName.trim() || !commentText.trim()) return;
    setSubmitting(true);

    const res = await fetch(`/api/shares/${shareId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName: authorName.trim(), text: commentText.trim(), reaction: selectedReaction || null }),
    });

    if (res.ok) {
      const comment = await res.json();
      setData((d) => d ? { ...d, comments: [comment, ...d.comments] } : d);
      setCommentText("");
      setSelectedReaction("");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800 mb-2">{error || "Not found"}</p>
          <a href="/" className="text-sm text-[#6f5100] hover:underline">Go to Hogar Studio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff]">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-lg font-bold" style={{ color: "#6f5100" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>location_on</span>
          Hogar Studio
        </a>
        <span className="text-xs text-gray-500">{data.viewCount} views</span>
      </header>

      {/* Image */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <img src={data.imageUrl} alt={data.projectName} className="w-full" />
        </div>

        {/* Info */}
        <div className="mt-4 space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{data.projectName}</h1>
          <div className="flex gap-2 flex-wrap">
            {data.roomName && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#eaedff] text-gray-700">{data.roomName}</span>
            )}
            {data.style && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#fef3c7] text-gray-700">{data.style}</span>
            )}
            {data.perspective && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#d1fae5] text-gray-700">{data.perspective}</span>
            )}
          </div>
          {data.user.name && (
            <p className="text-sm text-gray-500">by {data.user.name}</p>
          )}
        </div>

        {/* Comment form */}
        <div className="mt-8 rounded-xl bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-sm">Share your opinion</h2>

          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-[#f2f3ff] border-0 focus:outline-none focus:ring-2 focus:ring-[#6f5100]"
          />

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What do you think of this design?"
            rows={3}
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-[#f2f3ff] border-0 resize-none focus:outline-none focus:ring-2 focus:ring-[#6f5100]"
          />

          <div className="flex gap-2">
            {REACTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReaction(selectedReaction === r.id ? "" : r.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all ${
                  selectedReaction === r.id ? "ring-2 ring-[#6f5100] bg-[#6f5100]/5" : "bg-[#f2f3ff] hover:bg-[#eaedff]"
                }`}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmitComment}
            disabled={submitting || !authorName.trim() || !commentText.trim()}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
          >
            {submitting ? "Sending..." : "Post Comment"}
          </button>
        </div>

        {/* Comments list */}
        {data.comments.length > 0 && (
          <div className="mt-6 space-y-3 pb-12">
            <h2 className="font-bold text-sm">{data.comments.length} comment{data.comments.length !== 1 ? "s" : ""}</h2>
            {data.comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{c.authorName}</span>
                  {c.reaction && <span>{REACTIONS.find((r) => r.id === c.reaction)?.emoji}</span>}
                  <span className="text-[10px] text-gray-400 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="py-8 text-center">
          <a href="/" className="text-sm font-medium hover:underline" style={{ color: "#6f5100" }}>
            Design your own apartment with Hogar Studio →
          </a>
        </div>
      </div>
    </div>
  );
}
