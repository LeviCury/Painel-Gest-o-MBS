from pathlib import Path

from app.calc import bloco_indicadores, montar_painel, produtividade
from app.legacy import carregar_html, periodo_de_rotulo
from app.schema import BaseMensal, Fechamento, HeadcountOrcado, MetaIndicador

RAIZ = Path(__file__).resolve().parents[2]


def test_periodo_setembro():
    assert periodo_de_rotulo("Set/2026") == "2026-09"


def test_ytd_produtividade_e_media_ponderada():
    fechamento = Fechamento(
        periodo="2026-02",
        bases=[
            BaseMensal(escritorio="BR", setor="Transações Logísticas", ano=2026, mes=1, transacoes=100, fte=10, realizado=1000, orcamento=800),
            BaseMensal(escritorio="BR", setor="Transações Logísticas", ano=2026, mes=2, transacoes=300, fte=10, realizado=3000, orcamento=900),
        ],
        metas=[MetaIndicador(escopo="setor", escritorio="BR", setor="Transações Logísticas", transacoes_por_fte=20)],
    )
    bloco = bloco_indicadores(fechamento, "BR", "Transações Logísticas")
    assert bloco["transacoes_por_fte"]["valor"] == 30
    assert bloco["transacoes_por_fte"]["ytd"] == 20
    assert produtividade(400, 20) == 20


def test_br_py_soma_bases_antes_de_dividir():
    fechamento = Fechamento(
        periodo="2026-01",
        bases=[
            BaseMensal(escritorio="BR", setor="Transações Logísticas", ano=2026, mes=1, realizado=100, transacoes=10, orcamento=50),
            BaseMensal(escritorio="PY", setor="Transações Logísticas", ano=2026, mes=1, realizado=300, transacoes=10, orcamento=50),
        ],
    )
    bloco = bloco_indicadores(fechamento, "BR+PY", "Transações Logísticas")
    assert bloco["custo_por_transacao"]["valor"] == 20
    assert bloco["custo_por_transacao"]["meta"] == 5


def test_paridade_set_2026_com_o_html():
    html = RAIZ / "HTML.html"
    assert html.exists()
    fechamento = carregar_html(html)
    assert fechamento.periodo == "2026-09"

    def custo(visao):
        return bloco_indicadores(fechamento, visao, None)["custo_por_transacao"]

    br, py, ambos = custo("BR"), custo("PY"), custo("BR+PY")
    assert round(br["valor"], 2) == 7.35
    assert round(br["ytd"], 2) == 7.01
    assert round(br["meta"], 2) == 8.13
    assert round(py["valor"], 2) == 18.92
    assert round(py["ytd"], 2) == 9.82
    assert round(py["meta"], 2) == 7.85
    assert round(ambos["valor"], 2) == 11.93
    assert round(ambos["ytd"], 2) == 8.05
    assert round(ambos["meta"], 2) == 8.02

    prod = bloco_indicadores(fechamento, "BR+PY", None)["transacoes_por_fte"]
    assert round(prod["valor"]) == 1308
    # O HTML guardava 1208 digitado à mão. Sem a série mensal de FTE,
    # o YTD usa só os meses em que o FTE existe — aqui, o próprio mês.
    assert round(prod["ytd"]) == 1308
    assert round(prod["ytd"]) != 1208

    painel = montar_painel(fechamento, "BR")
    transacoes = next(v for v in painel["volumetria"] if v["id"] == "transacoes")
    assert transacoes["mes"] == 266248
    colaboradores = next(v for v in painel["volumetria"] if v["id"] == "colaboradores")
    assert colaboradores["atual"] == 244
    assert colaboradores["anterior"] == 252
    assert colaboradores["orcado"] is None
    realizado = next(v for v in painel["volumetria"] if v["id"] == "realizado")
    previsto = next(v for v in painel["volumetria"] if v["id"] == "previsto")
    oportunidade = next(v for v in painel["volumetria"] if v["id"] == "oportunidade")
    assert oportunidade["mes_orcado"] == previsto["mes"]
    assert oportunidade["mes_realizado"] == realizado["mes"]
    assert oportunidade["delta_mes"] == realizado["mes"] - previsto["mes"]
    assert oportunidade["delta_ytd"] == realizado["ytd"] - previsto["ytd"]
    assert oportunidade["var_mes"] == realizado["var_vs_previsto_mes"]
    assert oportunidade["var_ytd"] == realizado["var_vs_previsto_ytd"]
    logistica = next(s for s in painel["operacionais"] if s["setor"] == "Transações Logísticas")
    assert any("Fechamento OC" in c["nome"] for c in logistica["cards"])
    assert painel["exportacao"]["BR"]
    assert painel["exportacao"]["PY"]
    assert painel["sac"]["kpis"]


def test_headcount_orcado_cai_no_ultimo_mes_com_valor():
    fechamento = Fechamento(
        periodo="2026-09",
        colaboradores=[
            {"escritorio": "BR", "ano": 2026, "quantidade": 244},
        ],
        headcount_orcado=[
            HeadcountOrcado(escritorio="BR", ano=2026, mes=8, quantidade=213),
            HeadcountOrcado(escritorio="BR", ano=2026, mes=7, quantidade=200),
        ],
    )
    painel = montar_painel(fechamento, "BR")
    colaboradores = next(v for v in painel["volumetria"] if v["id"] == "colaboradores")
    assert colaboradores["orcado"] == 213
    assert colaboradores["variacao_orcado"] == (244 - 213) / 213 * 100
