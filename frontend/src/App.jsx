import { useEffect, useMemo, useState } from "react";
import { indicador, moeda, numero, valorCard, variacao, ytdCard } from "./format.js";

const PAGINAS = [
  ["gestao", "Gestão"],
  ["operacionais", "Operacionais"],
  ["exportacao", "Exportação"],
  ["sac", "SAC"],
  ["alimentacao", "Alimentação"],
];

const VISOES = ["BR", "PY", "BR+PY"];

export default function App() {
  const [pagina, setPagina] = useState("gestao");
  const [visao, setVisao] = useState("BR+PY");
  const [exportVisao, setExportVisao] = useState("BR");
  const [painel, setPainel] = useState(null);
  const [erro, setErro] = useState("");

  async function carregar(v = visao) {
    const res = await fetch(`/api/painel?visao=${encodeURIComponent(v)}`);
    if (!res.ok) {
      setPainel(null);
      setErro("Nenhum fechamento publicado.");
      return;
    }
    setErro("");
    setPainel(await res.json());
  }

  useEffect(() => {
    carregar(visao);
  }, [visao]);

  const visaoAtiva = pagina === "exportacao" ? exportVisao : visao;

  return (
    <div className="app">
      <header className="top">
        <img
          className="logo"
          alt="Minerva Foods"
          src="https://minervafoods.com/wp-content/uploads/2024/08/logo-1920x846.webp"
        />
        <h1>Indicadores de Performance — MBS</h1>
        <nav className="paginas">
          {PAGINAS.map(([id, rotulo]) => (
            <button key={id} className={pagina === id ? "on" : ""} onClick={() => setPagina(id)}>
              {rotulo}
            </button>
          ))}
        </nav>
        {pagina !== "alimentacao" && pagina !== "sac" && (
          <div className="visoes">
            {(pagina === "exportacao" ? ["BR", "PY"] : VISOES).map((v) => (
              <button
                key={v}
                className={visaoAtiva === v ? "on" : ""}
                onClick={() => (pagina === "exportacao" ? setExportVisao(v) : setVisao(v))}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        <div className="meta">
          <span>Período</span>
          <strong>{painel?.periodo_rotulo || "—"}</strong>
        </div>
        <div className="meta">
          <span>Atualização</span>
          <strong>{painel?.atualizacao || "—"}</strong>
        </div>
      </header>

      <main>
        {erro && <p className="aviso">{erro}</p>}
        {painel && pagina === "gestao" && <Gestao painel={painel} />}
        {painel && pagina === "operacionais" && <Operacionais painel={painel} />}
        {painel && pagina === "exportacao" && <Exportacao painel={painel} visao={exportVisao} />}
        {painel && pagina === "sac" && <Sac painel={painel} />}
        {pagina === "alimentacao" && <Alimentacao onPublicado={() => carregar(visao)} />}
      </main>

      <footer className="legenda">
        <i className="dot green" /> Meta atingida
        <i className="dot yellow" /> Atenção
        <i className="dot red" /> Meta não atingida
        <i className="dot gray" /> Sem meta ou sem base
      </footer>
    </div>
  );
}

function Gestao({ painel }) {
  return (
    <div className="gestao">
      <section>
        <h2>Informações de Volumetria</h2>
        <div className="vols">
          {painel.volumetria.map((item) => (
            <Volumetria key={item.id} item={item} />
          ))}
        </div>
      </section>
      <section>
        <h2>Indicadores Estratégicos</h2>
        <div className="estrategicos">
          {painel.estrategicos.map((item) => (
            <Gauge key={item.chave} item={item} />
          ))}
        </div>
      </section>
      <section className="taticos-wrap">
        <h2>Indicadores Táticos</h2>
        <div className="taticos">
          <div className="tat-head">
            <span>Setor</span>
            {painel.taticos.colunas.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          {painel.taticos.linhas.map((linha) => (
            <div className="tat-row" key={linha.setor}>
              <strong>{linha.setor}</strong>
              {linha.indicadores.map((ind) => (
                <Mini key={ind.chave} item={ind} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Volumetria({ item }) {
  if (item.tipo === "yoy") {
    return (
      <article className="vol">
        <h3>{item.label}</h3>
        <p className="big">{numero(item.atual, 0)}</p>
        <p>Ano anterior {numero(item.anterior, 0)}</p>
        <p className={classeVar(item.variacao)}>{variacao(item.variacao)} vs ano anterior</p>
      </article>
    );
  }
  const fmt = item.formato === "moeda" ? moeda : (v) => numero(v, 0);
  return (
    <article className="vol">
      <h3>{item.label}</h3>
      <div className="par">
        <div>
          <span>Mês</span>
          <strong>{fmt(item.mes)}</strong>
          <em className={classeVar(item.var_mes)}>{variacao(item.var_mes)}</em>
        </div>
        <div>
          <span>YTD</span>
          <strong>{fmt(item.ytd)}</strong>
          <em className={classeVar(item.var_ytd)}>{variacao(item.var_ytd)}</em>
        </div>
      </div>
      {item.var_vs_previsto_mes != null && (
        <p className="previsto">
          vs previsto {variacao(item.var_vs_previsto_mes)} no mês · {variacao(item.var_vs_previsto_ytd)} YTD
        </p>
      )}
    </article>
  );
}

function Gauge({ item }) {
  const pct = item.meta ? Math.max(0, Math.min((item.valor || 0) / item.meta, 1.35)) : 0;
  const ang = -180 + pct / 1.35 * 180;
  return (
    <article className={`gauge ${item.status || "gray"}`}>
      <h3>{item.titulo}</h3>
      <svg viewBox="0 0 120 72" aria-hidden="true">
        <path d="M10 64 A 50 50 0 0 1 110 64" className="arco" />
        <path d="M10 64 A 50 50 0 0 1 110 64" className="arco cheio" strokeDasharray={`${pct / 1.35 * 157} 157`} />
        <line x1="60" y1="64" x2="60" y2="22" transform={`rotate(${ang} 60 64)`} className="agulha" />
      </svg>
      <p className="big">{indicador(item.chave, item.valor)}</p>
      <dl>
        <div><dt>Meta</dt><dd>{indicador(item.chave, item.meta)}</dd></div>
        <div><dt>YTD</dt><dd className={item.status_ytd}>{indicador(item.chave, item.ytd)}</dd></div>
      </dl>
    </article>
  );
}

function Mini({ item }) {
  return (
    <div className={`mini ${item.status || "gray"}`}>
      <strong>{indicador(item.chave, item.valor)}</strong>
      <span>meta {indicador(item.chave, item.meta)}</span>
      <span className={item.status_ytd}>YTD {indicador(item.chave, item.ytd)}</span>
    </div>
  );
}

function Operacionais({ painel }) {
  if (!painel.operacionais.length) {
    return <p className="aviso">Nenhum indicador operacional nesta visão.</p>;
  }
  return (
    <div className="ops">
      {painel.operacionais.map((grupo) => (
        <section key={grupo.setor}>
          <h2>{grupo.setor}</h2>
          <div className="cards">
            {grupo.cards.map((card) => (
              <article key={card.nome} className={`op ${card.status || "gray"}`}>
                <h3>{card.nome}</h3>
                <p className="big">{valorCard(card)}</p>
                <p>Meta {card.meta_rotulo || (card.meta == null ? "—" : card.meta)}</p>
                <p>YTD {ytdCard(card)}</p>
                {card.dentro != null && (
                  <p className="miudo">Dentro {numero(card.dentro, 0)} · Fora {numero(card.fora, 0)}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Exportacao({ painel, visao }) {
  const lista = painel.exportacao[visao] || [];
  const grupos = useMemo(() => {
    const map = new Map();
    for (const kpi of lista) {
      const chave = kpi.destino || "Indicadores";
      if (!map.has(chave)) map.set(chave, []);
      map.get(chave).push(kpi);
    }
    return [...map.entries()];
  }, [lista]);
  if (!lista.length) return <p className="aviso">Sem indicadores de exportação para {visao}.</p>;
  return (
    <div className="ops">
      {grupos.map(([destino, kpis]) => (
        <section key={destino}>
          <h2>{destino}</h2>
          <div className="cards">
            {kpis.map((kpi) => (
              <article key={kpi.titulo} className={`op ${kpi.mes_status || "gray"}`}>
                <h3>{kpi.titulo}</h3>
                <p className="big">{numero(kpi.mes, 1)}</p>
                <p>YTD {numero(kpi.ytd, 1)}</p>
                {kpi.fonte && <p className="miudo">{kpi.fonte}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Sac({ painel }) {
  const kpis = painel.sac?.kpis || [];
  if (!kpis.length) return <p className="aviso">SAC sem indicadores neste fechamento.</p>;
  return (
    <section className="ops">
      <h2>Serviço de Atendimento ao Consumidor</h2>
      <div className="cards">
        {kpis.map((kpi) => (
          <article key={kpi.titulo} className={`op ${kpi.mes_status || "gray"}`}>
            <h3>{kpi.titulo}</h3>
            <p className="big">{numero(kpi.mes, 1)}</p>
            <p>YTD {numero(kpi.ytd, 1)}</p>
            {kpi.fonte && <p className="miudo">{kpi.fonte}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function Alimentacao({ onPublicado }) {
  const [periodo, setPeriodo] = useState("2026-09");
  const [msg, setMsg] = useState("");
  const [erroLocal, setErroLocal] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    const arquivos = evento.target.arquivos.files;
    if (!arquivos.length) {
      setErroLocal("Escolha ao menos uma planilha.");
      return;
    }
    const corpo = new FormData();
    corpo.append("periodo", periodo);
    for (const arquivo of arquivos) corpo.append("arquivos", arquivo);
    setErroLocal("");
    setMsg("Lendo planilhas…");
    const res = await fetch("/api/fechamentos/upload", { method: "POST", body: corpo });
    const dados = await res.json();
    if (!res.ok) {
      setMsg("");
      setErroLocal(dados.detail || "Falha no upload.");
      return;
    }
    const linhas = dados.arquivos.map((a) => `${a.arquivo}: ${a.tipo} (${a.bases} bases, ${a.operacionais} operacionais)`);
    setMsg(linhas.join(" · "));
    onPublicado();
  }

  return (
    <section className="alimentacao">
      <h2>Publicar fechamento</h2>
      <p>
        As planilhas padronizadas ficam no SharePoint. Esta tela lê o arquivo agora.
        O RPA, quando existir, envia o mesmo contrato em <code>POST /api/fechamentos</code>.
      </p>
      <form onSubmit={enviar}>
        <label>
          Período
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
        </label>
        <label>
          Planilhas
          <input name="arquivos" type="file" accept=".xlsx" multiple required />
        </label>
        <button type="submit">Publicar</button>
      </form>
      {erroLocal && <p className="aviso">{erroLocal}</p>}
      {msg && <p>{msg}</p>}
      <ul>
        <li>Orçamento oficial: aba Resultados, com orçamento e realizado total por pilar.</li>
        <li>Transações por FTE: abas do ano, com País, Setor, meses, FTE e meta.</li>
        <li>Operacional de logística: abas Brasil e Indicadores LATAM.</li>
        <li>Aba PainelMBS, se quiser entregar o contrato coluna a coluna.</li>
      </ul>
    </section>
  );
}

function classeVar(valor) {
  if (valor == null) return "";
  if (valor < 0) return "neg";
  if (valor > 0) return "pos";
  return "";
}
