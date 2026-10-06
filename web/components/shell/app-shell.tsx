"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ROTAS, rotaAtual } from "@/lib/navigation";
import { GeoSelector } from "@/components/shell/geo-selector";
import { PeriodoReadout } from "@/components/shell/periodo-readout";
import { Provedores, useIdioma } from "@/components/shell/provedores";
import { RodapeTrilho } from "@/components/shell/rodape-trilho";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const CHAVE_NAV = {
  "/gestao": "gestao",
  "/operacionais": "operacionais",
  "/exportacao": "exportacao",
  "/sac": "sac",
} as const;

const TRACO: Record<string, string> = {
  "/gestao": "M5 17 V8 M12 17 V5 M19 17 V11",
  "/operacionais": "M5 7 h14 M5 12 h14 M5 17 h9",
  "/exportacao": "M5 12 h10 M12 8 l4 4 -4 4",
  "/sac": "M8 15 a4 4 0 1 1 8 0 v2 h-2",
};

function MarcaRota({ href }: { href: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
      <path d={TRACO[href]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Provedores>
      <Casca>{children}</Casca>
    </Provedores>
  );
}

function Casca({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const rota = rotaAtual(pathname);
  const visao = params.get("visao");
  const [aberto, setAberto] = useState(true);

  useEffect(() => {
    if (window.localStorage.getItem("painel-trilho") === "fechado") setAberto(false);
  }, []);

  function alternarTrilho() {
    setAberto((atual) => {
      window.localStorage.setItem("painel-trilho", atual ? "fechado" : "aberto");
      return !atual;
    });
  }

  function destino(href: string) {
    return visao ? `${href}?visao=${encodeURIComponent(visao)}` : href;
  }

  const reduzido = useReducedMotion();
  const { t } = useIdioma();

  return (
    <div className="painel-palco flex h-screen flex-col overflow-hidden bg-[#fafaf7]">
      <svg className="painel-grain pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.04] mix-blend-multiply" aria-hidden="true">
        <filter id="grain-sala">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" result="ruido" />
          <feColorMatrix in="ruido" type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-sala)" />
      </svg>
      <header className="painel-topo relative z-30 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-[#e8e5da] bg-[#fafaf7] px-5">
        <div className="flex min-w-0 items-center gap-4">
          <img src="/brand/logo-principal.png" alt="Minerva Foods" className="painel-marca h-9 w-auto shrink-0" />
          <button
            type="button"
            onClick={alternarTrilho}
            aria-expanded={aberto}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e8e5da] bg-[#f4f3ed] text-[#172a39] transition-colors duration-150 hover:bg-white md:flex"
          >
            <span className="sr-only">{aberto ? t.recolher : t.abrir}</span>
            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform duration-300 ${aberto ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M14 6 L8 12 L14 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <h1 className="sr-only">{rota.rotulo}</h1>
        <div className="painel-periodo flex h-7 shrink-0 items-center rounded-lg bg-[#f4f3ed] px-2.5">
          <PeriodoReadout />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside
        className={`painel-trilho relative z-20 flex shrink-0 flex-col overflow-visible border-r border-white/10 bg-[#172a39] transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${aberto ? "md:w-72" : "md:w-[4.5rem]"}`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav className={`mt-3 flex flex-col gap-1 ${aberto ? "px-2" : "px-1.5"}`} aria-label="Páginas do painel">
          {ROTAS.map((item) => {
            const ativo = rota.href === item.href;
            return (
              <Link
                key={item.href}
                href={destino(item.href)}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex h-10 items-center gap-3 rounded-lg text-[14px] no-underline transition-colors duration-150 ${ativo ? "bg-[#1f3346] font-semibold text-[#f4f3ed]" : "font-medium text-[#afae89] hover:bg-[#2c3d4c] hover:text-[#f4f3ed]"} ${aberto ? "px-2.5" : "md:justify-center md:px-0"}`}
              >
                {ativo ? (
                  <motion.span
                    layoutId={reduzido ? undefined : "nav-trilho"}
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#e34852]"
                    transition={{ duration: 0.22, ease: EASE }}
                  />
                ) : null}
                <span className="inline-flex shrink-0">
                  <MarcaRota href={item.href} />
                </span>
                <span className={aberto ? "" : "md:sr-only"}>{t.nav[CHAVE_NAV[item.href]]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 shrink-0">
          <GeoSelector compacto={!aberto} />
        </div>
        <div className="min-h-4 flex-1" />
        </div>
        <RodapeTrilho compacto={!aberto} />
      </aside>

      <div className="painel-campo relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div aria-hidden="true" className="painel-luz pointer-events-none absolute -inset-x-[10%] top-0 h-[42%]" />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden [&>*]:min-h-0 [&>*]:flex-1 [&>*]:overflow-hidden">{children}</main>
      </div>
      </div>
    </div>
  );
}
