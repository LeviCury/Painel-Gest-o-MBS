import { visaoDaQuery, type Visao } from "@/lib/navigation";

export type Indicador = {
  chave: string;
  titulo: string;
  valor: number | null;
  meta: number | null;
  ytd: number | null;
  direction: string;
  status: string;
  status_ytd: string;
};

export type VolumeYoy = {
  id: string;
  label: string;
  tipo: "yoy";
  atual: number | null;
  anterior: number | null;
  variacao: number | null;
  orcado?: number | null;
  variacao_orcado?: number | null;
};

export type VolumeBudget = {
  id: string;
  label: string;
  tipo: "budget";
  formato?: string;
  mes: number | null;
  ytd: number | null;
  mes_anterior: number | null;
  ytd_anterior: number | null;
  var_mes: number | null;
  var_ytd: number | null;
  var_vs_previsto_mes?: number | null;
  var_vs_previsto_ytd?: number | null;
};

export type VolumeComparacao = {
  id: string;
  label: string;
  tipo: "comparacao";
  formato?: string;
  mes_orcado: number | null;
  mes_realizado: number | null;
  ytd_orcado: number | null;
  ytd_realizado: number | null;
  delta_mes: number | null;
  delta_ytd: number | null;
  var_mes: number | null;
  var_ytd: number | null;
};

export type Volume = VolumeYoy | VolumeBudget | VolumeComparacao;

export type PontoSerie = {
  ano: number;
  mes: number;
  resultado: number | null;
  volume: number | null;
};

export type CardOperacional = {
  nome: string;
  setor: string;
  unidade: string;
  direction: string;
  meta: number | null;
  meta_rotulo: string | null;
  mes: number | null;
  ytd: number | null;
  dentro: number | null;
  fora: number | null;
  volume: number | null;
  volume_ytd: number | null;
  status: string;
  status_ytd: string;
  serie: PontoSerie[];
};

export type Kpi = {
  titulo: string;
  fonte: string;
  destino: string;
  mes: number | null;
  ytd: number | null;
  meta: number | null;
  mes_status: string;
  ytd_status: string;
};

export type Painel = {
  periodo_rotulo: string;
  atualizacao: string;
  visao: Visao;
  volumetria: Volume[];
  estrategicos: Indicador[];
  taticos: { colunas: string[]; linhas: { setor: string; indicadores: Indicador[] }[] };
  operacionais: { setor: string; cards: CardOperacional[] }[];
  exportacao: { BR: Kpi[]; PY: Kpi[] };
  sac: { kpis: Kpi[]; nota: string };
};

export async function carregarPainel(valor: string | undefined): Promise<Painel> {
  const visao = visaoDaQuery(valor ?? null);
  const resposta = await fetch(`http://127.0.0.1:8000/api/painel?visao=${encodeURIComponent(visao)}`, {
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error("fechamento indisponível");
  return resposta.json() as Promise<Painel>;
}
