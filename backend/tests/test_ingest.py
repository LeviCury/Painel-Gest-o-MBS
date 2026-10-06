from pathlib import Path

import pytest

from app.ingest import ler_planilha

DOWNLOADS = Path.home() / "Downloads"


def _ler(nome):
    caminho = DOWNLOADS / nome
    if not caminho.exists():
        pytest.skip(f"sem {nome}")
    return ler_planilha(caminho.read_bytes(), nome)


def test_transacoes_por_fte():
    leitura = _ler("Transações por FTE.xlsx")
    assert leitura.tipo == "transacoes_fte"
    jan = next(
        b for b in leitura.bases
        if b.escritorio == "BR" and b.setor == "Administrativo de Pessoal" and b.ano == 2026 and b.mes == 1
    )
    assert jan.transacoes == 68338
    assert jan.fte == 33
    assert all(b.setor != "Escritório MBS" for b in leitura.bases)
    meta = next(
        m for m in leitura.metas_mensais
        if m["escritorio"] == "BR" and m["setor"] == "Administrativo de Pessoal" and m["ano"] == 2026 and m["mes"] == 1
    )
    assert meta["transacoes_por_fte"] == pytest.approx(2332.64, abs=0.01)


def test_orcamento_br_agosto():
    leitura = _ler("Orçamento oficial BR.xlsx")
    assert leitura.tipo == "orcamento"
    log = next(
        b for b in leitura.bases
        if b.setor == "Transações Logísticas" and b.mes == 8 and b.realizado
    )
    assert log.realizado == pytest.approx(815165.62, abs=1)
    setores = {b.setor for b in leitura.bases}
    assert "Administrativo de Pessoal" in setores
    assert all("Infra" not in s for s in setores)
    agosto = next(h for h in leitura.headcount if h.escritorio == "BR" and h.ano == 2026 and h.mes == 8)
    assert agosto.quantidade == 213
    assert all(h.mes != 9 for h in leitura.headcount)


def test_operacional_logistica_agosto():
    leitura = _ler("4. Indicador Operacional Transações Logisticas.xlsx")
    assert leitura.tipo == "operacional_logistica"
    card = next(
        c for c in leitura.operacionais
        if c.escritorio == "BR" and "Fechamento OC" in c.nome and any(p.ano == 2026 for p in c.serie)
    )
    agosto = next(p for p in card.serie if p.ano == 2026 and p.mes == 8)
    assert agosto.dentro == 3512
    assert agosto.fora == 557
    py = [c for c in leitura.operacionais if c.escritorio == "PY"]
    assert py
    assert any("Frete MI" in c.nome or "Flete" in c.nome or "lanzamiento" in c.nome.lower() for c in py)


def test_arquivo_fora_do_padrao():
    from openpyxl import Workbook
    from io import BytesIO
    wb = Workbook()
    wb.active.title = "Qualquer"
    wb.active["A1"] = "oi"
    buf = BytesIO()
    wb.save(buf)
    with pytest.raises(ValueError, match="fora do padrão"):
        ler_planilha(buf.getvalue(), "solto.xlsx")
