"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { moedaCurta, numero } from "@/lib/format";

function texto(valor: number, formato: "inteiro" | "moeda") {
  return formato === "moeda" ? moedaCurta(valor) : numero(valor, 0);
}

/** O número chega no valor. Na primeira vez parte perto do destino; na troca de visão, interpola. */
export function Contador({
  valor,
  formato = "inteiro",
  className,
}: {
  valor: number | null;
  formato?: "inteiro" | "moeda";
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const mostrado = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (valor == null || Number.isNaN(valor)) {
      el.textContent = "—";
      mostrado.current = null;
      return;
    }
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const destino = valor;
    const origem = mostrado.current == null ? destino * 0.94 : mostrado.current;
    if (reduzido || origem === destino) {
      el.textContent = texto(destino, formato);
      mostrado.current = destino;
      return;
    }
    el.textContent = texto(origem, formato);
    const estado = { n: origem };
    const tween = gsap.to(estado, {
      n: destino,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: () => {
        mostrado.current = estado.n;
        el.textContent = texto(estado.n, formato);
      },
    });
    return () => {
      tween.kill();
    };
  }, [valor, formato]);

  return (
    <span ref={ref} className={className}>
      {valor == null ? "—" : texto(mostrado.current ?? valor, formato)}
    </span>
  );
}
