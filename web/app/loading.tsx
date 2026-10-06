export default function Carregando() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-nevoa xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="bg-branco px-5 py-4">
          <div className="h-3 w-24 animate-pulse rounded-sm bg-nevoa" />
          <div className="mt-3 h-8 w-20 animate-pulse rounded-sm bg-nevoa" />
          <div className="mt-3 h-3 w-28 animate-pulse rounded-sm bg-nevoa" />
        </div>
      ))}
    </div>
  );
}
