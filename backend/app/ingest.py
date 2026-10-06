"""Leitura das planilhas conhecidas para o mesmo JSON do RPA.

Arquivo fora do padrão é recusado. Três formatos:

- Transações por FTE: aba do ano, colunas País, Setor e os meses.
- Orçamento oficial: aba Resultados, blocos de orçamento e realizado total.
- Operacional de logística: abas Brasil AAAA e Indicadores LATAM AAAA.
- Aba PainelMBS: template explícito do contrato (escritorio, setor, ano, mes, ...).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, time
from io import BytesIO

from openpyxl import load_workbook

from .calc import parse_numero
from .legacy import _hhmm_minutos
from .schema import BaseMensal, HeadcountOrcado, MetaIndicador, OperacionalCard, OperacionalMes

MESES = {
    "JAN": 1, "FEV": 2, "MAR": 3, "ABR": 4, "MAI": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SET": 9, "OUT": 10, "NOV": 11, "DEZ": 12,
}

SUBLINHAS = {
    "dentro", "fora", "resultado", "total", "média tempo em (h:mm)",
    "media tempo em (h:mm)", "ytd - tempo médio", "ytd - total de ocs",
    "ytd - dentro", "ytd - resultado", "ytd - total", "ytd - erros",
    "ytd - acertos", "promedio dias lanzamiento", "prom días de pago",
    "prom dias de pago",
}


@dataclass
class Leitura:
    tipo: str
    bases: list[BaseMensal] = field(default_factory=list)
    metas: list[MetaIndicador] = field(default_factory=list)
    metas_mensais: list[dict] = field(default_factory=list)
    operacionais: list[OperacionalCard] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)
    campos_base: tuple[str, ...] = ()
    headcount: list[HeadcountOrcado] = field(default_factory=list)


def ler_planilha(conteudo: bytes, nome: str) -> Leitura:
    try:
        wb = load_workbook(BytesIO(conteudo), data_only=True, read_only=True)
    except Exception as exc:
        raise ValueError(f"{nome}: não é uma planilha Excel válida ({exc}).") from exc
    try:
        nomes = [s.lower() for s in wb.sheetnames]
        if any(n == "painelmbs" for n in nomes):
            return _ler_template(wb, nome)
        if _tem_fte(wb):
            return _ler_fte(wb, nome)
        if any(n.startswith("resultados") for n in nomes):
            return _ler_orcamento(wb, nome)
        if any(n.startswith("brasil") or n.startswith("indicadores latam") for n in nomes):
            return _ler_operacional(wb, nome)
    finally:
        wb.close()
    raise ValueError(
        f"{nome}: fora do padrão. Use Transações por FTE, Orçamento (aba Resultados), "
        "Operacional de logística (abas Brasil ou Indicadores LATAM) ou uma aba PainelMBS."
    )


def _tem_fte(wb) -> bool:
    for nome in wb.sheetnames:
        if not re.fullmatch(r"20\d{2}", nome.strip()):
            continue
        ws = wb[nome]
        for row in ws.iter_rows(max_row=8, max_col=6, values_only=True):
            textos = [str(c).strip().lower() for c in row if c is not None]
            if "país" in textos or "pais" in textos:
                if "setor" in textos:
                    return True
    return False


def _linhas(ws, max_col=40):
    return [list(r) for r in ws.iter_rows(max_col=max_col, values_only=True)]


def _norm(valor) -> str:
    if valor is None:
        return ""
    return str(valor).replace("\u00a0", " ").strip()


def _mes_header(valor) -> int | None:
    s = _norm(valor).upper()
    s = s.replace(".", "")
    return MESES.get(s[:3]) if len(s) >= 3 else None


def _setor_canonico(nome: str) -> str | None:
    n = _norm(nome).upper().replace("–", "-").replace("—", "-")
    if "ESCRIT" in n:
        return None
    if "INFRA" in n:
        return None
    if "PESSOAL" in n or "PESSOA" in n:
        return "Administrativo de Pessoal"
    if "GEST" in n and ("SERVI" in n or "ATEND" in n):
        return "Gestão de Serviços e Atendimento"
    if "FINANC" in n:
        return "Transações Financeiras"
    if "LOG" in n:
        return "Transações Logísticas"
    return None


def _ler_template(wb, nome: str) -> Leitura:
    ws = wb["PainelMBS"] if "PainelMBS" in wb.sheetnames else wb[[s for s in wb.sheetnames if s.lower() == "painelmbs"][0]]
    rows = _linhas(ws)
    if not rows:
        raise ValueError(f"{nome}: aba PainelMBS vazia.")
    header = [_norm(c).lower() for c in rows[0]]
    obrigatorias = ["escritorio", "setor", "ano", "mes"]
    for col in obrigatorias:
        if col not in header:
            raise ValueError(f"{nome}: aba PainelMBS sem a coluna {col}.")
    idx = {h: i for i, h in enumerate(header) if h}
    bases = []
    for linha, row in enumerate(rows[1:], start=2):
        if not any(row):
            continue
        def pega(col):
            i = idx.get(col)
            if i is None or i >= len(row):
                return None
            return row[i]
        esc = _norm(pega("escritorio")).upper()
        setor = _setor_canonico(pega("setor")) or _norm(pega("setor"))
        if esc not in {"BR", "PY"}:
            raise ValueError(f"{nome}: linha {linha}, escritório inválido ({esc}).")
        if not setor:
            raise ValueError(f"{nome}: linha {linha} sem setor reconhecido.")
        ano = parse_numero(pega("ano"))
        mes = parse_numero(pega("mes"))
        if ano is None or mes is None or not 1 <= int(mes) <= 12:
            raise ValueError(f"{nome}: linha {linha} com ano ou mês inválido.")
        bases.append(BaseMensal(
            escritorio=esc,
            setor=setor,
            ano=int(ano),
            mes=int(mes),
            orcamento=parse_numero(pega("orcamento")),
            realizado=parse_numero(pega("realizado")),
            transacoes=parse_numero(pega("transacoes")),
            fte=parse_numero(pega("fte")),
            atendidas=parse_numero(pega("atendidas")),
            total_chamadas=parse_numero(pega("total_chamadas")),
        ))
    if not bases:
        raise ValueError(f"{nome}: aba PainelMBS não tem linhas de dados.")
    return Leitura(tipo="template", bases=bases, campos_base=(
        "orcamento", "realizado", "transacoes", "fte", "atendidas", "total_chamadas",
    ))


def _ler_fte(wb, nome: str) -> Leitura:
    bases: list[BaseMensal] = []
    metas_mensais: list[dict] = []
    for aba in wb.sheetnames:
        if not re.fullmatch(r"20\d{2}", aba.strip()):
            continue
        ano = int(aba.strip())
        rows = _linhas(wb[aba], max_col=24)
        header_i = None
        col_pais = col_setor = None
        meses_cols: dict[int, int] = {}
        for i, row in enumerate(rows[:12]):
            textos = [_norm(c).lower() for c in row]
            if "setor" in textos and ("país" in textos or "pais" in textos):
                header_i = i
                col_pais = textos.index("país") if "país" in textos else textos.index("pais")
                col_setor = textos.index("setor")
                for j, c in enumerate(row):
                    m = _mes_header(c)
                    if m:
                        meses_cols[m] = j
                break
        if header_i is None or not meses_cols:
            raise ValueError(f"{nome}: aba {aba} sem cabeçalho País / Setor / meses.")
        i = header_i + 1
        while i < len(rows):
            row = rows[i]
            pais = _norm(row[col_pais]).upper() if col_pais < len(row) else ""
            setor_bruto = _norm(row[col_setor]) if col_setor < len(row) else ""
            setor = _setor_canonico(setor_bruto)
            if pais in {"BR", "PY"} and setor:
                bloco = {"fte": {}, "meta": {}, "volume": {}}
                for mes, col in meses_cols.items():
                    if col < len(row):
                        bloco["volume"][mes] = parse_numero(row[col])
                i += 1
                while i < len(rows):
                    nxt = rows[i]
                    pais_n = _norm(nxt[col_pais]).upper() if col_pais < len(nxt) else ""
                    setor_n = _setor_canonico(_norm(nxt[col_setor]) if col_setor < len(nxt) else "")
                    if pais_n in {"BR", "PY"} and setor_n:
                        break
                    rotulo = _norm(nxt[col_setor] if col_setor < len(nxt) else "").lower()
                    if not rotulo and col_pais < len(nxt):
                        rotulo = _norm(nxt[col_pais]).lower()
                    destino = None
                    if rotulo == "fte":
                        destino = "fte"
                    elif rotulo.startswith("meta"):
                        destino = "meta"
                    if destino:
                        for mes, col in meses_cols.items():
                            if col < len(nxt):
                                bloco[destino][mes] = parse_numero(nxt[col])
                    i += 1
                for mes in meses_cols:
                    vol = bloco["volume"].get(mes)
                    fte = bloco["fte"].get(mes)
                    if vol is None and fte is None:
                        continue
                    bases.append(BaseMensal(
                        escritorio=pais, setor=setor, ano=ano, mes=mes,
                        transacoes=vol, fte=fte,
                    ))
                    if bloco["meta"].get(mes) is not None:
                        metas_mensais.append({
                            "escritorio": pais, "setor": setor, "ano": ano, "mes": mes,
                            "transacoes_por_fte": bloco["meta"][mes],
                        })
                continue
            i += 1
    if not bases:
        raise ValueError(f"{nome}: nenhuma linha de transações por FTE reconhecida.")
    return Leitura(tipo="transacoes_fte", bases=bases, metas_mensais=metas_mensais, campos_base=("transacoes", "fte"))


def _ler_orcamento(wb, nome: str) -> Leitura:
    bases: list[BaseMensal] = []
    avisos: list[str] = []
    headcount: list[HeadcountOrcado] = []
    for aba in wb.sheetnames:
        if not aba.lower().startswith("resultados"):
            continue
        esc = "PY" if "PY" in aba.upper() else "BR"
        rows = _linhas(wb[aba], max_col=20)
        header_i = None
        meses_cols: dict[int, int] = {}
        for i, row in enumerate(rows[:8]):
            achou = {}
            for j, c in enumerate(row):
                m = _mes_header(c)
                if m:
                    achou[m] = j
            if len(achou) >= 6:
                header_i = i
                meses_cols = achou
                break
        if header_i is None:
            raise ValueError(f"{nome}: aba {aba} sem os meses JAN–DEZ.")
        ano = None
        for c in rows[0][:3]:
            n = parse_numero(c)
            if n and 2000 <= n <= 2100:
                ano = int(n)
        if ano is None:
            m = re.search(r"20\d{2}", aba)
            ano = int(m.group(0)) if m else None
        if ano is None:
            raise ValueError(f"{nome}: aba {aba} sem o ano do exercício.")
        secao = None
        hc_mes: dict[int, float] = {}
        for row in rows[header_i + 1:]:
            marca = _norm(row[0]).upper()
            if marca == "HC" or marca.startswith("HC "):
                for mes, col in meses_cols.items():
                    if col >= len(row):
                        continue
                    valor = parse_numero(row[col])
                    if valor is None:
                        continue
                    hc_mes[mes] = hc_mes.get(mes, 0.0) + valor
                secao = None
                continue
            if "ORÇAMENTO" in marca or "ORCAMENTO" in marca:
                secao = "orcamento"
                continue
            if "REALIZADO TOTAL" in marca:
                secao = "realizado"
            if marca in {"TOTAL", "YTD", "HC"} or marca.startswith("REALIZADO PESSOAS"):
                if marca != "REALIZADO TOTAL":
                    secao = None
                    continue
            if secao is None:
                continue
            if len(row) < 2:
                continue
            setor = _setor_canonico(row[1])
            if setor is None:
                bruto = _norm(row[1])
                if bruto and "MÊS" not in bruto.upper() and "MES" not in bruto.upper() and "YTD" not in bruto.upper():
                    if "INFRA" in bruto.upper() or bruto:
                        avisos.append(f"{aba}: pilar '{bruto}' não entra nos setores do painel.")
                continue
            for mes, col in meses_cols.items():
                if col >= len(row):
                    continue
                valor = parse_numero(row[col])
                if valor is None:
                    continue
                bases.append(BaseMensal(
                    escritorio=esc, setor=setor, ano=ano, mes=mes,
                    **{secao: valor},
                ))
        headcount.extend(
            HeadcountOrcado(escritorio=esc, ano=ano, mes=mes, quantidade=qtd)
            for mes, qtd in sorted(hc_mes.items())
        )
    if not bases:
        raise ValueError(f"{nome}: aba Resultados sem orçamento ou realizado reconhecido.")
    # Funde orçamento e realizado do mesmo mês.
    fundidos: dict[tuple, BaseMensal] = {}
    for b in bases:
        k = (b.escritorio, b.setor, b.ano, b.mes)
        if k not in fundidos:
            fundidos[k] = b
        else:
            dest = fundidos[k]
            if b.orcamento is not None:
                dest.orcamento = b.orcamento
            if b.realizado is not None:
                dest.realizado = b.realizado
    avisos = list(dict.fromkeys(avisos))
    return Leitura(
        tipo="orcamento",
        bases=list(fundidos.values()),
        avisos=avisos,
        campos_base=("orcamento", "realizado"),
        headcount=headcount,
    )


def _unidade_titulo(titulo: str) -> str:
    t = titulo.lower()
    if "porcent" in t or "%" in t:
        return "percentual"
    if "hora" in t or "h:mm" in t or "hh:mm" in t or re.search(r"\d{1,2}:\d{2}", t):
        return "hhmm"
    if re.search(r"\bdias?\b", t) and "dentro de" not in t:
        return "dias"
    return "percentual"


def _e_titulo(rotulo: str) -> bool:
    s = rotulo.strip().lower()
    if len(s) < 8:
        return False
    if s.startswith("ytd"):
        return False
    if s in SUBLINHAS or s.startswith("total de") or s.startswith("promedio") or s.startswith("prom "):
        return False
    return True


def _tempo_de_celula(valor, unidade: str) -> float | None:
    if valor is None or valor == "":
        return None
    if isinstance(valor, datetime):
        return valor.hour * 60 + valor.minute + valor.second / 60
    if isinstance(valor, time):
        return valor.hour * 60 + valor.minute
    if isinstance(valor, (int, float)) and unidade == "hhmm" and 0 < float(valor) < 1:
        return round(float(valor) * 24 * 60, 2)
    if isinstance(valor, (int, float)) and unidade == "dias":
        return float(valor)
    if isinstance(valor, str):
        return _hhmm_minutos(valor) if unidade == "hhmm" else parse_numero(valor)
    return parse_numero(valor)


def _meta_de_celula(valor, unidade: str) -> tuple[float | None, str | None]:
    if valor is None or valor == "":
        return None, None
    rotulo = str(valor).strip() if not isinstance(valor, (int, float)) else None
    if unidade == "hhmm":
        if isinstance(valor, (int, float)) and 0 < float(valor) < 1:
            return round(float(valor) * 24 * 60, 2), rotulo
        return _hhmm_minutos(valor), rotulo or None
    n = parse_numero(valor)
    return n, rotulo


def _classificar_sub(rotulo: str) -> str | None:
    s = rotulo.strip().lower()
    if s in {"dentro", "dentre"}:
        return "dentro"
    if s == "fora":
        return "fora"
    if s in {"total", "total de ocs", "total de transações", "total de transacoes", "total de pagamentos"}:
        return "volume"
    if s.startswith("total de"):
        return "volume"
    if "média tempo" in s or "media tempo" in s or s.startswith("promedio dias") or s.startswith("prom dias") or s.startswith("prom días"):
        return "tempo"
    if s == "resultado":
        return "resultado"
    return None


def _ler_operacional(wb, nome: str) -> Leitura:
    cards: list[OperacionalCard] = []
    for aba in wb.sheetnames:
        baixo = aba.lower()
        if baixo.startswith("brasil"):
            esc = "BR"
        elif baixo.startswith("indicadores latam"):
            esc = "PY"
        else:
            continue
        m = re.search(r"20\d{2}", aba)
        if not m:
            raise ValueError(f"{nome}: aba {aba} sem ano no nome.")
        ano = int(m.group(0))
        rows = _linhas(wb[aba], max_col=20)
        header_i = None
        col_nome = None
        col_meta = None
        meses_cols: dict[int, int] = {}
        for i, row in enumerate(rows[:10]):
            achou = {}
            for j, c in enumerate(row):
                mes = _mes_header(c)
                if mes:
                    achou[mes] = j
            if len(achou) >= 6:
                header_i = i
                meses_cols = achou
                for j, c in enumerate(row):
                    t = _norm(c).lower()
                    if "indicador" in t:
                        col_nome = j
                    if t == "meta":
                        col_meta = j
                break
        if header_i is None or col_nome is None:
            raise ValueError(f"{nome}: aba {aba} sem cabeçalho de indicador e meses.")
        atual: dict | None = None

        def fecha():
            nonlocal atual
            if not atual:
                return
            unidade = atual["unidade"]
            if any((p or {}).get("dentro") is not None for p in atual["meses"].values()):
                unidade = "percentual"
            serie = []
            for mes in range(1, 13):
                ponto = atual["meses"].get(mes)
                if not ponto:
                    continue
                if not any(ponto.get(k) is not None for k in ("dentro", "fora", "volume", "tempo", "resultado")):
                    continue
                if unidade == "percentual" and ponto.get("resultado") is not None and ponto["resultado"] <= 1:
                    ponto = dict(ponto)
                    ponto["resultado"] = ponto["resultado"] * 100
                serie.append(OperacionalMes(ano=ano, mes=mes, **ponto))
            if not serie:
                atual = None
                return
            cards.append(OperacionalCard(
                setor="Transações Logísticas",
                escritorio=esc,
                nome=atual["nome"],
                unidade=unidade,
                direction="lower" if unidade in {"hhmm", "dias"} else "higher",
                meta=atual["meta"],
                meta_rotulo=atual["meta_rotulo"],
                serie=serie,
            ))
            atual = None

        for row in rows[header_i + 1:]:
            nome = _norm(row[col_nome]) if col_nome < len(row) else ""
            if _e_titulo(nome):
                fecha()
                unidade = _unidade_titulo(nome)
                meta_raw = row[col_meta] if col_meta is not None and col_meta < len(row) else None
                meta, rotulo = _meta_de_celula(meta_raw, unidade)
                atual = {"nome": nome, "unidade": unidade, "meta": meta, "meta_rotulo": rotulo, "meses": {}}
                continue
            if atual is None or not nome:
                continue
            tipo = _classificar_sub(nome)
            if not tipo:
                continue
            for mes, col in meses_cols.items():
                if col >= len(row):
                    continue
                bruto = row[col]
                if tipo == "tempo":
                    valor = _tempo_de_celula(bruto, atual["unidade"])
                elif tipo == "resultado" and atual["unidade"] == "percentual":
                    valor = parse_numero(bruto)
                    if valor is not None and valor <= 1:
                        valor = valor * 100
                else:
                    valor = parse_numero(bruto)
                if valor is None:
                    continue
                atual["meses"].setdefault(mes, {})[tipo] = valor
        fecha()
    if not cards:
        raise ValueError(f"{nome}: nenhum indicador operacional reconhecido.")
    return Leitura(tipo="operacional_logistica", operacionais=cards)
