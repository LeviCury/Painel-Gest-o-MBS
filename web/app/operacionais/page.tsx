import { Operacionais } from "@/components/painel/operacionais";
import { carregarPainel } from "@/lib/painel";

export default async function OperacionaisPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string }>;
}) {
  const { visao } = await searchParams;
  const painel = await carregarPainel(visao);
  return <Operacionais painel={painel} />;
}
