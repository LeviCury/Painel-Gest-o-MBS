---
name: Instrumento Minerva
description: Tela de gestão do MBS. Branco, azul de estrutura, três instrumentos no mesmo horizonte.
colors:
  branco: "#ffffff"
  azul: "#2C5372"
  nevoa: "#EAEFF5"
  vermelho: "#E83948"
  dourado: "#C7B475"
  agulha: "#ff1744"
  escala-boa: "#99B81D"
  escala-atencao: "#FBDF00"
  escala-ruim: "#B90302"
typography:
  wordmark:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "-0.03em"
  titulo:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "15px"
    fontWeight: 300
    letterSpacing: "-0.02em"
  numero:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "6.75rem"
    fontWeight: 600
    lineHeight: 0.85
    letterSpacing: "-0.04em"
  rotulo:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "15px"
    fontWeight: 300
  cifra:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  nenhum: "0"
spacing:
  pagina: "40px"
  respiro: "32px"
components:
  pais-selecionado:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.branco}"
    rounded: "{rounded.nenhum}"
    padding: "6px 14px"
  pais-em-espera:
    backgroundColor: "{colors.nevoa}"
    textColor: "{colors.azul}"
    rounded: "{rounded.nenhum}"
    padding: "6px 14px"
---

## Overview

Instrumento Minerva é a tela de Gestão do MBS. O diretor vê, de uma vez, o país aceso, o quadro de colaboradores e os três velocímetros. O branco ocupa a maior parte. A separação é espaço e uma linha de 1px.

## Colors

Azul `#2C5372` é texto e estrutura. `#EAEFF5` aparece só no respiro do seletor de país. Vermelho `#E83948` fica na palavra foods. Dourado `#C7B475` fica no fio da página ativa e na marca da meta. A agulha do mês é `#ff1744`. A escala do velocímetro não muda de cor: verde `#99B81D`, amarelo `#FBDF00`, vermelho `#B90302`, na ordem que o indicador pede.

## Typography

Montserrat. A marca é “minerva” em azul e “foods” em vermelho, semibold, sem efeito. Rótulos em peso 300. Números em semibold, com algarismos tabulares. O 244 é o número de palco.

## Layout

Quadro de referência 1440×980. Navegação horizontal no alto: Gestão, Operacionais, Exportação, SAC, com o país à direita. No miolo, o globo à esquerda com margem, o 244 e a volumetria em tipo ao lado, os três velocímetros à direita. Embaixo, a faixa Táticos: quatro linhas, nome e dois números. A página abre em Brasil.

## Elevation & Depth

Não há sombra, vidro, blur nem metal. A profundidade do globo é a luz: centro claro, borda azul, sem metade escura. O território selecionado é preenchido, não só contornado.

## Shapes

Cantos retos. O seletor de país é um bloco de névoa com o item ativo em azul. O velocímetro é um arco de 0 a 150, meta no 100. A agulha não atravessa o número do centro.

## Components

O globo mostra Brasil, Paraguai ou os dois, com a legenda embaixo. O velocímetro de Custo vai do verde ao vermelho; Produtividade e Qualidade vão do vermelho ao verde. Sem leitura, a escala pode existir, a agulha não, e o centro é —. A faixa tática não repete o velocímetro: mostra custo e produtividade do mês. Onde não há base, o texto diz “Sem base em” e o ano, sem cifra inventada.

## Do's and Don'ts

Escrever a marca. Não desenhar o símbolo à mão e não aplicar efeito nela. Não usar card, sombra, hover com escala, nem sidebar com um mapa pequeno. Não pintar a agulha de outra cor. Não completar Qualidade nem o previsto sem base.
