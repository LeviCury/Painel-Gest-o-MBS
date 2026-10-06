"use client";

import { useEffect, useRef } from "react";
import { numero, tomStatus, valorCard, ytdCard } from "@/lib/format";
import type { CardOperacional } from "@/lib/painel";
import { Medidor, SerieMensal } from "@/components/painel/gauge";
import { useIdioma } from "@/components/shell/provedores";

const STATUS = {
  green: "noAlvo",
  yellow: "atencao",
  red: "fora",
  gray: "semMeta",
} as const;

export function ModalOperacional({
  cards,
  indice,
  onIndice,
  onFechar,
}: {
  cards: CardOperacional[];
  indice: number;
  onIndice: (indice: number) => void;
  onFechar: () => void;
}) {
  const card = cards[indice];
  const { t } = useIdioma();
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    painel.current?.focus();
  }, [indice]);

  useEffect(() => {
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
      if (evento.key === "ArrowLeft") onIndice((indice - 1 + cards.length) % cards.length);
      if (evento.key === "ArrowRight") onIndice((indice + 1) % cards.length);
    }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [cards.length, indice, onFechar, onIndice]);

  if (!card) return null;
  const meta = card.meta_rotulo || (card.meta == null ? "—" : String(card.meta));
  const estado = t[STATUS[card.status as keyof typeof STATUS] ?? "semMeta"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-azul/40 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        tabIndex={-1}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-branco shadow-lift outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-nevoa px-5 py-4">
          <div>
            <p className="m-0 text-[12px] font-medium text-azul-medio">{card.setor}</p>
            <h2 id="titulo-modal" className="m-0 mt-1 text-lg font-semibold leading-snug tracking-[-0.02em] text-azul">
              {card.nome}
            </h2>
          </div>
          <button type="button" onClick={onFechar} className="rounded-sm px-2 py-1 text-sm font-semibold text-azul">
            {t.fechar}
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5">
          <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
            <Medidor
              id={card.nome}
              valor={card.mes}
              meta={card.meta}
              ytd={card.ytd}
              direction={card.direction}
              status={card.status}
              valorTexto={valorCard(card)}
              metaTexto={meta}
              ytdTexto={ytdCard(card)}
            />
            <div>
              <p className={`m-0 text-[2.5rem] font-semibold leading-none tracking-[-0.04em] tabular-nums ${tomStatus(card.status)}`}>
                {valorCard(card)}
              </p>
              <p className="m-0 mt-2 text-[13px] font-medium text-azul">{estado}</p>
              <p className="m-0 mt-2 text-[13px] leading-snug text-azul-medio tabular-nums">
                Meta {meta}
                <span className={`ml-3 ${tomStatus(card.status_ytd)}`}>YTD {ytdCard(card)}</span>
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-nevoa sm:grid-cols-4">
            <Campo rotulo="Dentro" valor={numero(card.dentro, 0)} />
            <Campo rotulo="Fora" valor={numero(card.fora, 0)} />
            <Campo rotulo={t.volume} valor={numero(card.volume, 0)} />
            <Campo rotulo={t.volumeYtd} valor={numero(card.volume_ytd, 0)} />
          </dl>
          <div className="mt-6">
            <SerieMensal pontos={card.serie ?? []} />
          </div>
        </div>
        <footer className="flex items-center justify-between border-t border-nevoa px-5 py-3">
          <button type="button" onClick={() => onIndice((indice - 1 + cards.length) % cards.length)} className="text-[13px] font-semibold text-azul">
            {t.anterior}
          </button>
          <span className="text-[12px] tabular-nums text-azul-medio">
            {indice + 1} / {cards.length}
          </span>
          <button type="button" onClick={() => onIndice((indice + 1) % cards.length)} className="text-[13px] font-semibold text-azul">
            {t.proximo}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-branco px-3 py-3">
      <dt className="m-0 text-[11px] font-medium text-azul-medio">{rotulo}</dt>
      <dd className="m-0 mt-1 text-[15px] font-semibold tabular-nums text-azul">{valor}</dd>
    </div>
  );
}
