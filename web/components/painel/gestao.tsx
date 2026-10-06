"use client";

import { indicador, moeda, moedaCurta, numero } from "@/lib/format";
import type { Indicador, Painel, VolumeBudget, VolumeComparacao, VolumeYoy } from "@/lib/painel";
import { Medidor } from "@/components/painel/gauge";
import { useIdioma } from "@/components/shell/provedores";

const ICONES: Record<string, string> = {
  users:
    '<path d="M16 19v-1.2a3.2 3.2 0 0 0-3.2-3.2H7.2A3.2 3.2 0 0 0 4 17.8V19"/><circle cx="10" cy="8" r="2.6"/><path d="M20 19v-1.1a2.8 2.8 0 0 0-2.2-2.7"/><path d="M16 5.4a2.6 2.6 0 0 1 0 4.9"/>',
  refresh:
    '<path d="M20 12a8 8 0 0 1-13.7 5.6L4 16"/><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8"/><path d="M20 4v4h-4"/><path d="M4 20v-4h4"/>',
  calculator:
    '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  dollar: '<path d="M12 3v18"/><path d="M16 7.5c0-1.5-1.8-2.5-4-2.5s-4 1-4 2.5 1.6 2.4 4 2.8 4 1.2 4 2.7-1.8 2.5-4 2.5-4-1-4-2.5"/>',
  scale: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M7.5 7 4.5 13h6L7.5 7z"/><path d="M16.5 7 13.5 13h6L16.5 7z"/>',
  truck:
    '<path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7"/><circle cx="7" cy="17.5" r="1.4"/><circle cx="17" cy="17.5" r="1.4"/>',
  headset:
    '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13h3v5H6a2 2 0 0 1-2-2z"/><path d="M20 13h-3v5h1a2 2 0 0 0 2-2z"/>',
};

const ICONE_VOLUME: Record<string, string> = {
  colaboradores: "users",
  transacoes: "refresh",
  realizado: "calculator",
  previsto: "dollar",
  oportunidade: "scale",
};

const ICONE_SETOR: Record<string, string> = {
  "Transações Logísticas": "truck",
  "Transações Financeiras": "calculator",
  "Administrativo de Pessoal": "users",
  "Gestão de Serviços e Atendimento": "headset",
};

function Icone({ nome }: { nome: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-azul"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONES[nome] ?? "" }}
    />
  );
}

function Secao({
  id,
  nome,
  leitura,
  chao,
  indice,
  crescer = false,
  classe = "",
  children,
}: {
  id: string;
  nome: string;
  leitura: string;
  chao: "branca" | "bege" | "mesa";
  indice: number;
  crescer?: boolean;
  classe?: string;
  children: React.ReactNode;
}) {
  const fundo = chao === "bege" ? "bg-[#efece3]" : "bg-white";
  const relevo =
    chao === "bege"
      ? "shadow-[inset_0_10px_24px_rgb(23_42_57/0.12)]"
      : "shadow-[0_1px_0_rgb(255_255_255),0_2px_4px_rgb(23_42_57/0.08),0_18px_36px_rgb(23_42_57/0.18)]";
  const aresta = chao === "mesa" ? "border-t-2 border-t-[#172a39]" : "";
  return (
    <section
      id={id}
      className={`sala flex min-h-0 flex-col rounded-2xl border border-[rgb(23_42_57/0.08)] px-3 py-1.5 ${relevo} ${fundo} ${aresta} ${crescer ? "flex-1 overflow-hidden" : "shrink-0"} ${classe}`}
      style={{ animationDelay: `${indice * 60}ms` }}
    >
      <header className="mb-1 flex shrink-0 items-baseline gap-3">
        <h2 className="m-0 text-[16px] font-semibold tracking-[-0.02em] text-[#172a39]">{nome}</h2>
        <p className="m-0 text-[13px] font-medium text-[#5a6c7d]">{leitura}</p>
      </header>
      <div className={crescer || classe.includes("h-full") ? "min-h-0 flex-1 overflow-hidden" : ""}>{children}</div>
    </section>
  );
}

type Semantica = "economia" | "crescimento" | "reducao" | "neutro";

function semanticaDe(rotulo: string): Semantica {
  const texto = rotulo.toLowerCase();
  if (/or[çc]ament|previst|budget|realizad/.test(texto)) return "economia";
  if (/custo|despesa|gasto|tempo|prazo|lead|sla|atend/.test(texto)) return "reducao";
  if (/colaborador|fte|headcount|pessoas/.test(texto)) return "reducao";
  return "crescimento";
}

function curto(ano: string) {
  return ano.slice(-2);
}

function Seta({ subir, forte, cor }: { subir: boolean; forte: boolean; cor: string }) {
  const traco = subir ? "M2 9 L6 4 L10 9" : "M2 5 L6 10 L10 5";
  const segundo = subir ? "M2 13 L6 8 L10 13" : "M2 9 L6 14 L10 9";
  return (
    <svg viewBox="0 0 12 16" className="h-3.5 w-3 shrink-0" aria-hidden="true">
      <path d={forte ? segundo : traco} fill="none" stroke={cor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {forte ? <path d={traco} fill="none" stroke={cor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  );
}

function Desvio({
  valor,
  rotulo,
  semantica,
  tolerancia = 0.5,
}: {
  valor: number | null;
  rotulo: string;
  semantica: Semantica;
  tolerancia?: number;
}) {
  if (valor == null || Number.isNaN(valor)) return null;
  const abs = Math.abs(valor);
  const neutro = semantica === "neutro" || abs < tolerancia;
  const bom = semantica === "economia" || semantica === "reducao" ? valor < 0 : semantica === "crescimento" ? valor > 0 : null;
  const cor = neutro || bom == null ? "var(--tinta-neutro)" : bom ? "var(--verde-desvio)" : "var(--vermelho-desvio)";
  const sinal = valor > 0 ? "+" : valor < 0 ? "−" : "";
  return (
    <p className="m-0 flex items-start justify-between gap-2" title={rotulo}>
      <span className="min-w-0 text-[11px] font-medium leading-snug text-[#5a6c7d]">{rotulo}</span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f7f9fb] px-1.5 py-0.5 text-[12px] font-semibold tabular-nums" style={{ color: cor }}>
        {abs < tolerancia ? null : <Seta subir={valor > 0} forte={abs >= 15} cor={cor} />}
        {valor === 0 ? "0%" : `${sinal}${numero(abs, 1)}%`}
      </span>
    </p>
  );
}

function Lado({ rotulo, valor, titulo, parte, trilha }: { rotulo: string; valor: string; titulo?: string; parte: number; trilha: string }) {
  return (
    <div className="min-w-0">
      <p className="m-0 text-[11px] font-medium leading-none text-[#5a6c7d]">{rotulo}</p>
      <p className="m-0 mt-1 whitespace-nowrap text-[13px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[#16234a]" title={titulo ?? valor}>
        {valor}
      </p>
      <div className="trilho-chao mt-1.5 h-1 overflow-hidden rounded-full">
        <div className={`h-full rounded-full ${trilha}`} style={{ width: `${parte}%` }} />
      </div>
    </div>
  );
}

function Confronto({
  periodo,
  rotulo,
  valor,
  semantica,
  tolerancia = 0.5,
  esquerdaRotulo,
  esquerdaValor,
  esquerdaTitulo,
  esquerdaNum,
  direitaRotulo,
  direitaValor,
  direitaTitulo,
  direitaNum,
  selo,
}: {
  periodo: string;
  rotulo?: string;
  valor?: number | null;
  semantica?: Semantica;
  tolerancia?: number;
  esquerdaRotulo: string;
  esquerdaValor: string;
  esquerdaTitulo?: string;
  esquerdaNum: number | null;
  direitaRotulo: string;
  direitaValor: string;
  direitaTitulo?: string;
  direitaNum: number | null;
  selo?: React.ReactNode;
}) {
  const maior = Math.max(Math.abs(esquerdaNum ?? 0), Math.abs(direitaNum ?? 0), 1);
  const parte = (n: number | null) => (n == null ? 0 : Math.max(8, Math.min(100, (Math.abs(n) / maior) * 100)));
  return (
    <div className="rounded-lg bg-[#eef2f6] px-2 py-1.5">
      <p className="m-0 text-[11px] font-semibold leading-none text-azul">{periodo}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <Lado rotulo={esquerdaRotulo} valor={esquerdaValor} titulo={esquerdaTitulo} parte={parte(esquerdaNum)} trilha="trilho-atual" />
        <Lado rotulo={direitaRotulo} valor={direitaValor} titulo={direitaTitulo} parte={parte(direitaNum)} trilha="trilho-base" />
      </div>
      <div className="mt-1.5">
        {selo ?? (rotulo && semantica ? <Desvio valor={valor ?? null} rotulo={rotulo} semantica={semantica} tolerancia={tolerancia} /> : null)}
      </div>
    </div>
  );
}

function valorVolume(item: VolumeBudget, valor: number | null) {
  return item.formato === "moeda" ? moedaCurta(valor) : numero(valor, 0);
}

function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <article className="painel-cartao flex h-full min-w-0 flex-col rounded-xl px-2.5 py-2">
      {children}
    </article>
  );
}

function Cabeca({ id, titulo }: { id: string; titulo: string; ano?: string }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <span className="mt-0.5">
        <Icone nome={ICONE_VOLUME[id] ?? "dollar"} />
      </span>
      <h3 className="m-0 min-h-[2.15rem] text-[13px] font-semibold leading-snug text-azul">{titulo}</h3>
    </div>
  );
}

function CartaoPessoas({ item, ano, anterior }: { item: VolumeYoy; ano: string; anterior: string }) {
  const { t } = useIdioma();
  return (
    <Cartao>
      <Cabeca id={item.id} titulo={item.label} />
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5">
        <Confronto
          periodo={`${ano} (YTD)`}
          rotulo={t.vsOrcado}
          valor={item.variacao_orcado ?? null}
          semantica="reducao"
          esquerdaRotulo={t.realizado}
          esquerdaValor={numero(item.atual, 0)}
          esquerdaNum={item.atual}
          direitaRotulo={t.orcadoAno}
          direitaValor={item.orcado == null ? "—" : numero(item.orcado, 0)}
          direitaNum={item.orcado ?? null}
        />
        <Confronto
          periodo={`${anterior} (YTD)`}
          rotulo={t.variacao}
          valor={item.variacao}
          semantica="reducao"
          esquerdaRotulo={`${ano} (YTD)`}
          esquerdaValor={numero(item.atual, 0)}
          esquerdaNum={item.atual}
          direitaRotulo={`${anterior} (YTD)`}
          direitaValor={numero(item.anterior, 0)}
          direitaNum={item.anterior}
        />
      </div>
    </Cartao>
  );
}

function CartaoBudget({ item, ano, anterior }: { item: VolumeBudget; ano: string; anterior: string }) {
  const { t } = useIdioma();
  const semantica = semanticaDe(item.label);
  const contra = `${curto(ano)} vs ${curto(anterior)}`;
  const moedaCheia = item.formato === "moeda";
  return (
    <Cartao>
      <Cabeca id={item.id} titulo={item.label} />
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5">
        <Confronto
          periodo={t.mesCurto}
          rotulo={`${t.desvioMes} (${contra})`}
          valor={item.var_mes}
          semantica={semantica}
          esquerdaRotulo={ano}
          esquerdaValor={valorVolume(item, item.mes)}
          esquerdaTitulo={moedaCheia ? moeda(item.mes) : undefined}
          esquerdaNum={item.mes}
          direitaRotulo={anterior}
          direitaValor={item.mes_anterior == null ? "-" : valorVolume(item, item.mes_anterior)}
          direitaTitulo={moedaCheia ? moeda(item.mes_anterior) : undefined}
          direitaNum={item.mes_anterior}
        />
        <Confronto
          periodo="YTD"
          rotulo={`${t.desvioYtd} (${contra})`}
          valor={item.var_ytd}
          semantica={semantica}
          esquerdaRotulo={ano}
          esquerdaValor={valorVolume(item, item.ytd)}
          esquerdaTitulo={moedaCheia ? moeda(item.ytd) : undefined}
          esquerdaNum={item.ytd}
          direitaRotulo={anterior}
          direitaValor={item.ytd_anterior == null ? "-" : valorVolume(item, item.ytd_anterior)}
          direitaTitulo={moedaCheia ? moeda(item.ytd_anterior) : undefined}
          direitaNum={item.ytd_anterior}
        />
        {item.var_vs_previsto_mes != null ? <Desvio valor={item.var_vs_previsto_mes} rotulo={t.vsMes} semantica="economia" tolerancia={0} /> : null}
        {item.var_vs_previsto_ytd != null ? <Desvio valor={item.var_vs_previsto_ytd} rotulo={t.vsYtd} semantica="economia" tolerancia={0} /> : null}
      </div>
    </Cartao>
  );
}

function moedaComSinal(valor: number | null) {
  if (valor == null || Number.isNaN(valor)) return "—";
  const sinal = valor > 0 ? "+" : valor < 0 ? "−" : "";
  return `${sinal}${moedaCurta(Math.abs(valor))}`;
}

function corEconomia(variacao: number | null) {
  if (variacao == null || Number.isNaN(variacao) || Math.abs(variacao) < 0.5) return "var(--tinta-numero)";
  return variacao < 0 ? "var(--verde-desvio)" : "var(--vermelho-desvio)";
}

function SeloValor({ valor, cor }: { valor: string; cor: string }) {
  return <span className="inline-flex rounded-full bg-[#f7f9fb] px-1.5 py-0.5 text-[12px] font-semibold tabular-nums" style={{ color: cor }}>{valor}</span>;
}

function CartaoOportunidade({ item, ano }: { item: VolumeComparacao; ano: string }) {
  const { t } = useIdioma();
  return (
    <Cartao>
      <Cabeca id={item.id} titulo={item.label} />
      <p className="m-0 mt-1 text-[12px] font-medium leading-snug text-[#5a6c7d]">{t.orcadoVs}</p>
      <p className="m-0 mt-1 text-[11px] font-semibold text-azul">{ano}</p>
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5">
        <Confronto
          periodo={t.mesCurto}
          esquerdaRotulo={t.orcado}
          esquerdaValor={moedaCurta(item.mes_orcado)}
          esquerdaTitulo={moeda(item.mes_orcado)}
          esquerdaNum={item.mes_orcado}
          direitaRotulo={t.realizado}
          direitaValor={moedaCurta(item.mes_realizado)}
          direitaTitulo={moeda(item.mes_realizado)}
          direitaNum={item.mes_realizado}
          selo={<SeloValor valor={moedaComSinal(item.delta_mes)} cor={corEconomia(item.var_mes)} />}
        />
        <Confronto
          periodo="YTD"
          esquerdaRotulo={t.orcado}
          esquerdaValor={moedaCurta(item.ytd_orcado)}
          esquerdaTitulo={moeda(item.ytd_orcado)}
          esquerdaNum={item.ytd_orcado}
          direitaRotulo={t.realizado}
          direitaValor={moedaCurta(item.ytd_realizado)}
          direitaTitulo={moeda(item.ytd_realizado)}
          direitaNum={item.ytd_realizado}
          selo={<SeloValor valor={moedaComSinal(item.delta_ytd)} cor={corEconomia(item.var_ytd)} />}
        />
      </div>
    </Cartao>
  );
}

function Bloco({ item, grande, amplo, estreito, rotulos, encaixe, id }: { item: Indicador; grande?: boolean; amplo?: boolean; estreito?: boolean; rotulos?: boolean; encaixe?: boolean; id: string }) {
  const { t } = useIdioma();
  const chaveCat =
    item.chave === "custo_por_transacao" ? "custo" : item.chave === "transacoes_por_fte" ? "produtividade" : item.chave === "nivel_servico" ? "qualidade" : null;
  const categoria = (grande || rotulos) && chaveCat ? t[chaveCat] : undefined;
  const mostraTitulo = grande || rotulos;
  const titulo = item.chave === "transacoes_por_fte" ? "Transações por FTE (Abs.)" : item.titulo;
  return (
    <div className={`flex min-w-0 items-center ${encaixe ? "h-auto w-auto flex-col justify-center gap-1" : "flex-col"} ${grande ? "" : encaixe ? "" : "w-full justify-center"}`}>
      {encaixe && rotulos ? (
        <div className="max-w-[16.5rem] text-center">
          {categoria ? <p className="m-0 text-[13px] font-semibold leading-tight text-[#172a39]">{categoria}</p> : null}
          <p className="m-0 text-[12px] font-medium leading-snug text-[#5a6c7d]">{titulo}</p>
        </div>
      ) : (
        <>
          {categoria ? <p className="m-0 text-[16px] font-semibold text-[#16234a]">{categoria}</p> : null}
          <p className={`m-0 text-center text-[13px] font-medium leading-snug text-[#5a6c7d] ${mostraTitulo ? "mb-0.5 mt-0.5 line-clamp-2" : "sr-only"}`}>
            {item.titulo}
          </p>
        </>
      )}
      <div className={encaixe ? "h-auto w-auto" : "w-full min-w-0"}>
        <Medidor
          id={id}
          valor={item.valor}
          meta={item.meta}
          ytd={item.ytd}
          status={item.status}
          direction={item.direction || (item.chave === "custo_por_transacao" ? "lower" : "higher")}
          valorTexto={indicador(item.chave, item.valor)}
          metaTexto={indicador(item.chave, item.meta)}
          ytdTexto={indicador(item.chave, item.ytd)}
          grande={grande}
          amplo={amplo}
          estreito={estreito}
          encaixe={encaixe}
          denso={!grande && !amplo && !estreito && !encaixe}
        />
      </div>
    </div>
  );
}

function CartaoVsAno({ item, ano, anterior }: { item: VolumeBudget; ano: string; anterior: string }) {
  const { t } = useIdioma();
  const contra = `${curto(ano)} vs ${curto(anterior)}`;
  return (
    <Cartao>
      <Cabeca id="realizado" titulo={t.realizadoVsAnterior} />
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5">
        <Confronto
          periodo={t.mesCurto}
          rotulo={`${t.desvioMes} (${contra})`}
          valor={item.var_mes}
          semantica="economia"
          esquerdaRotulo={ano}
          esquerdaValor={moedaCurta(item.mes)}
          esquerdaTitulo={moeda(item.mes)}
          esquerdaNum={item.mes}
          direitaRotulo={anterior}
          direitaValor={item.mes_anterior == null ? "-" : moedaCurta(item.mes_anterior)}
          direitaTitulo={moeda(item.mes_anterior)}
          direitaNum={item.mes_anterior}
        />
        <Confronto
          periodo="YTD"
          rotulo={`${t.desvioYtd} (${contra})`}
          valor={item.var_ytd}
          semantica="economia"
          esquerdaRotulo={ano}
          esquerdaValor={moedaCurta(item.ytd)}
          esquerdaTitulo={moeda(item.ytd)}
          esquerdaNum={item.ytd}
          direitaRotulo={anterior}
          direitaValor={item.ytd_anterior == null ? "-" : moedaCurta(item.ytd_anterior)}
          direitaTitulo={moeda(item.ytd_anterior)}
          direitaNum={item.ytd_anterior}
        />
      </div>
    </Cartao>
  );
}

function CartaoVsPrevisto({ realizado, previsto, ano }: { realizado: VolumeBudget; previsto: VolumeBudget; ano: string }) {
  const { t } = useIdioma();
  return (
    <Cartao>
      <Cabeca id="previsto" titulo={t.realizadoVsPrevisto} />
      <p className="m-0 mt-1 text-[11px] font-semibold text-azul">{ano}</p>
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5">
        <Confronto
          periodo={t.mesCurto}
          rotulo={t.vsMes}
          valor={realizado.var_vs_previsto_mes ?? null}
          semantica="economia"
          tolerancia={0}
          esquerdaRotulo={t.realizado}
          esquerdaValor={moedaCurta(realizado.mes)}
          esquerdaTitulo={moeda(realizado.mes)}
          esquerdaNum={realizado.mes}
          direitaRotulo={t.orcado}
          direitaValor={moedaCurta(previsto.mes)}
          direitaTitulo={moeda(previsto.mes)}
          direitaNum={previsto.mes}
        />
        <Confronto
          periodo="YTD"
          rotulo={t.vsYtd}
          valor={realizado.var_vs_previsto_ytd ?? null}
          semantica="economia"
          tolerancia={0}
          esquerdaRotulo={t.realizado}
          esquerdaValor={moedaCurta(realizado.ytd)}
          esquerdaTitulo={moeda(realizado.ytd)}
          esquerdaNum={realizado.ytd}
          direitaRotulo={t.orcado}
          direitaValor={moedaCurta(previsto.ytd)}
          direitaTitulo={moeda(previsto.ytd)}
          direitaNum={previsto.ytd}
        />
      </div>
    </Cartao>
  );
}

export function Gestao({ painel }: { painel: Painel }) {
  const { t } = useIdioma();
  const anoNumero = Number(painel.periodo_rotulo.match(/\d{4}/)?.[0]);
  const ano = Number.isFinite(anoNumero) ? String(anoNumero) : painel.periodo_rotulo;
  const anterior = Number.isFinite(anoNumero) ? String(anoNumero - 1) : "ano anterior";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-3 py-1.5">
      <Secao id="sala-volumetria" nome={t.sala.volumetria} leitura={t.sala.quantidade} chao="branca" indice={0}>
        <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 xl:grid-cols-5">
          {painel.volumetria.map((item) => {
            if (item.tipo === "yoy") return <CartaoPessoas key={item.id} item={item} ano={ano} anterior={anterior} />;
            if (item.id === "realizado" && item.tipo === "budget") {
              const previsto = painel.volumetria.find((outro): outro is VolumeBudget => outro.id === "previsto" && outro.tipo === "budget");
              return [
                <CartaoVsAno key="realizado-vs-ano" item={item} ano={ano} anterior={anterior} />,
                previsto ? <CartaoVsPrevisto key="realizado-vs-previsto" realizado={item} previsto={previsto} ano={ano} /> : null,
              ];
            }
            if (item.id === "previsto") return null;
            if (item.tipo === "comparacao") return <CartaoOportunidade key={item.id} item={item} ano={ano} />;
            return <CartaoBudget key={item.id} item={item} ano={ano} anterior={anterior} />;
          })}
        </div>
      </Secao>

      <div
        className="grid min-h-0 flex-1 gap-x-3"
        style={{
          gridTemplateColumns: "minmax(17.75rem, 0.86fr) minmax(0, 2.15fr)",
          gridTemplateRows: "auto minmax(0, 1fr)",
        }}
      >
        <header className="placa-estrategica flex items-end rounded-t-2xl border border-b-0 border-[rgb(23_42_57/0.08)] bg-white px-3 pb-1 pt-2 shadow-[0_1px_0_rgb(255_255_255)]" style={{ gridColumn: 1, gridRow: 1 }}>
          <div>
            <h2 id="sala-estrategicos" className="m-0 text-[16px] font-semibold leading-tight tracking-[-0.02em] text-[#172a39]">{t.sala.estrategicos}</h2>
            <p className="m-0 text-[13px] font-medium text-[#5a6c7d]">{t.sala.contra}</p>
          </div>
        </header>
        <header
          className="placa-tatica grid items-end gap-1.5 rounded-t-2xl border border-b-0 border-[rgb(23_42_57/0.08)] bg-white px-3 pb-1 pt-2 shadow-[0_1px_0_rgb(255_255_255)]"
          style={{ gridColumn: 2, gridRow: 1, gridTemplateColumns: "9.25rem repeat(3, minmax(0, 1fr))" }}
        >
          <div>
            <h2 id="sala-taticos" className="m-0 text-[16px] font-semibold leading-tight tracking-[-0.02em] text-[#172a39]">{t.sala.taticos}</h2>
            <p className="m-0 text-[13px] font-medium text-[#5a6c7d]">{t.sala.area}</p>
          </div>
          {painel.taticos.colunas.map((coluna) => (
            <div key={coluna} className="flex items-end justify-center gap-4">
              <p className="m-0 w-[8.5rem] text-center text-[12px] font-semibold leading-tight text-[#172a39]">{coluna}</p>
              <span className="w-[5.75rem] shrink-0" aria-hidden="true" />
            </div>
          ))}
        </header>

        <div className="placa-estrategica grid min-h-0 rounded-b-2xl border border-t-0 border-[rgb(23_42_57/0.08)] bg-white px-3 pb-2 shadow-[0_2px_4px_rgb(23_42_57/0.08),0_18px_36px_rgb(23_42_57/0.18)]" style={{ gridColumn: 1, gridRow: 2, gridTemplateRows: "repeat(3, minmax(0, 1fr))" }}>
          {painel.estrategicos.map((item) => (
            <div key={item.chave} className="flex min-h-0 items-center justify-center">
              <Bloco item={item} encaixe rotulos id={item.chave} />
            </div>
          ))}
        </div>

        <div
          className="placa-tatica grid min-h-0 rounded-b-2xl border border-t-0 border-[rgb(23_42_57/0.08)] bg-white px-3 pb-2 shadow-[0_2px_4px_rgb(23_42_57/0.08),0_18px_36px_rgb(23_42_57/0.18)]"
          style={{ gridColumn: 2, gridRow: 2, gridTemplateColumns: "9.25rem repeat(3, minmax(0, 1fr))", gridTemplateRows: "repeat(4, minmax(0, 1fr))" }}
        >
          {painel.taticos.linhas.map((linha) => (
            <div key={linha.setor} className="contents">
              <div className="flex min-h-0 items-center gap-2 pr-2 shadow-[inset_0_1px_0_rgb(23_42_57/0.08)]">
                <Icone nome={ICONE_SETOR[linha.setor] ?? "truck"} />
                <p className="m-0 text-[13px] font-medium leading-snug text-[#172a39]">{linha.setor}</p>
              </div>
              {linha.indicadores.map((ind) => (
                <div key={ind.chave} className="flex min-h-0 items-center justify-center shadow-[inset_0_1px_0_rgb(23_42_57/0.08)]">
                  <Bloco item={ind} encaixe id={`${linha.setor}-${ind.chave}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
