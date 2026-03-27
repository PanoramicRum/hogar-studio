"use client";

import { Link } from "@/i18n/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter as useNextIntlRouter } from "@/i18n/navigation";
import { usePathname, useParams } from "next/navigation";
import { MobileMenuButton } from "./MobileMenu";
import { useGuest } from "@/components/providers/GuestProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: session } = useSession();
  const { isGuest, exitGuestMode } = useGuest();
  const t = useTranslations();
  const locale = useLocale();
  const router = useNextIntlRouter();
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string | undefined;
  const isLoggedIn = !!session || isGuest;

  function switchLocale(newLocale: "en" | "es") {
    // Strip locale prefix from current pathname to get the base path
    const basePath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
    router.push(basePath, { locale: newLocale });
  }

  // Desktop nav links — show project-specific links when inside a project
  const navLinks = [
    { href: "/projects", label: t("nav.projects"), always: true },
    { href: "/marketplace", label: "Marketplace", always: true },
    ...(projectId
      ? [
          { href: `/projects/${projectId}/editor`, label: "Editor 2D", always: false },
          { href: `/projects/${projectId}/viewer3d`, label: "Visor 3D", always: false },
          { href: `/projects/${projectId}/elements`, label: "Elementos", always: false },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center px-5 gap-2">
        {/* Mobile hamburger */}
        <MobileMenuButton />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold shrink-0" style={{ color: "#6f5100" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>location_on</span>
          <span className="hidden sm:inline">{t("common.appName")}</span>
        </Link>

        {/* Desktop inline nav */}
        {isLoggedIn && (
          <nav className="hidden md:flex gap-1 ml-6">
            {navLinks.map((link) => {
              const isActive = pathname.includes(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "font-semibold text-[#6f5100] bg-[#6f5100]/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Language pill toggle */}
          <div className="hidden sm:flex rounded-full p-0.5" style={{ background: "var(--muted)" }}>
            <button
              onClick={() => switchLocale("es")}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                locale === "es" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              style={locale === "es" ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
            >
              ES
            </button>
            <button
              onClick={() => switchLocale("en")}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                locale === "en" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              style={locale === "en" ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
            >
              EN
            </button>
          </div>

          {isLoggedIn ? (
            <>
              {/* Notification bell */}
              <button className="hidden md:flex p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>notifications</span>
              </button>

              {/* Avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isGuest ? "bg-muted text-muted-foreground" : "text-white"}`}
                    style={!isGuest ? { background: "linear-gradient(135deg, #6f5100, #8b6914)" } : {}}
                  >
                    {isGuest ? (
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
                    ) : (
                      (session?.user?.name?.[0] || session?.user?.email?.[0] || "U").toUpperCase()
                    )}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">
                    {isGuest ? "Guest" : session?.user?.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="shadow-ambient">
                  <DropdownMenuItem onClick={() => router.push("/settings/packages")}>
                    <span className="material-symbols-outlined mr-2" style={{ fontSize: "16px" }}>settings</span>
                    {t("nav.settings")}
                  </DropdownMenuItem>
                  {isGuest ? (
                    <DropdownMenuItem onClick={() => { exitGuestMode(); router.push("/login"); }}>
                      <span className="material-symbols-outlined mr-2" style={{ fontSize: "16px" }}>login</span>
                      Sign In / Register
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                      <span className="material-symbols-outlined mr-2" style={{ fontSize: "16px" }}>logout</span>
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <button
                className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
              >
                {t("nav.login")}
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
