export function numero(valor: number | null | undefined, casas = 0): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Mesma abreviação do HTML do diretor: R$ 3.301 mi. O valor cheio fica no título. */
export function moedaCurta(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  const abs = Math.abs(valor);
  const prefixo = "R$ ";
  if (abs >= 1e9) return `${prefixo}${numero(valor / 1e9, 3)} bi`;
  if (abs >= 1e6) return `${prefixo}${numero(valor / 1e6, 3)} mi`;
  if (abs >= 1e3) return `${prefixo}${numero(valor / 1e3, 3)} mil`;
  return moeda(valor);
}

export function moeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function variacao(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${numero(valor, 1)}%`;
}

export function indicador(chave: string, valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  if (chave === "custo_por_transacao") return numero(valor, 2);
  if (chave === "nivel_servico") return `${numero(valor, 1)}%`;
  if (chave === "transacoes_por_fte") return numero(valor, 0);
  return numero(valor, 1);
}

export function tempo(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || Number.isNaN(minutos)) return "—";
  const total = Math.round(Number(minutos));
  const horas = Math.floor(Math.abs(total) / 60);
  const resto = Math.abs(total) % 60;
  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

export function valorCard(card: { unidade: string; mes: number | null }): string {
  if (card.unidade === "hhmm") return tempo(card.mes);
  if (card.unidade === "percentual") return card.mes == null ? "—" : `${numero(card.mes, 1)}%`;
  if (card.unidade === "dias") return card.mes == null ? "—" : `${numero(card.mes, 1)} d`;
  return numero(card.mes, 1);
}

export function ytdCard(card: { unidade: string; ytd: number | null }): string {
  if (card.unidade === "hhmm") return tempo(card.ytd);
  if (card.unidade === "percentual") return card.ytd == null ? "—" : `${numero(card.ytd, 1)}%`;
  if (card.unidade === "dias") return card.ytd == null ? "—" : `${numero(card.ytd, 1)} d`;
  return numero(card.ytd, 1);
}

export function tomStatus(status: string | null | undefined): string {
  if (status === "red") return "text-vermelho";
  if (status === "yellow") return "text-vermelho-medio";
  return "text-azul";
}
