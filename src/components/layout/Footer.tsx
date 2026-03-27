"use client";

export function Footer() {
  return (
    <footer className="px-6 py-4 text-xs text-muted-foreground surface-container-low">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <span className="font-semibold" style={{ color: "#6f5100" }}>
          Hogar Studio{" "}
          <span className="font-normal text-muted-foreground">
            &copy; {new Date().getFullYear()} &middot; Disena con IA
          </span>
        </span>
        <div className="flex gap-4">
          <span className="hover:text-foreground cursor-pointer transition-colors">Privacidad</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Terminos</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">Contacto</span>
        </div>
      </div>
    </footer>
  );
}
