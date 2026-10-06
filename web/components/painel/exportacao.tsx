import { numero } from "@/lib/format";
import type { Kpi, Painel } from "@/lib/painel";
import type { Visao } from "@/lib/navigation";
import { Medidor } from "@/components/painel/gauge";
import { Vazio } from "@/components/painel/secao";

function grupos(lista: Kpi[]) {
  const mapa = new Map<string, Kpi[]>();
  for (const kpi of lista) {
    const chave = kpi.destino || "Indicadores";
    const atual = mapa.get(chave);
    if (atual) atual.push(kpi);
    else mapa.set(chave, [kpi]);
  }
  return [...mapa.entries()];
}

function Linha({ kpi }: { kpi: Kpi }) {
  const semDado = kpi.mes == null;
  const fora = !semDado && (kpi.mes_status === "red" || kpi.mes_status === "yellow");
  return (
    <div className={`flex min-h-0 flex-1 items-center gap-3 border-b border-azul/10 px-3 text-azul`}>
      <h3 className={`m-0 min-w-0 flex-1 text-[16px] leading-snug ${fora ? "font-semibold" : "font-medium"}`}>{kpi.titulo}</h3>
      <span className="w-16 shrink-0">
        <Medidor
          id={kpi.titulo}
          valor={kpi.mes}
          meta={kpi.meta}
          ytd={kpi.ytd}
          direction="higher"
          status={semDado ? "gray" : kpi.mes_status}
          valorTexto={semDado ? "—" : numero(kpi.mes, 1)}
          metaTexto={kpi.meta == null ? "—" : numero(kpi.meta, 1)}
          ytdTexto={kpi.ytd == null ? "—" : numero(kpi.ytd, 1)}
          linha
          miudo
        />
      </span>
      <span className={`w-20 shrink-0 text-right text-[1.35rem] font-semibold leading-none tabular-nums ${kpi.mes_status === "red" ? "text-vermelho" : ""}`}>
        {semDado ? "—" : numero(kpi.mes, 1)}
      </span>
    </div>
  );
}

export function Exportacao({ painel, visao }: { painel: Painel; visao: Visao }) {
  if (visao === "BR+PY") {
    return <Vazio>Exportação não tem consolidado. Escolha Brasil ou o Hub Latam.</Vazio>;
  }
  const lista = painel.exportacao[visao] ?? [];
  if (!lista.length) return <Vazio>Sem indicadores de exportação nesta visão.</Vazio>;
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden p-3 md:grid-cols-2 xl:grid-cols-4">
      {grupos(lista).map(([destino, kpis]) => (
        <section key={destino} className="painel-bloco flex min-h-0 flex-col overflow-hidden">
          <h2 className="m-0 shrink-0 border-b border-azul/10 px-3 py-2 text-[14px] font-semibold leading-tight text-azul">{destino}</h2>
          <div className="flex min-h-0 flex-1 flex-col">
            {kpis.map((kpi) => (
              <Linha key={`${destino}-${kpi.titulo}`} kpi={kpi} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
