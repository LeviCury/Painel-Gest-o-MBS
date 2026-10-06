"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MarcaPais } from "@/components/shell/bandeiras";
import { useIdioma } from "@/components/shell/provedores";
import { rotaAtual, visaoDaQuery, type Visao } from "@/lib/navigation";

const COMPLETO: Visao[] = ["BR", "PY", "BR+PY"];
const HUB: Array<"BR" | "PY"> = ["BR", "PY"];

export function GeoSelector({ compacto = false }: { compacto?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const rota = rotaAtual(pathname);
  const visao = visaoDaQuery(params.get("visao"));
  const { t } = useIdioma();

  function rotuloDe(opcao: Visao) {
    if (rota.seletor === "hub" && opcao === "PY") return t.pais.hub;
    if (opcao === "BR+PY") return t.pais.consolidado;
    return t.pais[opcao];
  }

  if (rota.seletor === "nenhum") {
    return (
      <div className={compacto ? "px-2" : "px-3"}>
        <p
          className={`m-0 flex items-center text-[13px] font-medium text-[#f4f3ed] ${compacto ? "h-9 justify-center" : "h-9 gap-2.5 px-2.5"}`}
          aria-label={t.pais.leitura}
        >
          <MarcaPais visao={visao} curta={compacto && visao === "BR+PY"} />
          <span className={compacto ? "sr-only" : ""}>{rotuloDe(visao)}</span>
        </p>
      </div>
    );
  }

  function ir(proxima: Visao) {
    const busca = new URLSearchParams(params.toString());
    busca.set("visao", proxima);
    router.push(`${pathname}?${busca.toString()}`);
  }

  const opcoes = rota.seletor === "hub" ? HUB : COMPLETO;

  return (
    <fieldset className={`m-0 border-0 p-0 ${compacto ? "px-2" : "px-3"}`}>
      <legend className="sr-only">{rota.seletor === "hub" ? t.pais.escritorio : t.pais.visao}</legend>
      <div className={`flex ${compacto ? "flex-col items-center gap-0.5" : "flex-col gap-0.5"}`}>
        {opcoes.map((opcao) => {
          const ativo = visao === opcao;
          return (
            <button
              key={opcao}
              type="button"
              aria-pressed={ativo}
              onClick={() => ir(opcao)}
              className={`flex items-center rounded-md text-left text-[13px] transition-colors duration-150 ${compacto ? "h-9 w-9 justify-center" : "h-9 w-full gap-2.5 px-2.5"} ${ativo ? "bg-[#2c3d4c] font-medium text-[#f4f3ed]" : "font-medium text-[#afae89] hover:bg-[#2c3d4c]/60 hover:text-[#f4f3ed]"}`}
            >
              <MarcaPais visao={opcao} curta={compacto && opcao === "BR+PY"} />
              <span className={compacto ? "sr-only" : ""}>{rotuloDe(opcao)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
