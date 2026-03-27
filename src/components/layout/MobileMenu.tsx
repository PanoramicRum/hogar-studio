"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

export function MobileMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setOpen(true)}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>menu</span>
      </button>
      {open && <MobileMenuDrawer onClose={() => setOpen(false)} />}
    </>
  );
}

function MobileMenuDrawer({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(path);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-background shadow-ambient-lg animate-in slide-in-from-left duration-200">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="font-bold text-lg" style={{ color: "#6f5100" }}>
              <span className="material-symbols-outlined mr-1" style={{ fontSize: "18px", verticalAlign: "middle" }}>location_on</span>
              {t("common.appName")}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* User info */}
          {session && (
            <div className="px-5 py-3 surface-container-low">
              <p className="font-medium text-sm">{session.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session.user?.email}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <MenuLink href="/projects" icon="folder" label={t("nav.projects")} onClick={onClose} />
            <MenuLink href="/settings/packages" icon="settings" label={t("nav.settings")} onClick={onClose} />
          </nav>

          {/* Language toggle */}
          <div className="px-5 py-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Language</p>
            <div className="flex gap-2">
              <button
                onClick={() => switchLocale("es")}
                className={`flex-1 py-2 text-sm rounded-lg font-medium ${locale === "es" ? "text-white" : "surface-container-high text-muted-foreground"}`}
                style={locale === "es" ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
              >
                Espanol
              </button>
              <button
                onClick={() => switchLocale("en")}
                className={`flex-1 py-2 text-sm rounded-lg font-medium ${locale === "en" ? "text-white" : "surface-container-high text-muted-foreground"}`}
                style={locale === "en" ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
              >
                English
              </button>
            </div>
          </div>

          {/* Logout */}
          {session && (
            <div className="px-3 py-4">
              <button
                onClick={() => { signOut({ callbackUrl: "/" }); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>logout</span>
                {t("nav.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{icon}</span>
      {label}
    </Link>
  );
}
