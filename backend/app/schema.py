"""Contrato canônico do fechamento mensal.

O upload das planilhas e o RPA entregam este mesmo JSON.
O grão da base tática é mês + escritório + setor. O servidor deriva
mês exibido, YTD (janeiro até o mês do fechamento) e BR+PY.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

Escritorio = Literal["BR", "PY"]
Visao = Literal["BR", "PY", "BR+PY"]
Direction = Literal["higher", "lower"]

SETORES_POR_ESCRITORIO: dict[str, list[str]] = {
    "BR": [
        "Transações Logísticas",
        "Transações Financeiras",
        "Administrativo de Pessoal",
        "Gestão de Serviços e Atendimento",
    ],
    "PY": [
        "Transações Logísticas",
        "Transações Financeiras",
        "Gestão de Serviços e Atendimento",
    ],
}

MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


def periodo_rotulo(periodo: str) -> str:
    ano, mes = periodo.split("-")
    return f"{MESES_PT[int(mes) - 1]}/{ano}"


class BaseMensal(BaseModel):
    escritorio: Escritorio
    setor: str
    ano: int
    mes: int = Field(ge=1, le=12)
    orcamento: Optional[float] = None
    realizado: Optional[float] = None
    transacoes: Optional[float] = None
    fte: Optional[float] = None
    atendidas: Optional[float] = None
    total_chamadas: Optional[float] = None

    @field_validator("setor")
    @classmethod
    def setor_limpo(cls, v: str) -> str:
        return v.strip()


class MetaIndicador(BaseModel):
    """Meta informada. Custo por transação não usa este bloco: a meta dele é orçamento / transações."""

    escopo: Literal["setor", "escritorio", "consolidado", "consolidado_setor"]
    escritorio: Optional[Escritorio] = None
    setor: Optional[str] = None
    transacoes_por_fte: Optional[float] = None
    nivel_servico: Optional[float] = None


class Colaboradores(BaseModel):
    escritorio: Escritorio
    ano: int
    quantidade: float


class HeadcountOrcado(BaseModel):
    """Headcount orçado do mês, somado entre os pilares do escritório."""

    escritorio: Escritorio
    ano: int
    mes: int = Field(ge=1, le=12)
    quantidade: float


class HistoricoVolumetria(BaseModel):
    """Ano anterior quando a série mensal daquele ano não foi carregada."""

    escritorio: Escritorio
    ano: int
    transacoes_mes: Optional[float] = None
    transacoes_ytd: Optional[float] = None
    realizado_mes: Optional[float] = None
    realizado_ytd: Optional[float] = None
    previsto_mes: Optional[float] = None
    previsto_ytd: Optional[float] = None


class OperacionalMes(BaseModel):
    ano: int
    mes: int = Field(ge=1, le=12)
    dentro: Optional[float] = None
    fora: Optional[float] = None
    volume: Optional[float] = None
    tempo: Optional[float] = None
    resultado: Optional[float] = None


class OperacionalCard(BaseModel):
    setor: str
    escritorio: Escritorio
    nome: str
    unidade: Literal["percentual", "hhmm", "dias", "numero"] = "percentual"
    direction: Direction = "higher"
    meta: Optional[float] = None
    meta_rotulo: Optional[str] = None
    serie: list[OperacionalMes] = Field(default_factory=list)
    # Preenchido só na importação do painel legado, que não tem a série mensal.
    mes_resultado: Optional[float] = None
    mes_tempo: Optional[float] = None
    mes_dentro: Optional[float] = None
    mes_fora: Optional[float] = None
    mes_volume: Optional[float] = None
    ytd_resultado: Optional[float] = None
    ytd_tempo: Optional[float] = None
    ytd_volume: Optional[float] = None


class KpiCard(BaseModel):
    titulo: str
    fonte: str = ""
    escritorio: Escritorio
    destino: str = ""
    mes: Optional[float] = None
    ytd: Optional[float] = None
    meta: Optional[float] = None
    unidade: str = "numero"
    mes_status: str = ""
    ytd_status: str = ""


class SacBloco(BaseModel):
    kpis: list[KpiCard] = Field(default_factory=list)
    nota: str = ""


class Fechamento(BaseModel):
    periodo: str = Field(description="Mês de fechamento AAAA-MM", pattern=r"^\d{4}-\d{2}$")
    atualizacao: str = ""
    bases: list[BaseMensal] = Field(default_factory=list)
    metas: list[MetaIndicador] = Field(default_factory=list)
    colaboradores: list[Colaboradores] = Field(default_factory=list)
    headcount_orcado: list[HeadcountOrcado] = Field(default_factory=list)
    historico: list[HistoricoVolumetria] = Field(default_factory=list)
    operacionais: list[OperacionalCard] = Field(default_factory=list)
    exportacao: list[KpiCard] = Field(default_factory=list)
    sac: SacBloco = Field(default_factory=SacBloco)

    @field_validator("periodo")
    @classmethod
    def mes_valido(cls, v: str) -> str:
        mes = int(v.split("-")[1])
        if not 1 <= mes <= 12:
            raise ValueError("mês do período fora de 1..12")
        return v


EXEMPLO_CONTRATO = {
    "periodo": "2026-09",
    "atualizacao": "30/09/2026 18:03",
    "bases": [
        {
            "escritorio": "BR",
            "setor": "Transações Logísticas",
            "ano": 2026,
            "mes": 9,
            "orcamento": 1048565,
            "realizado": 815685,
            "transacoes": 70036,
            "fte": 99,
            "atendidas": None,
            "total_chamadas": None,
        }
    ],
    "metas": [
        {
            "escopo": "escritorio",
            "escritorio": "BR",
            "setor": None,
            "transacoes_por_fte": 2074,
            "nivel_servico": None,
        }
    ],
    "colaboradores": [{"escritorio": "BR", "ano": 2026, "quantidade": 244}],
    "historico": [],
    "operacionais": [],
    "exportacao": [],
    "sac": {"kpis": [], "nota": ""},
}
