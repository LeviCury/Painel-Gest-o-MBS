import { NextRequest, NextResponse } from "next/server";
import { carregarPainel } from "@/lib/painel";

export async function GET(req: NextRequest) {
  const painel = await carregarPainel(req.nextUrl.searchParams.get("visao") ?? undefined);
  return NextResponse.json(painel);
}
