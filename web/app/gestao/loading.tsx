export default function CarregandoGestao() {
  return (
    <div className="flex min-h-full flex-col px-10 py-8" aria-hidden="true">
      <div className="grid flex-1 items-center gap-8 xl:grid-cols-[20rem_minmax(0,1fr)_30rem]">
        <div className="mx-auto h-64 w-64 animate-pulse rounded-full bg-nevoa" />
        <div>
          <div className="h-24 w-40 animate-pulse bg-nevoa" />
          <div className="mt-4 h-3 w-48 animate-pulse bg-nevoa" />
          <div className="mt-8 h-3 w-64 animate-pulse bg-nevoa" />
          <div className="mt-3 h-3 w-56 animate-pulse bg-nevoa" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, indice) => (
            <div key={indice} className="h-28 animate-pulse rounded-t-full bg-nevoa" />
          ))}
        </div>
      </div>
    </div>
  );
}
