"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";

const SETTINGS_LINKS = [
  { href: "/settings/ai", label: "AI Providers", icon: "auto_awesome" },
  { href: "/settings/packages", label: "Packages", icon: "inventory_2" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1">
      <aside className="w-56 shrink-0 surface-container-low hidden md:flex flex-col p-4 space-y-1">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold px-3 mb-3">
          Settings
        </p>
        {SETTINGS_LINKS.map((link) => {
          const isActive = pathname.includes(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "font-semibold border-l-4"
                  : "text-muted-foreground hover:bg-muted/50 border-l-4 border-transparent"
              }`}
              style={isActive ? { borderLeftColor: "#6f5100", backgroundColor: "rgba(111,81,0,0.06)", color: "#6f5100" } : {}}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </aside>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
