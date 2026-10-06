export function VisaoEmEspera({ nome }: { nome: string }) {
  return (
    <section className="max-w-xl pt-6">
      <p className="text-lg font-light leading-relaxed text-azul-medio">
        {nome} entra nesta tela quando a vestimenta dos indicadores estiver pronta. O servidor já entrega o fechamento; esta página ainda não desenha os números.
      </p>
    </section>
  );
}
