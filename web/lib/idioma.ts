export const IDIOMAS = ["pt-BR", "en", "es"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_CHAVE = "painel-idioma";

const TEXTO = {
  "pt-BR": {
    nav: { gestao: "Gestão", operacionais: "Operacionais", exportacao: "Exportação", sac: "SAC" },
    sala: {
      volumetria: "Informações de Volumetria",
      estrategicos: "Indicadores Estratégicos",
      taticos: "Indicadores Táticos",
      quantidade: "Quantidade e valor",
      contra: "Contra a meta",
      area: "Por área",
    },
    pais: {
      BR: "Brasil",
      PY: "Paraguai",
      consolidado: "Consolidado",
      hub: "Hub Latam",
      leitura: "País em leitura",
      visao: "Visão geográfica",
      escritorio: "Escritório de exportação",
    },
    tema: "Alternar tema",
    idioma: "Idioma",
    recolher: "Recolher trilho",
    abrir: "Abrir trilho",
    mes: "Mês",
    mesCurto: "MÊS",
    meta: "Meta",
    ytd: "YTD",
    daMeta: "da meta",
    orcado: "Orçado",
    realizado: "Realizado",
    orcadoVs: "Orçado vs Realizado",
    orcadoAno: "Orçado no ano",
    vsOrcado: "Realizado vs orçado",
    realizadoVsAnterior: "Orçamento realizado vs ano anterior",
    realizadoVsPrevisto: "Orçamento realizado vs previsto",
    variacao: "Variação YoY",
    desvioMes: "Desvio Mês",
    desvioYtd: "Desvio YTD",
    vsMes: "vs Previsto (MÊS)",
    vsYtd: "vs Previsto (YTD)",
    fechar: "Fechar",
    anterior: "Anterior",
    proximo: "Próximo",
    noAlvo: "No alvo",
    atencao: "Atenção",
    fora: "Fora da meta",
    semMeta: "Sem meta",
    serie: "Série do ano",
    custo: "Custo",
    produtividade: "Produtividade",
    qualidade: "Qualidade",
    volume: "Volume",
    volumeYtd: "Volume YTD",
    pt: "Português",
    en: "English",
    es: "Español",
  },
  en: {
    nav: { gestao: "Management", operacionais: "Operations", exportacao: "Exports", sac: "SAC" },
    sala: {
      volumetria: "Volume information",
      estrategicos: "Strategic indicators",
      taticos: "Tactical indicators",
      quantidade: "Quantity and value",
      contra: "Against target",
      area: "By area",
    },
    pais: {
      BR: "Brazil",
      PY: "Paraguay",
      consolidado: "Consolidated",
      hub: "Hub Latam",
      leitura: "Country in view",
      visao: "Geographic view",
      escritorio: "Export office",
    },
    tema: "Switch theme",
    idioma: "Language",
    recolher: "Collapse rail",
    abrir: "Expand rail",
    mes: "Month",
    mesCurto: "Month",
    meta: "Target",
    ytd: "YTD",
    daMeta: "of target",
    orcado: "Budgeted",
    realizado: "Actual",
    orcadoVs: "Budgeted vs actual",
    orcadoAno: "Budgeted for the year",
    vsOrcado: "Actual vs budget",
    realizadoVsAnterior: "Actual vs prior year",
    realizadoVsPrevisto: "Actual vs forecast",
    variacao: "YoY change",
    desvioMes: "Month dev.",
    desvioYtd: "YTD dev.",
    vsMes: "vs forecast (month)",
    vsYtd: "vs forecast (YTD)",
    fechar: "Close",
    anterior: "Previous",
    proximo: "Next",
    noAlvo: "On target",
    atencao: "Watch",
    fora: "Off target",
    semMeta: "No target",
    serie: "Year series",
    custo: "Cost",
    produtividade: "Productivity",
    qualidade: "Quality",
    volume: "Volume",
    volumeYtd: "YTD volume",
    pt: "Português",
    en: "English",
    es: "Español",
  },
  es: {
    nav: { gestao: "Gestión", operacionais: "Operaciones", exportacao: "Exportación", sac: "SAC" },
    sala: {
      volumetria: "Información de volumetría",
      estrategicos: "Indicadores estratégicos",
      taticos: "Indicadores tácticos",
      quantidade: "Cantidad y valor",
      contra: "Contra la meta",
      area: "Por área",
    },
    pais: {
      BR: "Brasil",
      PY: "Paraguay",
      consolidado: "Consolidado",
      hub: "Hub Latam",
      leitura: "País en lectura",
      visao: "Vista geográfica",
      escritorio: "Oficina de exportación",
    },
    tema: "Cambiar tema",
    idioma: "Idioma",
    recolher: "Replegar riel",
    abrir: "Abrir riel",
    mes: "Mes",
    mesCurto: "MES",
    meta: "Meta",
    ytd: "YTD",
    daMeta: "de la meta",
    orcado: "Presupuestado",
    realizado: "Realizado",
    orcadoVs: "Presupuestado vs realizado",
    orcadoAno: "Presupuestado en el año",
    vsOrcado: "Realizado vs presupuestado",
    realizadoVsAnterior: "Realizado vs año anterior",
    realizadoVsPrevisto: "Realizado vs previsto",
    variacao: "Variación YoY",
    desvioMes: "Desvío mes",
    desvioYtd: "Desvío YTD",
    vsMes: "vs previsto (mes)",
    vsYtd: "vs previsto (YTD)",
    fechar: "Cerrar",
    anterior: "Anterior",
    proximo: "Siguiente",
    noAlvo: "En la meta",
    atencao: "Atención",
    fora: "Fuera de la meta",
    semMeta: "Sin meta",
    serie: "Serie del año",
    custo: "Costo",
    produtividade: "Productividad",
    qualidade: "Calidad",
    volume: "Volumen",
    volumeYtd: "Volumen YTD",
    pt: "Português",
    en: "English",
    es: "Español",
  },
} as const;

export type Texto = (typeof TEXTO)[Idioma];

export function ehIdioma(valor: string | null): valor is Idioma {
  return valor === "pt-BR" || valor === "en" || valor === "es";
}

/** pt* fica em português, es* em espanhol, qualquer outra língua em inglês. */
export function idiomaDoNavegador(tag: string | null | undefined): Idioma {
  const primario = (tag ?? "").trim().toLowerCase().replace(/_/g, "-").split("-")[0];
  if (primario === "pt") return "pt-BR";
  if (primario === "es") return "es";
  return "en";
}

export function textoDe(idioma: Idioma): Texto {
  return TEXTO[idioma];
}

export function langDe(idioma: Idioma) {
  if (idioma === "pt-BR") return "pt-BR";
  if (idioma === "es") return "es";
  return "en";
}
