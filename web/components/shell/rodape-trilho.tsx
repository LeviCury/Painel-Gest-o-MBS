"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BandeiraIdioma } from "@/components/shell/bandeiras";
import { useIdioma, useTema } from "@/components/shell/provedores";
import { IDIOMAS, type Idioma } from "@/lib/idioma";

const NOME: Record<Idioma, "pt" | "en" | "es"> = { "pt-BR": "pt", en: "en", es: "es" };

export function RodapeTrilho({ compacto }: { compacto: boolean }) {
  const { tema, alternar } = useTema();
  const { idioma, definir, t } = useIdioma();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!aberto) return;
    const fora = (evento: PointerEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false);
    };
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  return (
    <div className={`shrink-0 border-t border-[#2e5371] ${compacto ? "px-2 py-3" : "px-3 py-3"}`}>
      <div className={`mb-2 flex items-center gap-1 ${compacto ? "flex-col" : "justify-end"}`}>
        <div ref={raiz} className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={aberto}
            aria-controls={menuId}
            title={t.idioma}
            onClick={() => setAberto((atual) => !atual)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#cdcca8] transition-colors duration-150 hover:bg-[#2c3d4c]"
          >
            <span className="sr-only">{t.idioma}</span>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M4 12h16M12 4c2.2 2.4 3.2 5.1 3.2 8s-1 5.6-3.2 8c-2.2-2.4-3.2-5.1-3.2-8s1-5.6 3.2-8z" />
            </svg>
          </button>
          {aberto ? (
            <ul
              id={menuId}
              role="listbox"
              aria-label={t.idioma}
              className={`absolute z-40 m-0 w-44 list-none rounded-xl bg-[#1f3346] p-1 shadow-[0_8px_24px_rgb(0_0_0/0.28)] ring-1 ring-[#2e5371] ${compacto ? "bottom-0 left-full ml-2" : "bottom-full right-0 mb-2"}`}
            >
              {IDIOMAS.map((opcao) => {
                const ativo = opcao === idioma;
                return (
                  <li key={opcao} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={ativo}
                      onClick={() => {
                        definir(opcao);
                        setAberto(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors duration-150 ${ativo ? "bg-[#2c3d4c] font-medium text-[#f4f3ed]" : "font-medium text-[#afae89] hover:bg-[#2c3d4c]/70 hover:text-[#f4f3ed]"}`}
                    >
                      <BandeiraIdioma codigo={opcao} />
                      {t[NOME[opcao]]}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          onClick={alternar}
          aria-pressed={tema === "dark"}
          title={t.tema}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[#cdcca8] transition-colors duration-150 hover:bg-[#2c3d4c] ${tema === "dark" ? "bg-[#2c3d4c]" : ""}`}
        >
          <span className="sr-only">{t.tema}</span>
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className={`flex items-center rounded-xl bg-[#1f3346] ${compacto ? "justify-center py-1.5" : "gap-2.5 px-2.5 py-2"}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e34852] text-[13px] font-semibold text-white">L</span>
        <span className={compacto ? "sr-only" : "min-w-0"}>
          <span className="block truncate text-[13px] font-semibold leading-tight text-[#f4f3ed]">Levi Ribeiro Cury</span>
          <span className="block truncate text-[11px] leading-tight text-[#afae89]">levi.cury@minervafoods.com</span>
        </span>
      </div>
    </div>
  );
}
