"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PackageRegistry, LoadedStyle, LoadedFurniture } from "@/lib/packages/types";

interface PackageContextValue extends PackageRegistry {
  loading: boolean;
  getStyleById: (id: string) => LoadedStyle | undefined;
  getFurnitureColor: (type: string) => string;
  getFurnitureHeight: (type: string) => number;
}

const PackageContext = createContext<PackageContextValue>({
  styles: [],
  furniture: [],
  loading: true,
  getStyleById: () => undefined,
  getFurnitureColor: () => "#6b7280",
  getFurnitureHeight: () => 0.6,
});

export function PackageProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<PackageRegistry>({ styles: [], furniture: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packages/registry")
      .then((r) => r.json())
      .then((data: PackageRegistry) => {
        setRegistry(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const value: PackageContextValue = {
    ...registry,
    loading,
    getStyleById: (id) => registry.styles.find((s) => s.id === id),
    getFurnitureColor: (type) => registry.furniture.find((f) => f.type === type)?.color ?? "#6b7280",
    getFurnitureHeight: (type) => registry.furniture.find((f) => f.type === type)?.height3d ?? 0.6,
  };

  return <PackageContext.Provider value={value}>{children}</PackageContext.Provider>;
}

export function usePackageRegistry() {
  return useContext(PackageContext);
}
