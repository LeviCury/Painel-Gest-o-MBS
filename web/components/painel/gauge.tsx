"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useIdioma } from "@/components/shell/provedores";

/** Posição no arco: 100 é a meta. Só desenho, o número exibido continua o que a API mandou. */
function posicao(valor: number | null, meta: number | null): number | null {
  if (valor == null || meta == null || meta === 0) return null;
  return Math.min(150, Math.max(0, (valor / meta) * 100));
}

function ponto(p: number, raio: number) {
  const angulo = ((180 - (p / 150) * 180) * Math.PI) / 180;
  return { x: 100 + raio * Math.cos(angulo), y: 92 - raio * Math.sin(angulo) };
}

function arco(ate: number) {
  const inicio = ponto(0, 76);
  const fim = ponto(Math.max(ate, 0.01), 76);
  return `M ${inicio.x.toFixed(2)} ${inicio.y.toFixed(2)} A 76 76 0 0 1 ${fim.x.toFixed(2)} ${fim.y.toFixed(2)}`;
}

const COR: Record<string, string> = {
  red: "#e83948",
  yellow: "#bf404f",
  green: "#2c5372",
  gray: "#5d86a5",
};

export function Gauge({
  valor,
  meta,
  ytd,
  status,
  compacto = false,
}: {
  valor: number | null;
  meta: number | null;
  ytd: number | null;
  status: string;
  compacto?: boolean;
}) {
  const mes = posicao(valor, meta);
  const acumulado = posicao(ytd, meta);
  const metaTick = ponto(100, 86);
  const ytdTick = acumulado == null ? null : ponto(acumulado, 76);
  const cor = COR[status] ?? COR.gray;

  return (
    <svg viewBox="0 0 200 108" className={compacto ? "h-16 w-full" : "h-24 w-full"} aria-hidden="true">
      <path d={arco(150)} stroke="#eaeff5" strokeWidth="14" fill="none" strokeLinecap="round" />
      {mes != null && mes > 0 ? (
        <path d={arco(mes)} stroke={cor} strokeWidth="14" fill="none" strokeLinecap="round" />
      ) : null}
      {meta != null && meta !== 0 ? (
        <polygon
          points={`${metaTick.x.toFixed(1)},${(metaTick.y - 7).toFixed(1)} ${(metaTick.x - 4).toFixed(1)},${(metaTick.y + 3).toFixed(1)} ${(metaTick.x + 4).toFixed(1)},${(metaTick.y + 3).toFixed(1)}`}
          fill="#c7b475"
        />
      ) : null}
      {ytdTick ? (
        <line
          x1="100"
          y1="92"
          x2={ytdTick.x.toFixed(1)}
          y2={ytdTick.y.toFixed(1)}
          stroke="#2c5372"
          strokeWidth="1.6"
          strokeDasharray="2 2"
        />
      ) : null}
      <circle cx="100" cy="92" r="3.5" fill="#2c5372" />
    </svg>
  );
}

const ESCALA = 150;

function pontas(p: number, interno: number, externo: number) {
  return { dentro: pontoEscala(p, interno), fora: pontoEscala(p, externo) };
}

function pontoEscala(p: number, raio: number) {
  const limitado = Math.min(ESCALA, Math.max(0, p));
  const angulo = ((180 - (limitado / ESCALA) * 180) * Math.PI) / 180;
  return { x: 100 + raio * Math.cos(angulo), y: 92 - raio * Math.sin(angulo) };
}

const RAIO_ARCO = 76;

function seta(p: number, ponta: number, base: number, meia: number) {
  const topo = pontoEscala(p, ponta);
  const a = pontoEscala(p - meia, base);
  const b = pontoEscala(p + meia, base);
  return `${topo.x.toFixed(1)},${topo.y.toFixed(1)} ${a.x.toFixed(1)},${a.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

function trilhaAte(ate: number) {
  const inicio = pontoEscala(0, RAIO_ARCO);
  const fim = pontoEscala(Math.max(ate, 0.01), RAIO_ARCO);
  return `M ${inicio.x.toFixed(2)} ${inicio.y.toFixed(2)} A ${RAIO_ARCO} ${RAIO_ARCO} 0 0 1 ${fim.x.toFixed(2)} ${fim.y.toFixed(2)}`;
}

function useCurso(destino: number | null) {
  const mostrado = useRef<number | null>(destino);
  const [curso, setCurso] = useState(destino ?? 0);

  useLayoutEffect(() => {
    if (destino == null) {
      mostrado.current = null;
      setCurso(0);
      return;
    }
    const origem = mostrado.current == null ? destino : mostrado.current;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzido || origem === destino) {
      mostrado.current = destino;
      setCurso(destino);
      return;
    }
    const estado = { n: origem };
    const tween = gsap.to(estado, {
      n: destino,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        mostrado.current = estado.n;
        setCurso(estado.n);
      },
    });
    return () => {
      tween.kill();
    };
  }, [destino]);

  return curso;
}

/** Medidor do HTML: arco 0–150, 100 é a meta. As cores são as do desenho do diretor. */
export function Medidor({
  id,
  valor,
  meta,
  ytd,
  direction,
  valorTexto,
  metaTexto,
  ytdTexto,
  status = "green",
  grande = false,
  linha = false,
  cheio = false,
  miudo = false,
  denso = false,
  amplo = false,
  estreito = false,
  encaixe = false,
}: {
  id: string;
  valor: number | null;
  meta: number | null;
  ytd: number | null;
  direction: string;
  valorTexto: string;
  metaTexto: string;
  ytdTexto: string;
  status?: string;
  grande?: boolean;
  linha?: boolean;
  cheio?: boolean;
  miudo?: boolean;
  /** Táticos: percentual no vão do arco e legenda Mês / Meta / YTD abaixo. */
  denso?: boolean;
  amplo?: boolean;
  estreito?: boolean;
  encaixe?: boolean;
}) {
  const { t } = useIdioma();
  const semMeta = meta == null || meta === 0 || valor == null;
  const pct = semMeta ? null : (valor / meta) * 100;
  const pctYtd = meta == null || meta === 0 || ytd == null || ytd <= 0 ? null : (ytd / meta) * 100;
  const curso = useCurso(pct);
  const menor = direction === "lower";
  const gradId = `arco-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const agulha = pct == null ? null : pontas(curso, 46, 86);
  const ytdP = pctYtd == null ? null : pontas(Math.min(pctYtd, ESCALA), 46, 84);
  const pctExato = pct == null ? "—" : `${numeroPct(pct)}%`;
  const pctCentral = pct == null ? "—" : `${Math.round(pct).toLocaleString("pt-BR")}%`;
  const largura = miudo
    ? "max-w-[72px]"
    : grande
      ? "max-w-[132px]"
      : amplo
        ? "max-w-[9rem]"
        : estreito
          ? "max-w-[6.75rem]"
      : denso
        ? "max-w-[4.5rem]"
        : linha
          ? "max-w-[104px]"
          : cheio
            ? "max-w-none"
            : "max-w-[160px]";

  return (
    <div
      data-medidor={id}
      className={`medidor group/medidor relative flex rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-azul ${encaixe ? "w-auto items-center gap-4" : `flex-col items-center ${amplo ? "w-full max-w-[9rem]" : ""}`}`}
      tabIndex={0}
      aria-label={`${pctExato}. ${t.mes} ${valorTexto}. ${t.meta} ${metaTexto}. YTD ${ytdTexto}.`}
    >
      <div
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[calc(100%-8px)] left-1/2 z-20 w-max -translate-x-1/2 translate-y-1 rounded-xl bg-branco px-3 py-2 text-left opacity-0 shadow-lift ring-1 ring-azul/10 transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/medidor:translate-y-0 group-hover/medidor:opacity-100 group-focus-visible/medidor:translate-y-0 group-focus-visible/medidor:opacity-100"
      >
        <p className="m-0 text-[13px] font-semibold tabular-nums text-[#16234a]">{pctExato} {t.daMeta}</p>
        <p className="m-0 mt-1 text-[12px] tabular-nums text-[#16234a]">
          {t.mes} {valorTexto} · {t.meta} {metaTexto} · YTD {ytdTexto}
        </p>
      </div>
      <div className={`relative ${encaixe ? "h-[4.75rem] w-[8.5rem] shrink-0" : `mx-auto w-full ${largura}`}`}>
        <svg viewBox="0 0 200 112" className={encaixe ? "h-full w-full" : "w-full"} aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              {menor ? (
                <>
                  <stop offset="0%" stopColor="#99B81D" />
                  <stop offset="66.6%" stopColor="#FBDF00" />
                  <stop offset="93.3%" stopColor="#B90302" />
                  <stop offset="100%" stopColor="#B90302" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#B90302" />
                  <stop offset="66.6%" stopColor="#FBDF00" />
                  <stop offset="93.3%" stopColor="#99B81D" />
                  <stop offset="100%" stopColor="#99B81D" />
                </>
              )}
            </linearGradient>
          </defs>
          <path d={trilhaAte(ESCALA)} stroke={`url(#${gradId})`} strokeWidth="17" fill="none" />
          {pctYtd != null ? (
            <polygon points={seta(Math.min(pctYtd, ESCALA), RAIO_ARCO + 4, RAIO_ARCO + 14, 5)} fill="var(--traco-medidor)" />
          ) : null}
          <polygon points={seta(100, RAIO_ARCO + 6, RAIO_ARCO + 16, 7)} fill="#c7b475" />
          {ytdP ? (
            <line x1={ytdP.dentro.x.toFixed(1)} y1={ytdP.dentro.y.toFixed(1)} x2={ytdP.fora.x.toFixed(1)} y2={ytdP.fora.y.toFixed(1)} stroke="var(--traco-medidor)" strokeWidth="2" strokeDasharray="2 2" strokeLinecap="round" />
          ) : null}
          {agulha ? (
            <line x1={agulha.dentro.x.toFixed(1)} y1={agulha.dentro.y.toFixed(1)} x2={agulha.fora.x.toFixed(1)} y2={agulha.fora.y.toFixed(1)} stroke="#ff1744" strokeWidth="2.5" strokeLinecap="round" />
          ) : null}
          <circle cx="100" cy="92" r="3.2" fill="var(--traco-medidor)" />
        </svg>
        {linha ? null : (
          <p
            className={`valor-gauge pointer-events-none absolute left-1/2 top-[70%] m-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-semibold leading-none tracking-[-0.03em] tabular-nums ${encaixe ? "text-[18px]" : grande ? "text-[1.25rem]" : amplo ? "text-[15px]" : estreito ? "text-[13px]" : denso ? "text-[12px]" : "text-[1.35rem]"}`}
            style={{ color: status === "green" ? "var(--verde-desvio)" : status === "red" || status === "yellow" ? "var(--vermelho-desvio)" : "var(--tinta-numero)" }}
          >
            {pctCentral}
          </p>
        )}
      </div>
      {linha ? null : (
      <div className={`flex justify-center ${encaixe ? "w-[5.75rem] shrink-0 flex-col items-start gap-0.5" : amplo ? "mt-0.5 w-full flex-col items-center gap-0" : denso || estreito ? "w-full flex-nowrap gap-1" : grande ? "mt-1 w-full gap-4" : "mt-0.5 w-full gap-2"}`}>
        <Marcador cor="#e83948" tracejado={false} rotulo={t.mes} valor={valorTexto} grande={grande} compacto={encaixe || denso || amplo || estreito || grande} miudo={encaixe} />
        <Marcador cor="#c7b475" tracejado={false} rotulo={t.meta} valor={metaTexto} grande={grande} compacto={encaixe || denso || amplo || estreito || grande} miudo={encaixe} />
        <Marcador cor="var(--traco-medidor)" tracejado rotulo="YTD" valor={ytdTexto} grande={grande} compacto={encaixe || denso || amplo || estreito || grande} miudo={encaixe} />
      </div>
      )}
    </div>
  );
}

function numeroPct(valor: number) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function Marcador({
  cor,
  tracejado,
  rotulo,
  valor,
  grande,
  compacto = false,
  miudo = false,
}: {
  cor: string;
  tracejado: boolean;
  rotulo: string;
  valor: string;
  grande?: boolean;
  compacto?: boolean;
  miudo?: boolean;
}) {
  const marca = (
    <span
      className="inline-block h-[2px] w-2.5 shrink-0 rounded-full"
      style={{
        background: tracejado ? `repeating-linear-gradient(90deg, ${cor} 0 3px, transparent 3px 5px)` : cor,
      }}
    />
  );
  if (compacto) {
    return (
      <p className={`m-0 inline-flex items-baseline gap-1 whitespace-nowrap leading-none ${miudo ? "text-[11px]" : grande ? "text-[16px]" : "text-[12px]"}`}>
        {marca}
        <span className="font-semibold text-[#2c5372]">{rotulo}</span>
        <span className="font-semibold tabular-nums text-[#16234a]">{valor}</span>
      </p>
    );
  }
  return (
    <div className="text-center">
      <p className="m-0 flex items-center justify-center gap-1 text-[13px] font-semibold text-[#2c5372]">
        {marca}
        {rotulo}
      </p>
      <p className={`m-0 font-semibold tabular-nums text-[#16234a] ${grande ? "text-[17px]" : "text-[15px]"}`}>{valor}</p>
    </div>
  );
}

function pontoDial(p: number, raio: number) {
  const limitado = Math.min(ESCALA, Math.max(0, p));
  const angulo = ((180 - (limitado / ESCALA) * 180) * Math.PI) / 180;
  return { x: 100 + raio * Math.cos(angulo), y: 98 - raio * Math.sin(angulo) };
}

function trilhaDial(ate: number) {
  const inicio = pontoDial(0, 74);
  const fim = pontoDial(Math.max(ate, 0.01), 74);
  return `M ${inicio.x.toFixed(2)} ${inicio.y.toFixed(2)} A 74 74 0 0 1 ${fim.x.toFixed(2)} ${fim.y.toFixed(2)}`;
}

/** Velocímetro do palco: arco inteiro colorido, agulha só do mês, meta em dourado. */
export function Velocimetro({
  id,
  nome,
  valor,
  meta,
  ytd,
  direction,
  valorTexto,
  metaTexto,
  ytdTexto,
}: {
  id: string;
  nome: string;
  valor: number | null;
  meta: number | null;
  ytd: number | null;
  direction: string;
  valorTexto: string;
  metaTexto: string;
  ytdTexto: string;
}) {
  const { t } = useIdioma();
  const semLeitura = meta == null || meta === 0 || valor == null;
  const pct = semLeitura ? null : (valor / meta) * 100;
  const curso = useCurso(pct);
  const menor = direction === "lower";
  const gradId = `palco-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ponta = pct == null ? null : pontoDial(curso, 74);
  const raiz = pct == null ? null : pontoDial(curso, 60);
  const metaA = pontoDial(100, 66);
  const metaB = pontoDial(100, 84);
  const zero = pontoDial(0, 74);
  const cento = pontoDial(ESCALA, 74);
  const pctTexto = pct == null ? "—" : `${numeroPct(pct)}%`;

  return (
    <figure
      className="m-0 flex flex-col items-center"
      aria-label={`${nome}. ${pctTexto}. ${t.mes} ${valorTexto}. ${t.meta} ${metaTexto}. YTD ${ytdTexto}.`}
    >
      <figcaption className="m-0 text-[15px] font-light text-azul">{nome}</figcaption>
      <div className="relative mt-1 w-full">
        <svg viewBox="-10 0 220 120" className="w-full overflow-visible font-sans" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              {menor ? (
                <>
                  <stop offset="0%" stopColor="#99B81D" />
                  <stop offset="66.6%" stopColor="#FBDF00" />
                  <stop offset="100%" stopColor="#B90302" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#B90302" />
                  <stop offset="66.6%" stopColor="#FBDF00" />
                  <stop offset="100%" stopColor="#99B81D" />
                </>
              )}
            </linearGradient>
          </defs>
          <path d={trilhaDial(ESCALA)} stroke={`url(#${gradId})`} strokeWidth="13" fill="none" strokeLinecap="butt" />
          {meta != null && meta !== 0 ? (
            <line
              x1={metaA.x.toFixed(1)}
              y1={metaA.y.toFixed(1)}
              x2={metaB.x.toFixed(1)}
              y2={metaB.y.toFixed(1)}
              stroke="#C7B475"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          ) : null}
          {ponta && raiz ? (
            <line
              x1={raiz.x.toFixed(1)}
              y1={raiz.y.toFixed(1)}
              x2={ponta.x.toFixed(1)}
              y2={ponta.y.toFixed(1)}
              stroke="#ff1744"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          ) : null}
          <text x={zero.x} y="114" textAnchor="middle" fill="#2C5372" fontSize="12" fontWeight="500">
            0
          </text>
          <text x={cento.x} y="114" textAnchor="middle" fill="#2C5372" fontSize="12" fontWeight="500">
            150
          </text>
        </svg>
        <p className="pointer-events-none absolute inset-x-0 top-[58%] m-0 text-center text-[1.65rem] font-semibold leading-none tracking-[-0.03em] text-azul tabular-nums">
          {pctTexto}
        </p>
      </div>
      <div className="mt-1 grid w-full grid-cols-3 gap-1 text-center">
        <Leitura rotulo={t.mes} valor={valorTexto} />
        <Leitura rotulo={t.meta} valor={metaTexto} />
        <Leitura rotulo="YTD" valor={ytdTexto} />
      </div>
    </figure>
  );
}

function Leitura({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="m-0 text-[11px] font-light text-azul">{rotulo}</p>
      <p className="m-0 text-[13px] font-semibold tabular-nums text-azul">{valor}</p>
    </div>
  );
}

const MESES = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function SerieMensal({
  pontos,
}: {
  pontos: { mes: number; resultado: number | null }[];
}) {
  const { t } = useIdioma();
  const validos = pontos.filter((p) => p.resultado != null) as { mes: number; resultado: number }[];
  if (validos.length < 2) return null;
  const maior = Math.max(...validos.map((p) => p.resultado), 1);
  return (
    <div>
      <p className="m-0 text-[13px] font-semibold text-azul">{t.serie}</p>
      <div className="mt-3 flex h-28 items-end gap-1">
        {MESES.map((rotulo, indice) => {
          const pontoMes = validos.find((p) => p.mes === indice + 1);
          const altura = pontoMes ? Math.max(6, (pontoMes.resultado / maior) * 100) : 0;
          return (
            <div key={rotulo} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <div
                  className="w-full rounded-sm bg-azul"
                  style={{ height: `${altura}%`, opacity: pontoMes ? 1 : 0.15 }}
                />
              </div>
              <span className="text-[10px] font-medium text-azul">{rotulo}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
