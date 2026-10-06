import { Vidro } from "@/components/painel/vidro";

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="m-0 text-[15px] font-light tracking-[-0.01em] text-azul">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <Vidro className="px-4 py-5">
      <p className="m-0 text-[15px] font-medium leading-snug text-azul">{children}</p>
    </Vidro>
  );
}

export function Grade({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function Superficie({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <article className={`rounded-xl bg-branco px-4 py-4 shadow-lift ring-1 ring-azul/10 ${className}`}>{children}</article>;
}
