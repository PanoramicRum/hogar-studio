"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

interface MarketplaceItem {
  id: string;
  type: string;
  title: string;
  description: string;
  previewImageUrl: string | null;
  downloads: number;
  rating: number;
  user: { name: string | null };
  _count: { reviews: number };
  createdAt: string;
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  style: { label: "Style", color: "bg-blue-100 text-blue-800" },
  furniture: { label: "Furniture", color: "bg-green-100 text-green-800" },
  palette: { label: "Palette", color: "bg-purple-100 text-purple-800" },
  bundle: { label: "Bundle", color: "bg-amber-100 text-amber-800" },
};

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (sort) params.set("sort", sort);
    if (search) params.set("search", search);

    fetch(`/api/marketplace?${params}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setItems(data); })
      .finally(() => setLoading(false));
  }, [type, sort, search]);

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover and share styles, furniture, palettes, and design bundles
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="input-ghost px-3 py-2 text-sm rounded-lg w-48"
        />
        <div className="flex gap-1">
          {["", "style", "furniture", "palette", "bundle"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                type === t ? "text-white font-semibold" : "surface-container-low text-muted-foreground hover:shadow-ambient"
              }`}
              style={type === t ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
            >
              {t ? TYPE_BADGES[t]?.label || t : "All"}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input-ghost px-3 py-1.5 text-xs rounded-lg"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Downloaded</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-3">
          <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>storefront</span>
          <p className="text-lg">No items yet</p>
          <p className="text-sm">Be the first to publish a style, furniture set, or palette!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const badge = TYPE_BADGES[item.type] || { label: item.type, color: "bg-gray-100 text-gray-800" };
            return (
              <Link key={item.id} href={`/marketplace/${item.id}`}>
                <div className="rounded-xl surface-container-low hover:shadow-ambient transition-all cursor-pointer h-full">
                  <div className="h-36 bg-muted rounded-t-xl flex items-center justify-center overflow-hidden">
                    {item.previewImageUrl ? (
                      <img src={item.previewImageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-muted-foreground/30" style={{ fontSize: "48px" }}>
                        {item.type === "style" ? "palette" : item.type === "furniture" ? "chair" : "color_lens"}
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>{badge.label}</span>
                      {item.rating > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#f59e0b" }}>star</span>
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>by {item.user.name || "Anonymous"}</span>
                      <span>{item.downloads} downloads</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
