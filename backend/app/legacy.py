"""Converte o DATA publicado no HTML legado para o contrato canônico.

O grade antigo traz só o mês e o YTD acumulado, sem a série. O resíduo
(YTD − mês) entra em janeiro para o custo YTD continuar igual à soma.
O FTE do YTD antigo é um retrato, não a soma dos meses: fica só no mês
de fechamento. A produtividade YTD nova, por isso, deixa de usar o
número manual.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from .calc import parse_numero
from .schema import (
    MESES_PT,
    Colaboradores,
    Fechamento,
    HistoricoVolumetria,
    KpiCard,
    MetaIndicador,
    OperacionalCard,
    SacBloco,
)

HTML_PADRAO = Path(__file__).resolve().parents[2] / "HTML.html"


def extrair_data(html: str) -> dict:
    m = re.search(r"(?:var|let|const)\s+DATA\s*=\s*", html)
    if not m:
        raise ValueError("Bloco var DATA não encontrado no HTML.")
    i = m.end()
    if html[i] != "{":
        raise ValueError("DATA não é um objeto.")
    prof = 0
    for j in range(i, len(html)):
        if html[j] == "{":
            prof += 1
        elif html[j] == "}":
            prof -= 1
            if prof == 0:
                return json.loads(html[i : j + 1])
    raise ValueError("Objeto DATA não fecha.")


def periodo_de_rotulo(rotulo: str) -> str:
    mes_txt, ano = rotulo.split("/")
    return f"{ano}-{MESES_PT.index(mes_txt) + 1:02d}"


def _hhmm_minutos(valor) -> float | None:
    if valor is None:
        return None
    s = str(valor).strip()
    if not s:
        return None
    m = re.match(r"^(\d{1,3}):(\d{2})", s)
    if m:
        return int(m.group(1)) * 60 + int(m.group(2))
    return parse_numero(s)


def _meta_num(valor, unidade: str) -> float | None:
    if unidade == "hhmm":
        return _hhmm_minutos(valor)
    return parse_numero(valor)


def fechamento_do_legado(data: dict) -> Fechamento:
    periodo = periodo_de_rotulo(data.get("periodo") or "Set/2026")
    ano, mes = (int(p) for p in periodo.split("-"))
    grade = data.get("taticos_grade") or {}
    bases = []
    metas: list[MetaIndicador] = []

    for pais in ("BR", "PY"):
        bloco_pais = grade.get(pais) or {}
        pais_meta = (bloco_pais.get("@pais") or {}).get("metas") or {}
        metas.append(MetaIndicador(
            escopo="escritorio",
            escritorio=pais,
            transacoes_por_fte=parse_numero(pais_meta.get("transacoes_por_fte")),
            nivel_servico=parse_numero(pais_meta.get("nivel_servico")),
        ))
        for setor, bloco in bloco_pais.items():
            if not isinstance(bloco, dict) or str(setor).startswith("@"):
                continue
            mes_b = bloco.get("mes") or {}
            ytd_b = bloco.get("ytd") or {}
            m_meta = (bloco.get("metas") or {})
            metas.append(MetaIndicador(
                escopo="setor",
                escritorio=pais,
                setor=setor,
                transacoes_por_fte=parse_numero(m_meta.get("transacoes_por_fte")),
                nivel_servico=parse_numero(m_meta.get("nivel_servico")),
            ))
            atual = {
                "orcamento": parse_numero(mes_b.get("orcamento")),
                "realizado": parse_numero(mes_b.get("realizado")),
                "transacoes": parse_numero(mes_b.get("transacoes")),
                "fte": parse_numero(mes_b.get("fte")),
                "atendidas": parse_numero(mes_b.get("atendidas")),
                "total_chamadas": parse_numero(mes_b.get("total")),
            }
            ytd = {
                "orcamento": parse_numero(ytd_b.get("orcamento")),
                "realizado": parse_numero(ytd_b.get("realizado")),
                "transacoes": parse_numero(ytd_b.get("transacoes")),
                "fte": parse_numero(ytd_b.get("fte")),
                "atendidas": parse_numero(ytd_b.get("atendidas")),
                "total_chamadas": parse_numero(ytd_b.get("total")),
            }
            bases.append({"escritorio": pais, "setor": setor, "ano": ano, "mes": mes, **atual})
            if mes > 1:
                residuo = {}
                for campo in ("orcamento", "realizado", "transacoes", "atendidas", "total_chamadas"):
                    a, y = atual.get(campo), ytd.get(campo)
                    if y is None:
                        residuo[campo] = None
                    elif a is None:
                        residuo[campo] = y
                    else:
                        residuo[campo] = y - a
                residuo["fte"] = None
                if any(v not in (None, 0) for v in residuo.values()):
                    bases.append({"escritorio": pais, "setor": setor, "ano": ano, "mes": 1, **residuo})

    cons = grade.get("@consolidado") or {}
    pais_cons = (cons.get("@pais") or {}).get("metas") or {}
    metas.append(MetaIndicador(
        escopo="consolidado",
        transacoes_por_fte=parse_numero(pais_cons.get("transacoes_por_fte")),
        nivel_servico=parse_numero(pais_cons.get("nivel_servico")),
    ))
    for setor, bloco in cons.items():
        if str(setor).startswith("@") or not isinstance(bloco, dict):
            continue
        m_meta = bloco.get("metas") or {}
        metas.append(MetaIndicador(
            escopo="consolidado_setor",
            setor=setor,
            transacoes_por_fte=parse_numero(m_meta.get("transacoes_por_fte")),
            nivel_servico=parse_numero(m_meta.get("nivel_servico")),
        ))

    colaboradores, historico = _volumetria_legada(data.get("volumetria") or [], ano)
    return Fechamento(
        periodo=periodo,
        atualizacao=data.get("atualizacao") or "",
        bases=bases,
        metas=metas,
        colaboradores=colaboradores,
        historico=historico,
        operacionais=_operacionais_legados(data.get("operacionais") or [], ano, mes),
        exportacao=_kpis_legados((data.get("exportacao") or {}).get("kpis") or []),
        sac=SacBloco(kpis=_kpis_legados((data.get("sac") or {}).get("kpis") or [], pagina_sac=True)),
    )


def _moeda(valor) -> float | None:
    return parse_numero(valor)


def _volumetria_legada(cards: list, ano: int) -> tuple[list[Colaboradores], list[HistoricoVolumetria]]:
    colaboradores: list[Colaboradores] = []
    historico: list[HistoricoVolumetria] = []
    por_esc: dict[str, dict] = {"BR": {}, "PY": {}}
    for card in cards:
        label = card.get("label") or ""
        valores = card.get("valores") or {}
        for esc in ("BR", "PY"):
            v = valores.get(esc) or {}
            if "Colaboradores" in label:
                q = parse_numero(v.get(f"ano{ano}"))
                q_ant = parse_numero(v.get(f"ano{ano - 1}"))
                if q is not None:
                    colaboradores.append(Colaboradores(escritorio=esc, ano=ano, quantidade=q))
                if q_ant is not None:
                    colaboradores.append(Colaboradores(escritorio=esc, ano=ano - 1, quantidade=q_ant))
            elif label == "Transações MBS":
                por_esc[esc]["transacoes_mes"] = parse_numero((v.get(f"ano{ano - 1}") or {}).get("mes"))
                por_esc[esc]["transacoes_ytd"] = parse_numero((v.get(f"ano{ano - 1}") or {}).get("ytd"))
            elif label == "Orçamento Realizado":
                por_esc[esc]["realizado_mes"] = _moeda((v.get(f"ano{ano - 1}") or {}).get("mes"))
                por_esc[esc]["realizado_ytd"] = _moeda((v.get(f"ano{ano - 1}") or {}).get("ytd"))
            elif label == "Orçamento Previsto":
                por_esc[esc]["previsto_mes"] = _moeda((v.get(f"ano{ano - 1}") or {}).get("mes"))
                por_esc[esc]["previsto_ytd"] = _moeda((v.get(f"ano{ano - 1}") or {}).get("ytd"))
    for esc, campos in por_esc.items():
        if any(x is not None for x in campos.values()):
            historico.append(HistoricoVolumetria(escritorio=esc, ano=ano - 1, **campos))
    return colaboradores, historico


def _destino_de_titulo(titulo: str) -> str:
    if " - " in titulo:
        return titulo.split(" - ", 1)[0].strip()
    return ""


def _kpis_legados(kpis: list, pagina_sac: bool = False) -> list[KpiCard]:
    out = []
    for k in kpis:
        pais = k.get("pais") or "BR"
        if pais not in {"BR", "PY"}:
            pais = "BR"
        valores = ((k.get("valores") or {}).get(pais) or {})
        titulo = k.get("titulo") or ""
        out.append(KpiCard(
            titulo=titulo,
            fonte=k.get("fonte") or "",
            escritorio=pais,
            destino="" if pagina_sac else _destino_de_titulo(titulo),
            mes=parse_numero(valores.get("mes") if valores.get("mes") not in ("", None) else valores.get("valor")),
            ytd=parse_numero(valores.get("ytd")),
            meta=parse_numero(valores.get("meta")),
            mes_status=valores.get("mesStatus") or "",
            ytd_status=valores.get("ytdStatus") or "",
        ))
    return out


def _operacionais_legados(secoes: list, ano: int, mes: int) -> list[OperacionalCard]:
    cards = []
    for sec in secoes:
        setor = sec.get("titulo") or ""
        for item in sec.get("itens") or []:
            unidade = "hhmm" if item.get("unidade_tempo") == "hhmm" or item.get("tipo_card") == "tempo_medio" else "percentual"
            if item.get("unidade_tempo") == "dias":
                unidade = "dias"
            for esc in ("BR", "PY"):
                v = (item.get("valores") or {}).get(esc) or {}
                if unidade == "hhmm":
                    mes_v = _hhmm_minutos(v.get("tempoMes"))
                    ytd_v = _hhmm_minutos(v.get("tempoYTD"))
                elif unidade == "dias":
                    mes_v = parse_numero(v.get("tempoMes") or v.get("pctMes"))
                    ytd_v = parse_numero(v.get("tempoYTD") or v.get("pctYTD"))
                else:
                    mes_v = parse_numero(v.get("pctMes"))
                    ytd_v = parse_numero(v.get("pctYTD"))
                if mes_v is None and ytd_v is None and not parse_numero(v.get("dentro")):
                    continue
                meta = _meta_num(v.get("meta"), unidade)
                direction = v.get("direction") or "higher"
                if direction not in {"higher", "lower"}:
                    direction = "higher"
                cards.append(OperacionalCard(
                    setor=setor,
                    escritorio=esc,
                    nome=item.get("label") or "",
                    unidade=unidade,
                    direction=direction,
                    meta=meta,
                    meta_rotulo=str(v.get("meta") or "") or None,
                    mes_resultado=None if unidade == "hhmm" else mes_v,
                    mes_tempo=mes_v if unidade == "hhmm" else None,
                    ytd_resultado=None if unidade == "hhmm" else ytd_v,
                    ytd_tempo=ytd_v if unidade == "hhmm" else None,
                    mes_dentro=parse_numero(v.get("dentro")),
                    mes_fora=parse_numero(v.get("fora")),
                    mes_volume=parse_numero(v.get("volMes")),
                    ytd_volume=parse_numero(v.get("volYTD")),
                ))
    return cards


def carregar_html(caminho: Path | None = None) -> Fechamento:
    path = caminho or HTML_PADRAO
    return fechamento_do_legado(extrair_data(path.read_text(encoding="utf-8")))
