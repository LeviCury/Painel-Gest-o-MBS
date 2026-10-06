import { Gestao } from "@/components/painel/gestao";
import { carregarPainel } from "@/lib/painel";

export default async function GestaoPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string }>;
}) {
  const { visao } = await searchParams;
  const painel = await carregarPainel(visao);
  return <Gestao painel={painel} />;
}
