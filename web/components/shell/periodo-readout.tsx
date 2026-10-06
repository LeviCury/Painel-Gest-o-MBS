"use client";

import { useEffect, useState } from "react";

type Estado = "loading" | "ready" | "error";

export function PeriodoReadout() {
  const [estado, setEstado] = useState<Estado>("loading");
  const [periodo, setPeriodo] = useState("");
  const [atualizacao, setAtualizacao] = useState("");

  useEffect(() => {
    let cancelado = false;
    fetch("/api/painel?visao=BR")
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error("sem fechamento");
        return resposta.json() as Promise<{ periodo_rotulo?: string; atualizacao?: string }>;
      })
      .then((dados) => {
        if (cancelado) return;
        setPeriodo(dados.periodo_rotulo ?? "—");
        setAtualizacao(dados.atualizacao ?? "—");
        setEstado("ready");
      })
      .catch(() => {
        if (!cancelado) setEstado("error");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (estado === "loading") {
    return (
      <div className="flex gap-6" aria-hidden="true">
        <span className="h-4 w-16 animate-pulse rounded-sm bg-[#172a39]/10" />
      </div>
    );
  }

  if (estado === "error") {
    return (
      <p className="max-w-56 text-[13px] text-[#5a6c7d]" role="status">
        O fechamento não respondeu. O painel segue no ar quando o servidor voltar.
      </p>
    );
  }

  return (
    <p className="m-0 text-[14px] font-medium tracking-[-0.01em] text-[#5a6c7d]" title={`atualizado ${atualizacao}`}>
      {periodo}
    </p>
  );
}
