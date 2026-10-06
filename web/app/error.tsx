"use client";

export default function Falha({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="max-w-lg pt-6" role="alert">
      <h2 className="m-0 text-3xl font-semibold text-azul">A tela não abriu</h2>
      <p className="mt-3 font-light text-azul-medio">O desenho da página falhou. Os números no servidor não foram alterados.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-sm bg-azul px-5 py-2 text-sm font-medium text-branco"
      >
        Tentar de novo
      </button>
    </section>
  );
}
