"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { numero, valorCard, ytdCard } from "@/lib/format";
import type { CardOperacional, Painel } from "@/lib/painel";
import { Medidor } from "@/components/painel/gauge";
import { ModalOperacional } from "@/components/painel/modal-operacional";
import { Vazio } from "@/components/painel/secao";

function Linha({ card, onAbrir }: { card: CardOperacional; onAbrir: () => void }) {
  const fora = card.status === "red" || card.status === "yellow";
  const meta = card.meta_rotulo || (card.meta == null ? "—" : String(card.meta));
  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`flex min-h-0 w-full flex-1 items-center gap-3 border-b border-azul/10 px-3 text-left transition-colors duration-200 hover:bg-nevoa/60 text-azul`}
    >
      <span className={`min-w-0 flex-1 text-[15px] leading-tight ${fora ? "font-semibold" : "font-medium"}`}>{card.nome}</span>
      <span className="w-16 shrink-0">
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
          linha
          miudo
        />
      </span>
      <span className={`w-24 shrink-0 text-right text-[1.35rem] font-semibold leading-none tabular-nums ${card.status === "red" ? "text-vermelho" : ""}`}>
        {valorCard(card)}
      </span>
      {fora && card.fora != null ? (
        <span className="hidden w-28 shrink-0 text-right text-[12px] font-medium tabular-nums text-vermelho sm:block">
          {numero(card.fora, 0)} fora
        </span>
      ) : (
        <span className="hidden w-28 shrink-0 sm:block" />
      )}
    </button>
  );
}

export function Operacionais({ painel }: { painel: Painel }) {
  const lista = useMemo(
    () => painel.operacionais.flatMap((grupo) => grupo.cards.map((card) => ({ ...card, setor: card.setor || grupo.setor }))),
    [painel.operacionais],
  );
  const [aberto, setAberto] = useState<number | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  if (!lista.length) return <Vazio>Nenhum indicador operacional nesta visão.</Vazio>;

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden p-3 md:grid-cols-2 xl:grid-cols-4">
      {painel.operacionais.map((grupo) => (
        <section key={grupo.setor} className="painel-bloco flex min-h-0 flex-col overflow-hidden">
          <h2 className="m-0 shrink-0 border-b border-azul/10 px-3 py-2 text-[15px] font-semibold leading-tight text-azul">{grupo.setor}</h2>
          <div className="flex min-h-0 flex-1 flex-col">
            {grupo.cards.map((card) => {
              const indice = lista.findIndex((item) => item.nome === card.nome && item.setor === grupo.setor);
              return <Linha key={card.nome} card={{ ...card, setor: grupo.setor }} onAbrir={() => setAberto(indice)} />;
            })}
          </div>
        </section>
      ))}
      {montado && aberto != null
        ? createPortal(
            <ModalOperacional cards={lista} indice={aberto} onIndice={setAberto} onFechar={() => setAberto(null)} />,
            document.body,
          )
        : null}
    </div>
  );
}
