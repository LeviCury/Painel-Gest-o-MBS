from fastapi.testclient import TestClient

from app.main import app


def test_publica_json_e_le_painel(tmp_path, monkeypatch):
    monkeypatch.setattr("app.db.DB_PATH", tmp_path / "painel.db")
    client = TestClient(app)
    payload = {
        "periodo": "2026-03",
        "atualizacao": "01/04/2026 10:00",
        "bases": [
            {
                "escritorio": "BR",
                "setor": "Transações Logísticas",
                "ano": 2026,
                "mes": 3,
                "orcamento": 200,
                "realizado": 100,
                "transacoes": 50,
                "fte": 5,
            }
        ],
        "metas": [
            {"escopo": "escritorio", "escritorio": "BR", "transacoes_por_fte": 8}
        ],
        "colaboradores": [{"escritorio": "BR", "ano": 2026, "quantidade": 10}],
    }
    r = client.post("/api/fechamentos", json=payload)
    assert r.status_code == 200
    painel = client.get("/api/painel", params={"periodo": "2026-03", "visao": "BR"})
    assert painel.status_code == 200
    corpo = painel.json()
    custo = next(i for i in corpo["estrategicos"] if i["chave"] == "custo_por_transacao")
    assert custo["valor"] == 2
    assert custo["meta"] == 4
    prod = next(i for i in corpo["estrategicos"] if i["chave"] == "transacoes_por_fte")
    assert prod["valor"] == 10
    assert prod["meta"] == 8
