"use client";

import dynamic from "next/dynamic";

const GlobeMark = dynamic(() => import("@/components/shell/globe-mark"), {
  ssr: false,
  loading: () => <div className="mx-auto aspect-square w-full max-w-[17.5rem]" />,
});

export function GloboPalco({ visao }: { visao: string }) {
  return <GlobeMark visao={visao} />;
}
