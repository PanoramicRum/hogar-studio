"use client";

import { useEffect, useState } from "react";
import { usePackageRegistry } from "@/components/providers/PackageProvider";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";

interface UserStyle {
  id: string;
  name: string;
  prompt: string;
  negativePrompt: string;
  color: string;
}

interface StyleSelectorProps {
  selectedStyle: string;
  onSelect: (styleId: string) => void;
}

export function StyleSelector({ selectedStyle, onSelect }: StyleSelectorProps) {
  const { styles } = usePackageRegistry();
  const params = useParams();
  const projectId = params.id as string;
  const [userStyles, setUserStyles] = useState<UserStyle[]>([]);

  useEffect(() => {
    fetch("/api/users/styles")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUserStyles(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      {/* User styles */}
      {userStyles.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Your Styles</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {userStyles.map((style) => (
              <button
                key={`user-${style.id}`}
                onClick={() => onSelect(`user:${style.id}`)}
                className={cn(
                  "p-3 rounded-lg text-left transition-all",
                  selectedStyle === `user:${style.id}`
                    ? "ring-2 ring-[#6f5100] shadow-ambient"
                    : "surface-container-low hover:shadow-ambient"
                )}
              >
                <div className="w-full h-8 rounded mb-2" style={{ backgroundColor: style.color }} />
                <p className="text-sm font-medium">{style.name}</p>
                <p className="text-[9px] text-muted-foreground">Custom</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Package styles */}
      <div>
        {userStyles.length > 0 && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Built-in Styles</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => onSelect(style.id)}
              className={cn(
                "p-3 rounded-lg text-left transition-all",
                selectedStyle === style.id
                  ? "ring-2 ring-[#6f5100] shadow-ambient"
                  : "surface-container-low hover:shadow-ambient"
              )}
            >
              <div className="w-full h-8 rounded mb-2" style={{ backgroundColor: style.color }} />
              <p className="text-sm font-medium">{style.nameI18n?.en || style.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Create style link */}
      {projectId && (
        <Link
          href={`/projects/${projectId}/designs/create-style`}
          className="flex items-center gap-2 text-xs hover:underline"
          style={{ color: "#6f5100" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
          Create custom style
        </Link>
      )}
    </div>
  );
}
