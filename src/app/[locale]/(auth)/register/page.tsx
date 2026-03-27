"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Account created. Please sign in.");
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
          <h1 className="text-4xl font-extrabold mb-3">{t("common.appName")}</h1>
          <p className="text-lg text-white/80 max-w-md italic">
            Disena espacios que inspiran. Potenciado por inteligencia artificial, creado para la calidez del hogar.
          </p>
          <div className="w-12 h-0.5 bg-white/40 mt-4" />
        </div>
      </div>

      {/* Mobile gradient header */}
      <div
        className="md:hidden px-8 py-10 text-center text-white"
        style={{ background: "linear-gradient(135deg, #6f5100 0%, #8b6914 60%, #a07a1a 100%)" }}
      >
        <span className="material-symbols-outlined mb-2" style={{ fontSize: "32px" }}>location_on</span>
        <h1 className="text-xl font-bold">{t("common.appName")}</h1>
        <p className="text-xs text-white/70 mt-1">Digital Atelier for interior design.</p>
      </div>

      {/* Form section */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 md:py-0">
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-bold">Crea tu cuenta</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Comienza tu viaje en el diseno de interiores hoy mismo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Nombre Completo</label>
              <input name="name" type="text" required autoComplete="name" placeholder="Ej. Julian Casablancas"
                className="input-ghost w-full px-4 py-3 text-sm rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Correo Electronico</label>
              <input name="email" type="email" required autoComplete="email" placeholder="hola@estudio.com"
                className="input-ghost w-full px-4 py-3 text-sm rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Contrasena</label>
              <div className="relative">
                <input name="password" type={showPw ? "text" : "password"} required minLength={6} autoComplete="new-password"
                  className="input-ghost w-full px-4 pr-10 py-3 text-sm rounded-lg" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{showPw ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white rounded-full transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}>
              {loading ? t("common.loading") : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "#6f5100" }}>Sign In</Link>
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
