"use client";

import { Link } from "@/i18n/navigation";
import { usePathname, useParams } from "next/navigation";

const NAV_ITEMS = [
  { href: "", icon: "dashboard", label: "Overview" },
  { href: "/editor", icon: "architecture", label: "Editor" },
  { href: "/viewer3d", icon: "view_in_ar", label: "3D" },
  { href: "/designs", icon: "palette", label: "Designs" },
  { href: "/elements", icon: "chair", label: "Elements" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string | undefined;

  if (!projectId) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden surface-container-lowest shadow-[0_-4px_20px_rgba(19,27,46,0.06)]">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const href = `/projects/${projectId}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname.match(new RegExp(`/projects/${projectId}$`))
              : pathname.includes(href);
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? "text-[#6f5100]" : "text-muted-foreground"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "22px",
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
