"""Indicadores do MBS.

Custo, produtividade e nível de serviço saem das bases mensais.
BR+PY soma as bases e só então divide. Nunca soma o índice pronto.
YTD de produtividade é a média ponderada: soma das transações / soma dos FTEs
de janeiro até o mês do fechamento.
"""

from __future__ import annotations

from typing import Optional

from .schema import (
    SETORES_POR_ESCRITORIO,
    BaseMensal,
    Fechamento,
    HistoricoVolumetria,
    MetaIndicador,
    OperacionalCard,
    periodo_rotulo,
)

CAMPOS = ("orcamento", "realizado", "transacoes", "fte", "atendidas", "total_chamadas")


def parse_numero(valor) -> Optional[float]:
    if valor is None or isinstance(valor, bool):
        return None
    if isinstance(valor, (int, float)):
        return float(valor)
    s = str(valor).strip()
    if s == "" or s in {"-", "—"}:
        return None
    s = s.replace("R$", "").replace("%", "").strip()
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    elif s.count(".") > 1:
        s = s.replace(".", "")
    try:
        return float(s)
    except ValueError:
        return None


def _vazio() -> dict[str, float]:
    return {c: 0.0 for c in CAMPOS} | {f"_{c}": False for c in CAMPOS}


def _acumular(destino: dict, origem: dict) -> None:
    for c in CAMPOS:
        if origem.get(f"_{c}"):
            destino[c] += origem[c]
            destino[f"_{c}"] = True


def _de_base(b: BaseMensal) -> dict:
    d = _vazio()
    for c in CAMPOS:
        v = getattr(b, c)
        if v is not None:
            d[c] = float(v)
            d[f"_{c}"] = True
    return d


def dividir(n: Optional[float], d: Optional[float]) -> Optional[float]:
    if n is None or d is None or d == 0:
        return None
    return n / d


def _num(bloco: dict, campo: str) -> Optional[float]:
    if not bloco.get(f"_{campo}"):
        return None
    return bloco[campo]


class Totais:
    def __init__(self, bloco: dict):
        self.orcamento = _num(bloco, "orcamento")
        self.realizado = _num(bloco, "realizado")
        self.transacoes = _num(bloco, "transacoes")
        self.fte = _num(bloco, "fte")
        self.atendidas = _num(bloco, "atendidas")
        self.total_chamadas = _num(bloco, "total_chamadas")


def somar_bases(bases: list[BaseMensal]) -> Totais:
    acc = _vazio()
    for b in bases:
        _acumular(acc, _de_base(b))
    return Totais(acc)


def bases_no_intervalo(
    bases: list[BaseMensal],
    *,
    escritorios: list[str],
    setores: Optional[list[str]],
    ano: int,
    mes_ini: int,
    mes_fim: int,
) -> list[BaseMensal]:
    out = []
    for b in bases:
        if b.escritorio not in escritorios or b.ano != ano:
            continue
        if setores is not None and b.setor not in setores:
            continue
        if mes_ini <= b.mes <= mes_fim:
            out.append(b)
    return out


def custo(realizado: Optional[float], transacoes: Optional[float]) -> Optional[float]:
    return dividir(realizado, transacoes)


def produtividade(transacoes: Optional[float], fte: Optional[float]) -> Optional[float]:
    return dividir(transacoes, fte)


def nivel_servico(atendidas: Optional[float], total: Optional[float]) -> Optional[float]:
    r = dividir(atendidas, total)
    return r * 100 if r is not None else None


def status_meta(valor: Optional[float], meta: Optional[float], direction: str) -> str:
    if valor is None or meta is None or meta == 0:
        return "gray"
    ratio = valor / meta
    if direction == "lower":
        if ratio <= 1:
            return "green"
        if ratio <= 1.1:
            return "yellow"
        return "red"
    if ratio >= 1:
        return "green"
    if ratio >= 0.9:
        return "yellow"
    return "red"


def _meta_de(metas: list[MetaIndicador], escopo: str, escritorio: Optional[str], setor: Optional[str], campo: str) -> Optional[float]:
    for m in metas:
        if m.escopo != escopo:
            continue
        if escopo in {"setor", "escritorio", "consolidado_setor"} and m.escritorio != escritorio and escopo != "consolidado_setor":
            continue
        if escopo == "consolidado_setor" and m.setor != setor:
            continue
        if escopo == "setor" and m.setor != setor:
            continue
        if escopo == "escritorio" and m.escritorio != escritorio:
            continue
        return getattr(m, campo)
    return None


def _indicador(valor, meta, direction: str) -> dict:
    return {
        "valor": valor,
        "meta": meta,
        "direction": direction,
        "status": status_meta(valor, meta, direction),
    }


def indicadores_de_totais(mes: Totais, ytd: Totais, meta_fte: Optional[float], meta_ns: Optional[float]) -> dict:
    meta_custo = custo(mes.orcamento, mes.transacoes)
    return {
        "custo_por_transacao": _indicador(
            custo(mes.realizado, mes.transacoes),
            meta_custo,
            "lower",
        ) | {"ytd": custo(ytd.realizado, ytd.transacoes)},
        "transacoes_por_fte": _indicador(
            produtividade(mes.transacoes, mes.fte),
            meta_fte,
            "higher",
        ) | {"ytd": produtividade(ytd.transacoes, ytd.fte)},
        "nivel_servico": _indicador(
            nivel_servico(mes.atendidas, mes.total_chamadas),
            meta_ns,
            "higher",
        ) | {"ytd": nivel_servico(ytd.atendidas, ytd.total_chamadas)},
    }


def _escritorios_da_visao(visao: str) -> list[str]:
    if visao == "BR+PY":
        return ["BR", "PY"]
    return [visao]


def _setores_da_visao(visao: str) -> list[str]:
    if visao == "BR+PY":
        vistos = []
        for pais in ("BR", "PY"):
            for s in SETORES_POR_ESCRITORIO[pais]:
                if s not in vistos:
                    vistos.append(s)
        return vistos
    return list(SETORES_POR_ESCRITORIO[visao])


def _totais(
    fechamento: Fechamento,
    escritorios: list[str],
    setores: Optional[list[str]],
    ano: int,
    mes: int,
    ytd: bool,
    exige_fte: bool = False,
) -> Totais:
    bases = bases_no_intervalo(
        fechamento.bases,
        escritorios=escritorios,
        setores=setores,
        ano=ano,
        mes_ini=1 if ytd else mes,
        mes_fim=mes,
    )
    if exige_fte:
        bases = [b for b in bases if b.fte is not None]
    return somar_bases(bases)


def _meta_fte_ns(fechamento: Fechamento, visao: str, setor: Optional[str]) -> tuple[Optional[float], Optional[float]]:
    if setor is None:
        if visao == "BR+PY":
            return (
                _meta_de(fechamento.metas, "consolidado", None, None, "transacoes_por_fte"),
                _meta_de(fechamento.metas, "consolidado", None, None, "nivel_servico"),
            )
        return (
            _meta_de(fechamento.metas, "escritorio", visao, None, "transacoes_por_fte"),
            _meta_de(fechamento.metas, "escritorio", visao, None, "nivel_servico"),
        )
    if visao == "BR+PY":
        return (
            _meta_de(fechamento.metas, "consolidado_setor", "BR", setor, "transacoes_por_fte"),
            _meta_de(fechamento.metas, "consolidado_setor", "BR", setor, "nivel_servico"),
        )
    return (
        _meta_de(fechamento.metas, "setor", visao, setor, "transacoes_por_fte"),
        _meta_de(fechamento.metas, "setor", visao, setor, "nivel_servico"),
    )


def bloco_indicadores(fechamento: Fechamento, visao: str, setor: Optional[str]) -> dict:
    ano, mes = (int(p) for p in fechamento.periodo.split("-"))
    escritorios = _escritorios_da_visao(visao)
    setores = [setor] if setor else None
    if setor and visao != "BR+PY" and setor not in SETORES_POR_ESCRITORIO[visao]:
        return indicadores_de_totais(Totais(_vazio()), Totais(_vazio()), None, None)
    meta_fte, meta_ns = _meta_fte_ns(fechamento, visao, setor)
    mes_t = _totais(fechamento, escritorios, setores, ano, mes, ytd=False)
    ytd_t = _totais(fechamento, escritorios, setores, ano, mes, ytd=True)
    # Produtividade só entra no mês que tem FTE. O resíduo do legado
    # carrega transação acumulada sem FTE e não pode inflar o YTD.
    mes_fte = _totais(fechamento, escritorios, setores, ano, mes, ytd=False, exige_fte=True)
    ytd_fte = _totais(fechamento, escritorios, setores, ano, mes, ytd=True, exige_fte=True)
    ind = indicadores_de_totais(mes_t, ytd_t, meta_fte, meta_ns)
    ind["transacoes_por_fte"]["valor"] = produtividade(mes_fte.transacoes, mes_fte.fte)
    ind["transacoes_por_fte"]["ytd"] = produtividade(ytd_fte.transacoes, ytd_fte.fte)
    for chave in ind:
        ind[chave]["status_ytd"] = status_meta(ind[chave]["ytd"], ind[chave]["meta"], ind[chave]["direction"])
    ind["bases"] = {
        "mes": mes_t.__dict__,
        "ytd": ytd_t.__dict__,
    }
    return ind


def _var_pct(atual: Optional[float], anterior: Optional[float]) -> Optional[float]:
    if atual is None or anterior in (None, 0):
        return None
    return (atual - anterior) / anterior * 100


def _hist(fechamento: Fechamento, escritorio: str, ano: int) -> Optional[HistoricoVolumetria]:
    for h in fechamento.historico:
        if h.escritorio == escritorio and h.ano == ano:
            return h
    return None


def _somar_campo_visao(fechamento: Fechamento, visao: str, ano: int, mes: int, campo: str, ytd: bool) -> Optional[float]:
    t = _totais(fechamento, _escritorios_da_visao(visao), None, ano, mes, ytd)
    return getattr(t, campo)


def _historico_visao(fechamento: Fechamento, visao: str, ano: int, campo: str) -> Optional[float]:
    escritorios = _escritorios_da_visao(visao)
    total = 0.0
    algum = False
    for esc in escritorios:
        h = _hist(fechamento, esc, ano)
        if h is None:
            continue
        v = getattr(h, campo)
        if v is not None:
            total += v
            algum = True
    return total if algum else None


def _hc_orcado(fechamento: Fechamento, visao: str, ano: int, mes: int) -> Optional[float]:
    """Headcount orçado do mês de fechamento. Se o mês ainda não veio na planilha, usa o último mês anterior com valor."""
    escritorios = _escritorios_da_visao(visao)
    por_mes: dict[int, float] = {}
    for item in fechamento.headcount_orcado:
        if item.escritorio not in escritorios or item.ano != ano:
            continue
        por_mes[item.mes] = por_mes.get(item.mes, 0.0) + item.quantidade
    if mes in por_mes:
        return por_mes[mes]
    anteriores = [m for m in por_mes if m < mes]
    if not anteriores:
        return None
    return por_mes[max(anteriores)]


def _colaboradores(fechamento: Fechamento, visao: str, ano: int) -> Optional[float]:
    escritorios = _escritorios_da_visao(visao)
    total = 0.0
    algum = False
    for c in fechamento.colaboradores:
        if c.escritorio in escritorios and c.ano == ano:
            total += c.quantidade
            algum = True
    return total if algum else None


def volumetria(fechamento: Fechamento, visao: str) -> list[dict]:
    ano, mes = (int(p) for p in fechamento.periodo.split("-"))
    ant = ano - 1

    def atual(campo, ytd=False):
        return _somar_campo_visao(fechamento, visao, ano, mes, campo, ytd)

    def anterior_base(campo, ytd=False):
        v = _somar_campo_visao(fechamento, visao, ant, mes, campo, ytd)
        if v is not None:
            return v
        chave = {
            ("transacoes", False): "transacoes_mes",
            ("transacoes", True): "transacoes_ytd",
            ("realizado", False): "realizado_mes",
            ("realizado", True): "realizado_ytd",
            ("orcamento", False): "previsto_mes",
            ("orcamento", True): "previsto_ytd",
        }[(campo, ytd)]
        return _historico_visao(fechamento, visao, ant, chave)

    col_atual = _colaboradores(fechamento, visao, ano)
    col_ant = _colaboradores(fechamento, visao, ant)
    col_orcado = _hc_orcado(fechamento, visao, ano, mes)
    trx_m, trx_y = atual("transacoes"), atual("transacoes", True)
    trx_m_a, trx_y_a = anterior_base("transacoes"), anterior_base("transacoes", True)
    rea_m, rea_y = atual("realizado"), atual("realizado", True)
    rea_m_a, rea_y_a = anterior_base("realizado"), anterior_base("realizado", True)
    prev_m, prev_y = atual("orcamento"), atual("orcamento", True)
    prev_m_a, prev_y_a = anterior_base("orcamento"), anterior_base("orcamento", True)

    def gap(orcado: Optional[float], realizado: Optional[float]) -> Optional[float]:
        if orcado is None or realizado is None:
            return None
        return realizado - orcado

    return [
        {
            "id": "colaboradores",
            "label": "Colaboradores MBS",
            "tipo": "yoy",
            "atual": col_atual,
            "anterior": col_ant,
            "variacao": _var_pct(col_atual, col_ant),
            "orcado": col_orcado,
            "variacao_orcado": _var_pct(col_atual, col_orcado),
        },
        {
            "id": "transacoes",
            "label": "Transações MBS",
            "tipo": "budget",
            "mes": trx_m,
            "ytd": trx_y,
            "mes_anterior": trx_m_a,
            "ytd_anterior": trx_y_a,
            "var_mes": _var_pct(trx_m, trx_m_a),
            "var_ytd": _var_pct(trx_y, trx_y_a),
        },
        {
            "id": "realizado",
            "label": "Orçamento Realizado",
            "tipo": "budget",
            "formato": "moeda",
            "mes": rea_m,
            "ytd": rea_y,
            "mes_anterior": rea_m_a,
            "ytd_anterior": rea_y_a,
            "var_mes": _var_pct(rea_m, rea_m_a),
            "var_ytd": _var_pct(rea_y, rea_y_a),
            "var_vs_previsto_mes": _var_pct(rea_m, prev_m),
            "var_vs_previsto_ytd": _var_pct(rea_y, prev_y),
        },
        {
            "id": "previsto",
            "label": "Orçamento Previsto",
            "tipo": "budget",
            "formato": "moeda",
            "mes": prev_m,
            "ytd": prev_y,
            "mes_anterior": prev_m_a,
            "ytd_anterior": prev_y_a,
            "var_mes": _var_pct(prev_m, prev_m_a),
            "var_ytd": _var_pct(prev_y, prev_y_a),
        },
        {
            "id": "oportunidade",
            "label": "Custo de oportunidade",
            "tipo": "comparacao",
            "formato": "moeda",
            "mes_orcado": prev_m,
            "mes_realizado": rea_m,
            "ytd_orcado": prev_y,
            "ytd_realizado": rea_y,
            "delta_mes": gap(prev_m, rea_m),
            "delta_ytd": gap(prev_y, rea_y),
            "var_mes": _var_pct(rea_m, prev_m),
            "var_ytd": _var_pct(rea_y, prev_y),
        },
    ]


TITULOS = {
    "custo_por_transacao": "Custo por Transação (R$)",
    "transacoes_por_fte": "Transações por FTE",
    "nivel_servico": "Atendimento ao Nível de Serviço (%)",
}


def _sem_bases(ind: dict) -> dict:
    return {k: v for k, v in ind.items() if k != "bases"}


def montar_gestao(fechamento: Fechamento, visao: str) -> dict:
    estrategicos = []
    bloco = bloco_indicadores(fechamento, visao, None)
    for chave, titulo in TITULOS.items():
        item = dict(bloco[chave])
        item["chave"] = chave
        item["titulo"] = titulo
        estrategicos.append(item)

    linhas = []
    for setor in _setores_da_visao(visao):
        b = bloco_indicadores(fechamento, visao, setor)
        linhas.append({
            "setor": setor,
            "indicadores": [
                {"chave": chave, "titulo": TITULOS[chave], **b[chave]}
                for chave in TITULOS
            ],
        })
    return {
        "estrategicos": estrategicos,
        "taticos": {"colunas": list(TITULOS.values()), "linhas": linhas},
    }


def _resultado_percentual(dentro: Optional[float], fora: Optional[float]) -> Optional[float]:
    if dentro is None and fora is None:
        return None
    d = dentro or 0
    f = fora or 0
    if d + f == 0:
        return None
    return d / (d + f) * 100


def _ponderar_tempo(pontos: list[tuple[Optional[float], Optional[float]]]) -> Optional[float]:
    num = 0.0
    den = 0.0
    algum = False
    for tempo, peso in pontos:
        if tempo is None:
            continue
        w = peso if peso not in (None, 0) else 1.0
        num += tempo * w
        den += w
        algum = True
    if not algum or den == 0:
        return None
    return num / den


def card_operacional(card: OperacionalCard, ano: int, mes: int) -> dict:
    serie = [p for p in card.serie if p.ano == ano and 1 <= p.mes <= mes]
    ponto = next((p for p in serie if p.mes == mes), None)

    if card.serie and ponto is not None:
        if card.unidade == "percentual":
            mes_res = ponto.resultado if ponto.resultado is not None else _resultado_percentual(ponto.dentro, ponto.fora)
            d = sum(p.dentro or 0 for p in serie)
            f = sum(p.fora or 0 for p in serie)
            ytd_res = _resultado_percentual(d, f) if any(p.dentro is not None or p.fora is not None for p in serie) else None
            mes_dentro, mes_fora, mes_vol = ponto.dentro, ponto.fora, ponto.volume
            ytd_vol = sum(p.volume or 0 for p in serie) or None
        else:
            mes_res = ponto.tempo if ponto.tempo is not None else ponto.resultado
            ytd_res = _ponderar_tempo([(p.tempo if p.tempo is not None else p.resultado, p.volume) for p in serie])
            mes_dentro = mes_fora = None
            mes_vol = ponto.volume
            ytd_vol = sum(p.volume or 0 for p in serie) or None
    else:
        mes_res = card.mes_tempo if card.unidade != "percentual" and card.mes_tempo is not None else card.mes_resultado
        ytd_res = card.ytd_tempo if card.unidade != "percentual" and card.ytd_tempo is not None else card.ytd_resultado
        mes_dentro, mes_fora, mes_vol, ytd_vol = card.mes_dentro, card.mes_fora, card.mes_volume, card.ytd_volume

    meta = card.meta
    if card.unidade == "percentual" and meta is not None and meta <= 1:
        meta = meta * 100
    if card.unidade == "percentual" and mes_res is not None and mes_res <= 1:
        mes_res = mes_res * 100
    if card.unidade == "percentual" and ytd_res is not None and ytd_res <= 1:
        ytd_res = ytd_res * 100

    pontos = []
    for ponto in serie:
        if card.unidade == "percentual":
            valor_ponto = ponto.resultado if ponto.resultado is not None else _resultado_percentual(ponto.dentro, ponto.fora)
            if valor_ponto is not None and valor_ponto <= 1:
                valor_ponto = valor_ponto * 100
        else:
            valor_ponto = ponto.tempo if ponto.tempo is not None else ponto.resultado
        pontos.append({
            "ano": ponto.ano,
            "mes": ponto.mes,
            "resultado": valor_ponto,
            "volume": ponto.volume,
        })

    return {
        "setor": card.setor,
        "escritorio": card.escritorio,
        "nome": card.nome,
        "unidade": card.unidade,
        "direction": card.direction,
        "meta": meta,
        "meta_rotulo": card.meta_rotulo,
        "mes": mes_res,
        "ytd": ytd_res,
        "dentro": mes_dentro,
        "fora": mes_fora,
        "volume": mes_vol,
        "volume_ytd": ytd_vol,
        "status": status_meta(mes_res, meta, card.direction),
        "status_ytd": status_meta(ytd_res, meta, card.direction),
        "serie": pontos,
    }


def montar_operacionais(fechamento: Fechamento, visao: str) -> list[dict]:
    ano, mes = (int(p) for p in fechamento.periodo.split("-"))
    escritorios = set(_escritorios_da_visao(visao))
    grupos: dict[str, list] = {}
    for card in fechamento.operacionais:
        if card.escritorio not in escritorios:
            continue
        grupos.setdefault(card.setor, []).append(card_operacional(card, ano, mes))
    return [{"setor": setor, "cards": cards} for setor, cards in grupos.items()]


def montar_painel(fechamento: Fechamento, visao: str) -> dict:
    gestao = montar_gestao(fechamento, visao)
    return {
        "periodo": fechamento.periodo,
        "periodo_rotulo": periodo_rotulo(fechamento.periodo),
        "atualizacao": fechamento.atualizacao,
        "visao": visao,
        "volumetria": volumetria(fechamento, visao),
        "estrategicos": gestao["estrategicos"],
        "taticos": gestao["taticos"],
        "operacionais": montar_operacionais(fechamento, visao),
        "exportacao": {
            "BR": [k.model_dump() for k in fechamento.exportacao if k.escritorio == "BR"],
            "PY": [k.model_dump() for k in fechamento.exportacao if k.escritorio == "PY"],
        },
        "sac": fechamento.sac.model_dump(),
    }
