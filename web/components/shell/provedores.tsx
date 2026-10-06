"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ehIdioma, IDIOMA_CHAVE, idiomaDoNavegador, langDe, textoDe, type Idioma, type Texto } from "@/lib/idioma";

const TEMA_CHAVE = "painel-tema";
type Tema = "light" | "dark";

type TemaValor = { tema: Tema; alternar: () => void };
type IdiomaValor = { idioma: Idioma; definir: (idioma: Idioma) => void; t: Texto };

const TemaContexto = createContext<TemaValor | null>(null);
const IdiomaContexto = createContext<IdiomaValor | null>(null);

function temaGuardado(): Tema {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(TEMA_CHAVE) === "dark" ? "dark" : "light";
}

function idiomaGuardado(): Idioma {
  if (typeof window === "undefined") return "pt-BR";
  const guardado = window.localStorage.getItem(IDIOMA_CHAVE);
  if (ehIdioma(guardado)) return guardado;
  return idiomaDoNavegador(window.navigator.language);
}

function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle("dark", tema === "dark");
  document.documentElement.style.colorScheme = tema;
}

function aplicarIdioma(idioma: Idioma) {
  document.documentElement.lang = langDe(idioma);
}

export function Provedores({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("light");
  const [idioma, setIdioma] = useState<Idioma>("pt-BR");

  useEffect(() => {
    const proximoTema = temaGuardado();
    const proximoIdioma = idiomaGuardado();
    setTema(proximoTema);
    setIdioma(proximoIdioma);
    aplicarTema(proximoTema);
    aplicarIdioma(proximoIdioma);
  }, []);

  const temaValor = useMemo<TemaValor>(
    () => ({
      tema,
      alternar: () => {
        setTema((atual) => {
          const proximo = atual === "dark" ? "light" : "dark";
          window.localStorage.setItem(TEMA_CHAVE, proximo);
          aplicarTema(proximo);
          return proximo;
        });
      },
    }),
    [tema],
  );

  const idiomaValor = useMemo<IdiomaValor>(
    () => ({
      idioma,
      t: textoDe(idioma),
      definir: (proximo) => {
        window.localStorage.setItem(IDIOMA_CHAVE, proximo);
        aplicarIdioma(proximo);
        setIdioma(proximo);
      },
    }),
    [idioma],
  );

  return (
    <TemaContexto.Provider value={temaValor}>
      <IdiomaContexto.Provider value={idiomaValor}>{children}</IdiomaContexto.Provider>
    </TemaContexto.Provider>
  );
}

export function useTema() {
  const valor = useContext(TemaContexto);
  if (!valor) throw new Error("useTema fora do provedor");
  return valor;
}

export function useIdioma() {
  const valor = useContext(IdiomaContexto);
  if (!valor) throw new Error("useIdioma fora do provedor");
  return valor;
}
