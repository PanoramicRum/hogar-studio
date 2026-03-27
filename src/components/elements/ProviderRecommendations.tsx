"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  dimensions: { width?: number; depth?: number; height?: number };
  price: number;
  currency: string;
  imageUrl: string | null;
  productUrl: string;
  provider: { name: string; website: string; logoUrl: string | null; zone: string };
}

interface ProviderRecommendationsProps {
  furnitureType: string;
  furnitureName: string;
}

export function ProviderRecommendations({ furnitureType, furnitureName }: ProviderRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations/furniture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ furnitureType, furnitureName }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
        setSearched(true);
        if (data.length === 0) toast.info("No products found in your zone yet");
      }
    } catch {
      toast.error("Failed to search");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleSearch}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs hover:underline"
        style={{ color: "#6f5100" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
          {loading ? "hourglass_top" : "shopping_bag"}
        </span>
        {loading ? "Searching..." : "Find similar products near you"}
      </button>

      {searched && products.length > 0 && (
        <div className="space-y-2">
          {products.map((p) => (
            <a
              key={p.id}
              href={p.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg surface-container hover:shadow-ambient transition-all"
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: "16px" }}>image</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.provider.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold">{p.currency} {p.price}</p>
                <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: "14px" }}>open_in_new</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {searched && products.length === 0 && (
        <p className="text-[10px] text-muted-foreground">
          No matching products from local providers. Products will appear as providers are added to your zone.
        </p>
      )}
    </div>
  );
}
