/**
 * Banner oficial dos 5 valores corporativos Minerva renderizado a partir
 * do PNG fornecido pela area de marca (fundo transparente, cores oficiais).
 *
 *   Orientacao para Resultados | Comprometimento | Sustentabilidade |
 *   Inovacao | Reconhecimento
 *
 * As cores SAO PADRAO MINERVA - nao aplicar grayscale, opacity reduzida,
 * mix-blend-mode ou qualquer filtro que altere a aparencia. Use sempre
 * a imagem como veio. O fundo da imagem ja e transparente.
 *
 * O arquivo fica em /public/brand/minerva-valores.png.
 */

type Variant = "horizontal" | "compact";

interface Props {
  variant?: Variant;
  className?: string;
}

const IMAGE_SRC = "/brand/minerva-valores.png";

export default function MinervaValues({ variant = "compact", className = "" }: Props) {
  const maxWidth = variant === "horizontal" ? 960 : 720;

  return (
    <div className={`flex w-full justify-center ${className}`}>
      <img
        src={IMAGE_SRC}
        alt="Valores Minerva Foods: Orientação para Resultados, Comprometimento, Sustentabilidade, Inovação, Reconhecimento"
        className="h-auto w-full select-none"
        style={{ maxWidth }}
        draggable={false}
        loading="lazy"
      />
    </div>
  );
}
