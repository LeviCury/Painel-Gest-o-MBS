import type { Visao } from "@/lib/navigation";

function Brasil() {
  return (
    <svg viewBox="0 0 20 14" className="h-full w-full" aria-hidden="true">
      <rect width="20" height="14" fill="#009C3B" />
      <polygon points="10,1.15 18.7,7 10,12.85 1.3,7" fill="#FFDF00" />
      <circle cx="10" cy="7" r="2.65" fill="#002776" />
    </svg>
  );
}

function Paraguai() {
  return (
    <svg viewBox="0 0 20 14" className="h-full w-full" aria-hidden="true">
      <rect width="20" height="4.67" fill="#D52B1E" />
      <rect y="4.67" width="20" height="4.66" fill="#FFFFFF" />
      <rect y="9.33" width="20" height="4.67" fill="#0038A8" />
    </svg>
  );
}

function EstadosUnidos() {
  return (
    <svg viewBox="0 0 20 14" className="h-full w-full" aria-hidden="true">
      <rect width="20" height="14" fill="#BF0A30" />
      <rect y="2" width="20" height="2" fill="#FFFFFF" />
      <rect y="6" width="20" height="2" fill="#FFFFFF" />
      <rect y="10" width="20" height="2" fill="#FFFFFF" />
      <rect width="8" height="7.5" fill="#002868" />
    </svg>
  );
}

function Espanha() {
  return (
    <svg viewBox="0 0 20 14" className="h-full w-full" aria-hidden="true">
      <rect width="20" height="14" fill="#AA151B" />
      <rect y="3.5" width="20" height="7" fill="#F1BF00" />
    </svg>
  );
}

export function BandeiraIdioma({ codigo }: { codigo: "pt-BR" | "en" | "es" }) {
  return (
    <span className="inline-flex h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] shadow-[inset_0_0_0_1px_rgb(23_42_57/0.4)]">
      {codigo === "pt-BR" ? <Brasil /> : codigo === "es" ? <Espanha /> : <EstadosUnidos />}
    </span>
  );
}

export function Bandeira({ codigo, curta = false }: { codigo: "BR" | "PY"; curta?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 overflow-hidden rounded-[2px] shadow-[inset_0_0_0_1px_rgb(23_42_57/0.4)] ${curta ? "h-3 w-4" : "h-5 w-7"}`}>
      {codigo === "BR" ? <Brasil /> : <Paraguai />}
    </span>
  );
}

export function MarcaPais({ visao, curta = false }: { visao: Visao; curta?: boolean }) {
  if (visao === "BR+PY") {
    return (
      <span className={`inline-flex shrink-0 items-center ${curta ? "gap-0.5" : "gap-1"}`}>
        <Bandeira codigo="BR" curta={curta} />
        <Bandeira codigo="PY" curta={curta} />
      </span>
    );
  }
  return <Bandeira codigo={visao === "PY" ? "PY" : "BR"} />;
}
