"""Um fechamento por período. O painel é calculado na leitura."""

from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

from .calc import CAMPOS
from .schema import BaseMensal, Fechamento, MetaIndicador

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "painel.db"


def conectar() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS fechamentos (
            periodo TEXT PRIMARY KEY,
            atualizacao TEXT NOT NULL,
            payload TEXT NOT NULL,
            gravado_em TEXT NOT NULL
        )
        """
    )
    return con


def listar() -> list[dict]:
    with conectar() as con:
        rows = con.execute(
            "SELECT periodo, atualizacao, gravado_em FROM fechamentos ORDER BY periodo DESC"
        ).fetchall()
    return [{"periodo": r[0], "atualizacao": r[1], "gravado_em": r[2]} for r in rows]


def obter(periodo: str) -> Fechamento | None:
    with conectar() as con:
        row = con.execute("SELECT payload FROM fechamentos WHERE periodo = ?", (periodo,)).fetchone()
    if not row:
        return None
    return Fechamento.model_validate_json(row[0])


def gravar(fechamento: Fechamento) -> None:
    payload = fechamento.model_dump_json()
    agora = datetime.now().strftime("%d/%m/%Y %H:%M")
    with conectar() as con:
        con.execute(
            """
            INSERT INTO fechamentos (periodo, atualizacao, payload, gravado_em)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(periodo) DO UPDATE SET
                atualizacao = excluded.atualizacao,
                payload = excluded.payload,
                gravado_em = excluded.gravado_em
            """,
            (fechamento.periodo, fechamento.atualizacao or agora, payload, agora),
        )


def ultimo() -> Fechamento | None:
    with conectar() as con:
        row = con.execute(
            "SELECT payload FROM fechamentos ORDER BY periodo DESC LIMIT 1"
        ).fetchone()
    if not row:
        return None
    return Fechamento.model_validate_json(row[0])


def aplicar_bases(fechamento: Fechamento, novas: list[BaseMensal], campos: tuple[str, ...]) -> None:
    if not novas:
        return
    chaves = {(b.escritorio, b.setor, b.ano) for b in novas}
    for b in fechamento.bases:
        if (b.escritorio, b.setor, b.ano) in chaves:
            for campo in campos:
                setattr(b, campo, None)
    indice = {(b.escritorio, b.setor, b.ano, b.mes): b for b in fechamento.bases}
    for nova in novas:
        k = (nova.escritorio, nova.setor, nova.ano, nova.mes)
        if k not in indice:
            indice[k] = nova
            fechamento.bases.append(nova)
            continue
        dest = indice[k]
        for campo in campos:
            setattr(dest, campo, getattr(nova, campo))
    fechamento.bases = [
        b for b in fechamento.bases
        if any(getattr(b, c) is not None for c in CAMPOS)
    ]


def aplicar_metas(fechamento: Fechamento, metas: list[MetaIndicador]) -> None:
    def chave(m: MetaIndicador):
        return (m.escopo, m.escritorio, m.setor)

    novas = {chave(m): m for m in metas}
    fechamento.metas = [m for m in fechamento.metas if chave(m) not in novas]
    fechamento.metas.extend(novas.values())


def vazio(periodo: str) -> Fechamento:
    return Fechamento(periodo=periodo, atualizacao=datetime.now().strftime("%d/%m/%Y %H:%M"))
