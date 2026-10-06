import { Exportacao } from "@/components/painel/exportacao";
import { visaoDaQuery } from "@/lib/navigation";
import { carregarPainel } from "@/lib/painel";

export default async function ExportacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string }>;
}) {
  const { visao } = await searchParams;
  const painel = await carregarPainel(visao);
  return <Exportacao painel={painel} visao={visaoDaQuery(visao ?? null)} />;
}
