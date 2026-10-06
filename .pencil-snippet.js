const azul = "#2C5372";
const medio = "#426A88";
const claro = "#5D86A5";
const nevoa = "#EAEFF5";
const vermelho = "#E83948";
const dourado = "#C7B475";
const branco = "#FFFFFF";
const font = "Montserrat";

function txt(parent, name, content, size, weight, color, extra) {
  return Insert(parent, Object.assign({
    type: "text",
    name,
    content,
    fontFamily: font,
    fontSize: size,
    fontWeight: weight,
    fill: color
  }, extra || {}));
}

const screen = Insert(document, {
  type: "frame",
  name: "Instrumento Minerva",
  x: 80,
  y: 80,
  width: 1440,
  height: 980,
  fill: branco,
  layout: "vertical",
  clip: true
});

const header = Insert(screen, {
  type: "frame",
  name: "Barra",
  width: "fill_container",
  height: 72,
  layout: "horizontal",
  padding: [0, 36],
  alignItems: "center",
  justifyContent: "space_between",
  stroke: "#E6EDF4",
  strokeWidth: { bottom: 1 }
});

const marca = Insert(header, { type: "frame", name: "Marca", layout: "horizontal", gap: 8, alignItems: "center" });
txt(marca, "Minerva", "minerva", 22, "600", azul);
txt(marca, "Foods", "foods", 22, "600", vermelho);

const nav = Insert(header, { type: "frame", name: "Secoes", layout: "horizontal", gap: 28, alignItems: "center" });
const secoes = ["Gestão", "Operacionais", "Exportação", "SAC"];
for (const secao of secoes) {
  const item = Insert(nav, { type: "frame", name: secao, layout: "vertical", gap: 6, alignItems: "center" });
  txt(item, secao + " texto", secao, 14, secao === "Gestão" ? "600" : "500", secao === "Gestão" ? azul : medio);
  Insert(item, {
    type: "rectangle",
    name: secao + " fio",
    width: secao === "Gestão" ? 28 : 0,
    height: 2,
    fill: secao === "Gestão" ? dourado : branco
  });
}

const geo = Insert(header, { type: "frame", name: "Pais", layout: "horizontal", gap: 4, alignItems: "center", fill: nevoa, cornerRadius: 8, padding: 4 });
for (const opcao of ["Brasil", "Paraguai", "Consolidado"]) {
  const ativo = opcao === "Brasil";
  const botao = Insert(geo, {
    type: "frame",
    name: opcao,
    layout: "horizontal",
    padding: [8, 14],
    cornerRadius: 6,
    fill: ativo ? azul : "#00000000"
  });
  txt(botao, opcao + " rotulo", opcao, 13, "600", ativo ? branco : azul);
}

const corpo = Insert(screen, {
  type: "frame",
  name: "Cena",
  width: "fill_container",
  height: "fill_container",
  layout: "horizontal",
  padding: [28, 36, 32, 36],
  gap: 40
});

const globoCol = Insert(corpo, {
  type: "frame",
  name: "Globo",
  width: 460,
  height: "fill_container",
  layout: "vertical",
  justifyContent: "center",
  alignItems: "center",
  gap: 16
});

const esfera = Insert(globoCol, {
  type: "frame",
  name: "Esfera",
  width: 420,
  height: 420,
  layout: "none"
});

Insert(esfera, {
  type: "ellipse",
  name: "Oceano aceso",
  x: 10,
  y: 10,
  width: 400,
  height: 400,
  fill: {
    type: "gradient",
    gradientType: "radial",
    center: { x: 0.38, y: 0.34 },
    size: { width: 1.15, height: 1.15 },
    colors: [
      { color: "#D7E6F2", position: 0 },
      { color: "#5D86A5", position: 0.42 },
      { color: "#2C5372", position: 0.78 },
      { color: "#1E3C56", position: 1 }
    ]
  }
});

Insert(esfera, {
  type: "ellipse",
  name: "Brilho",
  x: 78,
  y: 48,
  width: 150,
  height: 90,
  fill: "#FFFFFF55"
});

const pais = Insert(esfera, {
  type: "frame",
  name: "Pais aceso",
  x: 78,
  y: 70,
  width: 250,
  height: 270,
  placeholder: true,
  layout: "none"
});
Generate("svg", pais, "A single simplified map of Brazil, the whole territory filled solid including the interior, not an outline. Fill color luminous warm white #F4E7C4 with a soft edge. No ocean, no text, no border, no other countries, transparent background. The shape should read as the entire country lit from within.");

txt(globoCol, "Legenda pais", "Brasil", 15, "600", azul);

const leitura = Insert(corpo, {
  type: "frame",
  name: "Leitura",
  width: "fill_container",
  height: "fill_container",
  layout: "vertical",
  gap: 28,
  padding: [12, 0, 0, 0]
});

txt(leitura, "Volumetria", "Volumetria", 13, "500", medio);

const faixa = Insert(leitura, {
  type: "frame",
  name: "Faixa",
  width: "fill_container",
  layout: "horizontal",
  gap: 28,
  alignItems: "end"
});

const hero = Insert(faixa, { type: "frame", name: "Colaboradores", layout: "vertical", gap: 6, width: 240 });
txt(hero, "Rotulo colaboradores", "Colaboradores MBS", 13, "500", medio);
txt(hero, "Numero", "244", 88, "600", azul, { letterSpacing: -3 });
const delta = Insert(hero, { type: "frame", name: "Comparacao", layout: "horizontal", gap: 10, alignItems: "center" });
txt(delta, "Ano", "2025  252", 13, "500", claro);
txt(delta, "Var", "−3,2%", 13, "600", vermelho);

function leituraSecundaria(nome, titulo, valor, detalhe) {
  const bloco = Insert(faixa, { type: "frame", name: nome, layout: "vertical", gap: 6, width: "fill_container" });
  txt(bloco, nome + " titulo", titulo, 12, "500", medio);
  txt(bloco, nome + " valor", valor, 28, "600", azul);
  txt(bloco, nome + " detalhe", detalhe, 12, "400", claro, { textGrowth: "fixed-width", width: 180 });
}

leituraSecundaria("Transacoes", "Transações MBS", "266.248", "YTD 2.273.346");
leituraSecundaria("Realizado", "Orçamento realizado", "R$ 1,957 mi", "YTD R$ 15,936 mi");
leituraSecundaria("Previsto", "Orçamento previsto", "R$ 2,166 mi", "Sem base em 2025");

txt(leitura, "Estrategicos", "Estratégicos", 13, "500", medio);

const gauges = Insert(leitura, {
  type: "frame",
  name: "Velocimetros",
  width: "fill_container",
  layout: "horizontal",
  gap: 18
});

function arco(parent, nome, lower) {
  const cores = lower
    ? [{ color: "#99B81D", position: 0 }, { color: "#FBDF00", position: 0.55 }, { color: "#B90302", position: 1 }]
    : [{ color: "#B90302", position: 0 }, { color: "#FBDF00", position: 0.45 }, { color: "#99B81D", position: 1 }];
  return Insert(parent, {
    type: "ellipse",
    name: nome,
    x: 16,
    y: 8,
    width: 168,
    height: 168,
    innerRadius: 0.78,
    startAngle: 180,
    sweepAngle: -180,
    fill: { type: "gradient", gradientType: "angular", rotation: 90, colors: cores }
  });
}

function velocimetro(titulo, sub, pct, mes, meta, ytd, lower, vazio) {
  const card = Insert(gauges, {
    type: "frame",
    name: titulo,
    width: "fill_container",
    layout: "vertical",
    alignItems: "center",
    gap: 4,
    padding: [8, 0, 0, 0]
  });
  txt(card, titulo + " nome", titulo, 15, "600", azul);
  txt(card, titulo + " sub", sub, 11, "400", claro);
  const dial = Insert(card, { type: "frame", name: titulo + " dial", width: 200, height: 112, layout: "none", clip: true });
  arco(dial, titulo + " arco", lower);
  Insert(dial, { type: "ellipse", name: titulo + " meta", x: 96, y: 4, width: 8, height: 8, fill: dourado });
  if (!vazio) {
    Insert(dial, { type: "rectangle", name: titulo + " agulha", x: 98, y: 28, width: 3, height: 62, cornerRadius: 2, fill: "#ff1744", rotation: lower ? 18 : -28 });
  }
  txt(dial, titulo + " pct", vazio ? "—" : pct, 26, "600", azul, { x: vazio ? 86 : 58, y: 70 });
  txt(card, titulo + " legenda", "Mês " + mes + "   Meta " + meta + "   YTD " + ytd, 11, "500", medio);
}

velocimetro("Custo", "Custo por transação", "90,4%", "7,35", "8,13", "7,01", true, false);
velocimetro("Produtividade", "Transações por FTE", "60,3%", "1.250", "2.074", "1.250", false, false);
velocimetro("Qualidade", "Nível de serviço", "—", "—", "—", "—", false, true);

txt(leitura, "Taticos", "Táticos", 13, "500", medio);

const tabela = Insert(leitura, {
  type: "frame",
  name: "Taticos linhas",
  width: "fill_container",
  layout: "vertical",
  gap: 10
});

const linhas = [
  ["Transações logísticas", "11,03", "702"],
  ["Transações financeiras", "1,81", "3.617"],
  ["Administrativo de pessoal", "8,16", "2.135"],
  ["Serviços e atendimento", "—", "—"]
];

for (const linha of linhas) {
  const row = Insert(tabela, {
    type: "frame",
    name: linha[0],
    width: "fill_container",
    layout: "horizontal",
    alignItems: "center",
    gap: 16
  });
  txt(row, linha[0] + " nome", linha[0], 13, "500", azul, { textGrowth: "fixed-width", width: 220 });
  txt(row, linha[0] + " custo", linha[1], 13, "600", azul, { textGrowth: "fixed-width", width: 80 });
  txt(row, linha[0] + " prod", linha[2], 13, "600", azul, { textGrowth: "fixed-width", width: 80 });
}

Print(screen);
TakeScreenshot([screen]);
