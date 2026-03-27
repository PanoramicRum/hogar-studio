"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  labelKey: string;
  icon: string;
}

export function ProjectSidebar({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const t = useTranslations();
  const pathname = usePathname();

  const links: SidebarLink[] = [
    { href: `/projects/${projectId}`, labelKey: "projects.overview", icon: "dashboard" },
    { href: `/projects/${projectId}/editor`, labelKey: "projects.editor", icon: "architecture" },
    { href: `/projects/${projectId}/viewer3d`, labelKey: "projects.viewer3d", icon: "view_in_ar" },
    { href: `/projects/${projectId}/panorama`, labelKey: "viewer3d.title", icon: "panorama_photosphere" },
    { href: `/projects/${projectId}/designs`, labelKey: "designs.title", icon: "palette" },
    { href: `/projects/${projectId}/elements`, labelKey: "elements.title", icon: "chair" },
  ];

  return (
    <aside className="w-56 shrink-0 surface-container-low hidden md:flex flex-col">
      {/* Project header */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
          Proyecto Actual
        </p>
        {projectName && (
          <p className="text-sm font-bold mt-0.5 truncate">{projectName}</p>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5">
        {links.map((link) => {
          const isActive = pathname.endsWith(link.href) ||
            (link.href === `/projects/${projectId}` && pathname.match(/\/projects\/[^/]+$/));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                isActive
                  ? "border-l-4 font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent"
              )}
              style={isActive ? {
                borderLeftColor: "#6f5100",
                backgroundColor: "rgba(111, 81, 0, 0.06)",
                color: "#6f5100",
              } : {}}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "20px", fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {link.icon}
              </span>
              {t(link.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* CTA button */}
      <div className="px-3 py-3">
        <Link
          href={`/projects/${projectId}/designs`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
          Nuevo Diseno
        </Link>
      </div>

      {/* Bottom links */}
      <div className="px-3 pb-4 space-y-0.5">
        <Link
          href="/settings/packages"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>settings</span>
          Ajustes
        </Link>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors w-full text-left">
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>help</span>
          Ayuda
        </button>
      </div>
    </aside>
  );
}
