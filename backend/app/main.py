from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .calc import montar_painel
from .db import aplicar_bases, aplicar_metas, gravar, listar, obter, ultimo, vazio
from .ingest import Leitura, ler_planilha
from .legacy import carregar_html
from .schema import EXEMPLO_CONTRATO, Fechamento, MetaIndicador, Visao

DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if not listar():
        try:
            gravar(carregar_html())
        except (OSError, ValueError):
            pass
    yield


app = FastAPI(title="Painel de Indicadores MBS", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/contrato")
def contrato():
    return EXEMPLO_CONTRATO


@app.get("/api/fechamentos")
def fechamentos():
    return listar()


@app.get("/api/painel")
def painel(visao: Visao = "BR+PY", periodo: str | None = None):
    fechamento = obter(periodo) if periodo else ultimo()
    if fechamento is None:
        raise HTTPException(404, "Nenhum fechamento publicado.")
    if visao not in {"BR", "PY", "BR+PY"}:
        raise HTTPException(400, "Visão inválida.")
    return montar_painel(fechamento, visao)


@app.post("/api/fechamentos")
def publicar(fechamento: Fechamento):
    if not fechamento.atualizacao:
        fechamento.atualizacao = datetime.now().strftime("%d/%m/%Y %H:%M")
    gravar(fechamento)
    return {"periodo": fechamento.periodo, "atualizacao": fechamento.atualizacao}


@app.post("/api/fechamentos/upload")
async def upload(
    periodo: str = Form(...),
    arquivos: list[UploadFile] = File(...),
):
    try:
        Fechamento(periodo=periodo)
    except Exception as exc:
        raise HTTPException(400, "Período inválido. Use AAAA-MM.") from exc

    fechamento = obter(periodo) or vazio(periodo)
    relatorio = []
    for arq in arquivos:
        conteudo = await arq.read()
        nome = arq.filename or "planilha.xlsx"
        try:
            leitura = ler_planilha(conteudo, nome)
        except ValueError as exc:
            raise HTTPException(400, str(exc)) from exc
        _aplicar_leitura(fechamento, leitura, periodo)
        relatorio.append({
            "arquivo": nome,
            "tipo": leitura.tipo,
            "bases": len(leitura.bases),
            "operacionais": len(leitura.operacionais),
            "avisos": leitura.avisos,
        })
    fechamento.atualizacao = datetime.now().strftime("%d/%m/%Y %H:%M")
    gravar(fechamento)
    return {"periodo": periodo, "arquivos": relatorio}


def _aplicar_leitura(fechamento: Fechamento, leitura: Leitura, periodo: str) -> None:
    if leitura.bases and leitura.campos_base:
        aplicar_bases(fechamento, leitura.bases, leitura.campos_base)
    ano, mes = (int(p) for p in periodo.split("-"))
    metas = list(leitura.metas)
    for m in leitura.metas_mensais:
        if m["ano"] == ano and m["mes"] == mes:
            metas.append(MetaIndicador(
                escopo="setor",
                escritorio=m["escritorio"],
                setor=m["setor"],
                transacoes_por_fte=m["transacoes_por_fte"],
            ))
    if metas:
        aplicar_metas(fechamento, metas)
    if leitura.operacionais:
        chaves = {(c.escritorio, c.setor) for c in leitura.operacionais}
        fechamento.operacionais = [
            c for c in fechamento.operacionais if (c.escritorio, c.setor) not in chaves
        ]
        fechamento.operacionais.extend(leitura.operacionais)
    if leitura.headcount:
        chaves_hc = {(h.escritorio, h.ano) for h in leitura.headcount}
        fechamento.headcount_orcado = [
            h for h in fechamento.headcount_orcado if (h.escritorio, h.ano) not in chaves_hc
        ]
        fechamento.headcount_orcado.extend(leitura.headcount)


if DIST.exists():
    assets = DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{caminho:path}")
    def spa(caminho: str):
        alvo = DIST / caminho
        if caminho and alvo.is_file():
            return FileResponse(alvo)
        return FileResponse(DIST / "index.html")
