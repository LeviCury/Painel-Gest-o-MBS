import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../fonts/montserrat-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/montserrat-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/montserrat-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/montserrat-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/montserrat-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/montserrat-800.woff2", weight: "800", style: "normal" },
    { path: "../fonts/montserrat-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Instrumento Minerva",
  description: "Instrumento de gestão do MBS, Minerva Foods.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={sans.variable} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{if(localStorage.getItem("painel-tema")==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();',
          }}
        />
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html:
              "<!-- THESIS: No mesmo horizonte, o país aceso, o 244 e três velocímetros; a tela recusa o dashboard de cards e a sidebar com mapa. OWN-WORLD: branco na maior parte, azul #2C5372 como texto e estrutura, #EAEFF5 só no respiro do seletor, vermelho e dourado pontuais, Montserrat, rótulo leve, número semibold, ícone em traço fino, separação por espaço e linha de 1px. STORY: o diretor lê o Brasil preenchido, o quadro de pessoas e custo, produtividade e qualidade, e troca de página ou de país sem sair do instrumento. FIRST VIEWPORT: navegação horizontal no alto, fio dourado curto em Gestão, Brasil selecionado; globo grande à esquerda com margem; 244 ao lado com a volumetria em tipo, sem caixa; três velocímetros grandes à direita; faixa Táticos embaixo, quatro linhas e dois números. FORM: brief cravado do diretor, sem rolagem de conceito, seed brief-pinned. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->",
          }}
        />
        <Suspense fallback={<div className="min-h-screen bg-branco" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
