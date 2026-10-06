export function numero(valor, casas = 0) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function moeda(valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function variacao(valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${numero(valor, 1)}%`;
}

export function indicador(chave, valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  if (chave === "custo_por_transacao") return numero(valor, 2);
  if (chave === "nivel_servico") return `${numero(valor, 1)}%`;
  if (chave === "transacoes_por_fte") return numero(valor, 0);
  return numero(valor, 1);
}

export function tempo(minutos) {
  if (minutos === null || minutos === undefined || Number.isNaN(minutos)) return "—";
  const total = Math.round(Number(minutos));
  const h = Math.floor(Math.abs(total) / 60);
  const m = Math.abs(total) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function valorCard(card) {
  if (card.unidade === "hhmm") return tempo(card.mes);
  if (card.unidade === "percentual") return card.mes == null ? "—" : `${numero(card.mes, 1)}%`;
  if (card.unidade === "dias") return card.mes == null ? "—" : `${numero(card.mes, 1)} d`;
  return numero(card.mes, 1);
}

export function ytdCard(card) {
  if (card.unidade === "hhmm") return tempo(card.ytd);
  if (card.unidade === "percentual") return card.ytd == null ? "—" : `${numero(card.ytd, 1)}%`;
  if (card.unidade === "dias") return card.ytd == null ? "—" : `${numero(card.ytd, 1)} d`;
  return numero(card.ytd, 1);
}
