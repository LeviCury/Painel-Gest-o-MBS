export const VISOES = ["BR", "PY", "BR+PY"] as const;

export type Visao = (typeof VISOES)[number];

export type RotaPainel = {
  href: "/gestao" | "/operacionais" | "/exportacao" | "/sac";
  rotulo: string;
  /** Exportação não tem consolidado. SAC não usa o seletor. */
  seletor: "completo" | "hub" | "nenhum";
};

export const ROTAS: RotaPainel[] = [
  { href: "/gestao", rotulo: "Gestão", seletor: "completo" },
  { href: "/operacionais", rotulo: "Operacionais", seletor: "completo" },
  { href: "/exportacao", rotulo: "Exportação", seletor: "hub" },
  { href: "/sac", rotulo: "SAC", seletor: "nenhum" },
];

export const ROTULOS_VISAO: Record<Visao, string> = {
  BR: "Brasil",
  PY: "Paraguai",
  "BR+PY": "Consolidado",
};

export const ROTULOS_HUB: Record<"BR" | "PY", string> = {
  BR: "Brasil",
  PY: "Hub Latam",
};

export function visaoDaQuery(valor: string | null): Visao {
  if (valor === "BR" || valor === "PY" || valor === "BR+PY") return valor;
  return "BR";
}

export function rotaAtual(pathname: string): RotaPainel {
  return ROTAS.find((rota) => pathname === rota.href || pathname.startsWith(`${rota.href}/`)) ?? ROTAS[0];
}
