"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useGuest } from "@/components/providers/GuestProvider";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { enterGuestMode } = useGuest();

  function handleGuest() {
    enterGuestMode();
    router.push("/projects");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/projects");
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
      {/* Left panel — desktop only */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-end p-12 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6f5100 0%, #8b6914 60%, #a07a1a 100%)" }}
      >
        <div className="relative z-10">
          <span className="material-symbols-outlined mb-4" style={{ fontSize: "36px" }}>location_on</span>
          <h1 className="text-4xl font-extrabold mb-3">{t("common.appName")}</h1>
          <p className="text-lg text-white/80 max-w-md">
            Transforma tu espacio con la precision de la IA.
          </p>
          <p className="text-sm text-white/60 mt-2">
            Diseno de interiores profesional, visualizacion 3D y edicion inteligente en una sola plataforma tactil.
          </p>
        </div>
      </div>

      {/* Mobile gradient header */}
      <div
        className="md:hidden px-8 py-12 text-center text-white"
        style={{ background: "linear-gradient(135deg, #6f5100 0%, #8b6914 60%, #a07a1a 100%)" }}
      >
        <span className="material-symbols-outlined mb-3" style={{ fontSize: "36px" }}>location_on</span>
        <h1 className="text-2xl font-bold">{t("common.appName")}</h1>
        <p className="text-sm text-white/70 mt-2">Where AI precision meets human warmth.</p>
      </div>

      {/* Form section */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:py-0">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Bienvenido de nuevo</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Accede a tus proyectos y herramientas de diseno.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Correo Electronico
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted-foreground" style={{ fontSize: "18px" }}>mail</span>
                <input name="email" type="email" required autoComplete="email" placeholder="nombre@ejemplo.com"
                  className="input-ghost w-full pl-10 pr-4 py-3 text-sm rounded-lg" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Contrasena</label>
                <button type="button" className="text-[10px] text-[#6f5100] hover:underline">Olvidaste tu contrasena?</button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-muted-foreground" style={{ fontSize: "18px" }}>lock</span>
                <input name="password" type={showPw ? "text" : "password"} required autoComplete="current-password"
                  className="input-ghost w-full pl-10 pr-10 py-3 text-sm rounded-lg" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{showPw ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="rounded" />
              Recordar mi sesion
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white rounded-full transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
              {loading ? t("common.loading") : "Sign In"}
            </button>
          </form>

          {/* Guest mode */}
          <button
            onClick={handleGuest}
            className="w-full py-3 text-sm font-medium rounded-full transition-all hover:bg-muted surface-container-high flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
            Enter as Guest
          </button>
          <p className="text-[10px] text-center text-muted-foreground -mt-3">
            Explore all features — your projects won&apos;t be saved
          </p>

          <p className="text-center text-sm text-muted-foreground">
            No tienes una cuenta?{" "}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: "#6f5100" }}>
              Registrate gratis
            </Link>
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">o continua con</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-3 justify-center">
            <button className="w-10 h-10 rounded-full surface-container-high flex items-center justify-center text-muted-foreground" disabled>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>g_mobiledata</span>
            </button>
            <button className="w-10 h-10 rounded-full surface-container-high flex items-center justify-center text-muted-foreground" disabled>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>phone_iphone</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
