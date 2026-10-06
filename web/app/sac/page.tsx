import { Sac } from "@/components/painel/sac";
import { carregarPainel } from "@/lib/painel";

export default async function SacPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string }>;
}) {
  const { visao } = await searchParams;
  const painel = await carregarPainel(visao);
  return <Sac painel={painel} />;
}
