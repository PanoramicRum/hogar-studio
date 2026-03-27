import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="flex flex-col flex-1">
      {/* Hero section */}
      <section
        className="relative px-6 md:px-16 py-16 md:py-24 text-white"
        style={{ background: "linear-gradient(135deg, #6f5100 0%, #8b6914 50%, #a07a1a 100%)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left space-y-6">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">El Atelier Digital</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {t("common.tagline")}
            </h1>
            <p className="text-base md:text-lg text-white/80 max-w-lg">
              {t("dashboard.subtitle")}
            </p>
            <div className="flex gap-4 justify-center md:justify-start pt-2">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#6f5100] font-semibold rounded-full shadow-ambient hover:shadow-ambient-lg transition-all hover:scale-[1.02]"
              >
                {t("dashboard.newProject")}
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all"
              >
                {t("nav.projects")}
              </Link>
            </div>
          </div>
          {/* Placeholder for hero image on desktop */}
          <div className="hidden md:block flex-1 max-w-md">
            <div className="w-full aspect-[4/3] rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <span className="material-symbols-outlined text-white/30" style={{ fontSize: "80px" }}>apartment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-2">Herramientas Profesionales</h2>
        <p className="text-sm text-muted-foreground text-center mb-10">
          Hogar Studio combina precision tecnica con vision artistica para transformar espacios.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: "architecture", title: "Planos 2D y 3D instantaneos", desc: "Edita planos con medidas reales y visualizalos en 3D con un clic." },
            { icon: "auto_awesome", title: "Rediseno con IA", desc: "Genera renders de diseno interior en multiples estilos con inteligencia artificial." },
            { icon: "view_in_ar", title: "Visualizacion 3D", desc: "Recorre tu apartamento en 3D con modos orbita y primera persona." },
            { icon: "chair", title: "Catalogo Real", desc: "Vincula muebles reales con enlaces a tiendas y dimensiones precisas." },
          ].map((f) => (
            <div key={f.icon} className="flex gap-4 p-5 rounded-xl surface-container-low hover:shadow-ambient transition-all">
              <span className="material-symbols-outlined shrink-0 mt-1" style={{ fontSize: "28px", color: "#6f5100" }}>{f.icon}</span>
              <div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="px-6 md:px-16 py-16 surface-container-low">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-2xl font-bold">Comienza tu viaje creativo hoy</h2>
          <p className="text-sm text-muted-foreground">
            Crea tu cuenta gratuita y transforma tus espacios con Hogar Studio.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-full transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
            >
              Registrate Gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full transition-all hover:bg-muted surface-container-high"
            >
              Iniciar Sesion
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
