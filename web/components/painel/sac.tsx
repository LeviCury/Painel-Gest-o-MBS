import { numero } from "@/lib/format";
import type { Kpi, Painel } from "@/lib/painel";
import { Medidor } from "@/components/painel/gauge";
import { Vazio } from "@/components/painel/secao";

function Linha({ kpi }: { kpi: Kpi }) {
  const semDado = kpi.mes == null;
  const fora = !semDado && (kpi.mes_status === "red" || kpi.mes_status === "yellow");
  return (
    <div className={`flex min-h-0 flex-1 items-center gap-3 border-b border-azul/10 px-3 text-azul`}>
      <h2 className={`m-0 min-w-0 flex-1 text-[16px] leading-snug ${fora ? "font-semibold" : "font-medium"}`}>{kpi.titulo}</h2>
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

export function Sac({ painel }: { painel: Painel }) {
  const kpis = painel.sac?.kpis ?? [];
  if (!kpis.length) return <Vazio>SAC sem indicadores neste fechamento.</Vazio>;
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3">
      <div className="painel-bloco flex min-h-0 flex-1 flex-col overflow-hidden">
        {kpis.map((kpi) => (
          <Linha key={kpi.titulo} kpi={kpi} />
        ))}
      </div>
      {painel.sac.nota ? <p className="m-0 mt-2 shrink-0 text-[14px] leading-snug text-azul">{painel.sac.nota}</p> : null}
    </div>
  );
}
