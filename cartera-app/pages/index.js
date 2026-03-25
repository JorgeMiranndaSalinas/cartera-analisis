import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

/* ─── Default portfolio ──────────────────────────────────────────────── */
const DEFAULT_STOCKS = [
  { ticker: "TSLA",  name: "Tesla Inc",             market: "NASDAQ" },
  { ticker: "TRE",   name: "Técnicas Reunidas SA",  market: "BME"    },
  { ticker: "TUB",   name: "Tubacex SA",            market: "BME"    },
  { ticker: "KKR",   name: "KKR & Co Inc",          market: "NYSE"   },
  { ticker: "FER",   name: "Ferrovial SE",          market: "BME"    },
  { ticker: "MSFT",  name: "Microsoft Corp",        market: "NASDAQ" },
  { ticker: "META",  name: "Meta Platforms Inc",    market: "NASDAQ" },
  { ticker: "ANE",   name: "Acciona Energía",       market: "BME"    },
  { ticker: "AMZN",  name: "Amazon.com Inc",        market: "NASDAQ" },
  { ticker: "HOOD",  name: "Robinhood Markets Inc", market: "NASDAQ" },
];

const MARKETS = ["NASDAQ", "NYSE", "BME", "ETR", "LSE", "EURONEXT", "OTRO"];
const ST = { idle: "idle", loading: "loading", done: "done", error: "error" };

/* ─── Helpers ────────────────────────────────────────────────────────── */
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(initial);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setVal(JSON.parse(s)); } catch {}
  }, [key]);
  const save = useCallback((v) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [val, save];
}

function parseMD(text) {
  if (!text) return null;
  const elements = [];
  const lines = text.split("\n");
  let key = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t) { elements.push(<div key={key++} style={{ height: ".45rem" }} />); continue; }
    if (t.startsWith("## ") || t.startsWith("### ")) {
      elements.push(<SectionHead key={key++}>{t.replace(/^##+ /, "")}</SectionHead>);
    } else {
      elements.push(<Paragraph key={key++}>{t}</Paragraph>);
    }
  }
  return elements;
}

function SectionHead({ children }) {
  return (
    <div style={{
      fontFamily: "var(--serif)", fontSize: ".82rem", fontWeight: 700,
      color: "var(--amber)", marginTop: "1.1rem", marginBottom: ".3rem",
      paddingBottom: ".25rem", borderBottom: "1px solid rgba(245,166,35,.2)"
    }}>{children}</div>
  );
}

function Paragraph({ children }) {
  if (!children) return null;
  const parts = String(children).split(/(\*\*[^*]+\*\*|COMPRAR|MANTENER|VENDER)/g);
  return (
    <div style={{ fontSize: ".7rem", color: "var(--text-mid)", lineHeight: 1.9, marginBottom: ".1rem" }}>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ color: "var(--text)", fontWeight: 700 }}>{p.replace(/\*\*/g, "")}</strong>;
        if (p === "COMPRAR") return <Signal key={i} type="buy">{p}</Signal>;
        if (p === "VENDER")  return <Signal key={i} type="sell">{p}</Signal>;
        if (p === "MANTENER") return <Signal key={i} type="hold">{p}</Signal>;
        return p;
      })}
    </div>
  );
}

function Signal({ type, children }) {
  const styles = {
    buy:  { bg: "rgba(74,222,128,.15)",   color: "var(--green)", border: "rgba(74,222,128,.35)"  },
    sell: { bg: "rgba(248,113,113,.15)",  color: "var(--red)",   border: "rgba(248,113,113,.35)" },
    hold: { bg: "rgba(245,166,35,.15)",   color: "var(--amber)", border: "rgba(245,166,35,.35)"  },
  }[type];
  return (
    <span style={{
      display: "inline-block", padding: ".1rem .5rem", fontSize: ".6rem",
      fontWeight: 700, letterSpacing: ".1em", borderRadius: "2px",
      margin: "0 .2rem", background: styles.bg, color: styles.color,
      border: `1px solid ${styles.border}`
    }}>{children}</span>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */
function Dot({ status }) {
  const color = status === ST.done ? "var(--green)" : status === ST.loading ? "var(--amber)" : status === ST.error ? "var(--red)" : "var(--border)";
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
      background: color,
      boxShadow: (status === ST.done || status === ST.loading) ? `0 0 6px ${color}` : "none",
      animation: status === ST.loading ? "glow 1s infinite" : "none",
    }} />
  );
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, border: "2px solid var(--border)",
      borderTopColor: "var(--amber)", borderRadius: "50%",
      animation: "spin .8s linear infinite", flexShrink: 0
    }} />
  );
}

function BtnPrimary({ onClick, disabled, children, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "var(--amber-dim)" : "var(--amber)",
      color: disabled ? "#555" : "#000", border: "none",
      padding: ".65rem 1.4rem", fontSize: ".68rem", fontWeight: 700,
      letterSpacing: ".1em", textTransform: "uppercase",
      transition: "all .2s", cursor: disabled ? "not-allowed" : "pointer",
      ...style
    }}>{children}</button>
  );
}

function BtnSecondary({ onClick, disabled, children, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: "transparent", color: "var(--text-dim)",
      border: "1px solid var(--border)", padding: ".65rem 1.1rem",
      fontSize: ".65rem", letterSpacing: ".08em", transition: "all .2s",
      cursor: disabled ? "not-allowed" : "pointer", ...style
    }}>{children}</button>
  );
}

/* ─── Stock card ─────────────────────────────────────────────────────── */
function StockCard({ stock, result = {}, onAnalyze, onRemove }) {
  const { status = ST.idle, text, error } = result;
  return (
    <div id={`card-${stock.ticker}`} style={{
      background: "var(--surface)", border: "1px solid var(--border2)",
      borderRadius: "3px", overflow: "hidden", marginBottom: "1rem",
      animation: "fadeUp .35s ease forwards"
    }}>
      {/* Card header */}
      <div style={{
        padding: ".8rem 1.2rem", background: "var(--surface2)",
        borderBottom: "1px solid var(--border2)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
          <Dot status={status} />
          <div>
            <span style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--amber)", letterSpacing: ".06em" }}>
              {stock.ticker}
            </span>
            <span style={{ fontSize: ".62rem", color: "var(--text-dim)", marginLeft: ".7rem" }}>
              {stock.name}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <span style={{
            fontSize: ".57rem", padding: ".18rem .45rem",
            border: "1px solid var(--border)", color: "var(--text-dim)", letterSpacing: ".1em"
          }}>{stock.market}</span>
          {status === ST.idle || status === ST.error ? (
            <BtnSecondary onClick={() => onAnalyze(stock)} style={{ padding: ".3rem .7rem", fontSize: ".6rem" }}>
              Analizar
            </BtnSecondary>
          ) : null}
          <button onClick={() => onRemove(stock.ticker)} title="Eliminar" style={{
            background: "none", border: "none", color: "var(--text-dim)",
            fontSize: ".9rem", padding: ".2rem .4rem", lineHeight: 1, cursor: "pointer"
          }}>×</button>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "1.1rem 1.2rem" }}>
        {status === ST.idle && (
          <span style={{ fontSize: ".68rem", color: "var(--text-dim)" }}>
            Pulsa "Analizar" o usa el botón global para obtener el análisis.
          </span>
        )}
        {status === ST.loading && (
          <div style={{ display: "flex", alignItems: "center", gap: ".7rem", color: "var(--text-dim)", fontSize: ".68rem" }}>
            <Spinner /> Buscando datos en tiempo real...
          </div>
        )}
        {status === ST.error && (
          <span style={{ fontSize: ".68rem", color: "var(--red)" }}>⚠ {error}</span>
        )}
        {status === ST.done && <div>{parseMD(text)}</div>}
      </div>
    </div>
  );
}

/* ─── Add stock modal ────────────────────────────────────────────────── */
function AddModal({ onAdd, onClose }) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [market, setMarket] = useState("NASDAQ");
  const [err, setErr] = useState("");

  function handleAdd() {
    if (!ticker.trim()) { setErr("El ticker es obligatorio"); return; }
    onAdd({ ticker: ticker.trim().toUpperCase(), name: name.trim() || ticker.trim().toUpperCase(), market });
    onClose();
  }

  const fieldStyle = {
    background: "var(--surface2)", border: "1px solid var(--border)",
    color: "var(--text)", padding: ".6rem .8rem", fontSize: ".72rem",
    width: "100%", outline: "none"
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        padding: "1.8rem", width: "min(420px, 90vw)"
      }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: "1rem", fontWeight: 600, marginBottom: "1.2rem", color: "var(--amber)" }}>
          + Añadir valor a la cartera
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
          <div>
            <label style={{ fontSize: ".6rem", color: "var(--text-dim)", letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: ".35rem" }}>
              Ticker *
            </label>
            <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="ej: AAPL, SAN, NVDA" style={fieldStyle}
              onKeyDown={e => e.key === "Enter" && handleAdd()} />
          </div>
          <div>
            <label style={{ fontSize: ".6rem", color: "var(--text-dim)", letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: ".35rem" }}>
              Nombre completo
            </label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ej: Apple Inc" style={fieldStyle} />
          </div>
          <div>
            <label style={{ fontSize: ".6rem", color: "var(--text-dim)", letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: ".35rem" }}>
              Mercado
            </label>
            <select value={market} onChange={e => setMarket(e.target.value)} style={{ ...fieldStyle, appearance: "none" }}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {err && <div style={{ fontSize: ".65rem", color: "var(--red)" }}>{err}</div>}
          <div style={{ display: "flex", gap: ".6rem", marginTop: ".3rem" }}>
            <BtnPrimary onClick={handleAdd} style={{ flex: 1 }}>Añadir</BtnPrimary>
            <BtnSecondary onClick={onClose} style={{ flex: 1 }}>Cancelar</BtnSecondary>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function Home() {
  const [stocks, setStocks]   = useLocalStorage("cartera_stocks", DEFAULT_STOCKS);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [time, setTime]   = useState("");
  const [today, setToday] = useState("");
  const [theme, setTheme] = useLocalStorage("cartera_theme", "dark");
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | settings

  /* Clock */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const opts = { timeZone: "Europe/Madrid" };
      setTime(now.toLocaleTimeString("es-ES", { ...opts, hour12: false }));
      setToday(now.toLocaleDateString("es-ES", { ...opts, weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Analyze one stock */
  const analyzeOne = useCallback(async (stock) => {
    setResults(prev => ({ ...prev, [stock.ticker]: { status: ST.loading } }));
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stock),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setResults(prev => ({ ...prev, [stock.ticker]: { status: ST.done, text: data.text } }));
    } catch (e) {
      setResults(prev => ({ ...prev, [stock.ticker]: { status: ST.error, error: e.message } }));
    }
  }, []);

  /* Analyze all */
  async function analyzeAll() {
    setRunning(true);
    for (let i = 0; i < stocks.length; i++) {
      setStatusMsg(`Analizando ${stocks[i].ticker} (${i + 1}/${stocks.length})…`);
      await analyzeOne(stocks[i]);
      if (i < stocks.length - 1) await new Promise(r => setTimeout(r, 700));
    }
    const t = new Date().toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid" });
    setStatusMsg(`✓ Análisis completado · ${t} hora Madrid`);
    setRunning(false);
  }

  function addStock(s) {
    if (stocks.find(x => x.ticker === s.ticker)) return;
    setStocks([...stocks, s]);
  }

  function removeStock(ticker) {
    setStocks(stocks.filter(s => s.ticker !== ticker));
    setResults(prev => { const n = { ...prev }; delete n[ticker]; return n; });
  }

  function clearResults() {
    setResults({});
    setStatusMsg("");
  }

  const doneCount = Object.values(results).filter(r => r.status === ST.done).length;

  /* Scrolls sidebar item into view */
  function scrollTo(ticker) {
    document.getElementById(`card-${ticker}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <Head>
        <title>Cartera · Análisis Diario</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📈</text></svg>" />
      </Head>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>

        {/* ── Top bar ── */}
        <header style={{
          padding: "0 2rem", borderBottom: "1px solid var(--border)",
          background: "linear-gradient(180deg,rgba(124,106,245,.07) 0%,transparent 100%)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 64, flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div>
              <span style={{ fontFamily: "var(--serif)", fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-.01em" }}>
                CARTERA <span style={{ color: "var(--amber)" }}>·</span> ANÁLISIS
              </span>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--border)" }} />
            {["dashboard", "settings"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: "none", border: "none", padding: ".3rem .1rem",
                fontSize: ".62rem", letterSpacing: ".1em", textTransform: "uppercase",
                color: activeTab === tab ? "var(--amber)" : "var(--text-dim)",
                borderBottom: activeTab === tab ? "1px solid var(--amber)" : "1px solid transparent",
                cursor: "pointer", fontFamily: "var(--mono)"
              }}>{tab === "dashboard" ? "Dashboard" : "⚙ Ajustes"}</button>
            ))}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1rem", color: "var(--amber)", fontWeight: 700 }}>{time}</div>
            <div style={{ fontSize: ".55rem", color: "var(--text-dim)", textTransform: "capitalize", letterSpacing: ".05em" }}>{today}</div>
          </div>
        </header>

        {/* ── Main layout ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Sidebar ── */}
          <aside style={{
            width: 230, flexShrink: 0, borderRight: "1px solid var(--border)",
            background: "var(--surface)", display: "flex", flexDirection: "column", overflowY: "auto"
          }}>
            <div style={{
              padding: ".7rem 1rem", display: "flex", alignItems: "center",
              justifyContent: "space-between", borderBottom: "1px solid var(--border)"
            }}>
              <span style={{ fontSize: ".55rem", letterSpacing: ".13em", textTransform: "uppercase", color: "var(--text-dim)" }}>
                Cartera · {stocks.length} valores
              </span>
              <button onClick={() => setShowModal(true)} title="Añadir valor" style={{
                background: "none", border: "1px solid var(--border)", color: "var(--amber)",
                width: 22, height: 22, fontSize: ".85rem", lineHeight: "20px",
                textAlign: "center", cursor: "pointer"
              }}>+</button>
            </div>

            {stocks.map(s => {
              const r = results[s.ticker];
              const st = r?.status || ST.idle;
              return (
                <div key={s.ticker} onClick={() => scrollTo(s.ticker)} style={{
                  padding: ".55rem 1rem", cursor: "pointer",
                  borderBottom: "1px solid rgba(37,37,53,.6)",
                  display: "flex", alignItems: "center", gap: ".55rem",
                  transition: "background .15s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Dot status={st} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text)" }}>{s.ticker}</div>
                    <div style={{ fontSize: ".55rem", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  </div>
                  <span style={{ fontSize: ".5rem", color: "var(--text-dim)" }}>{s.market}</span>
                </div>
              );
            })}

            <div style={{ marginTop: "auto", padding: "1rem", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: ".55rem", color: "var(--text-dim)", lineHeight: 1.7 }}>
                {doneCount}/{stocks.length} analizados
                {doneCount > 0 && <><br /><span style={{ color: "var(--text-dim)" }}>↑ click para ir a la acción</span></>}
              </div>
            </div>
          </aside>

          {/* ── Content ── */}
          <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

            {/* Controls bar */}
            <div style={{
              padding: ".9rem 1.8rem", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: ".7rem", flexWrap: "wrap", flexShrink: 0
            }}>
              <BtnPrimary onClick={analyzeAll} disabled={running || stocks.length === 0}>
                {running ? "⟳ Analizando..." : "▶ Análisis completo"}
              </BtnPrimary>
              <BtnSecondary onClick={clearResults} disabled={running}>
                ↺ Limpiar
              </BtnSecondary>
              <BtnSecondary onClick={() => setShowModal(true)} disabled={running}>
                + Añadir valor
              </BtnSecondary>
              <span style={{ flex: 1, fontSize: ".62rem", color: "var(--text-dim)" }}>
                {statusMsg || `${stocks.length} valores en cartera · haz clic en "Análisis completo" para empezar`}
              </span>
            </div>

            {/* Dashboard tab */}
            {activeTab === "dashboard" && (
              <div style={{ padding: "1.5rem 1.8rem", flex: 1 }}>
                {stocks.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: "6rem", color: "var(--text-dim)", fontSize: ".75rem" }}>
                    No hay valores en la cartera.<br />
                    <button onClick={() => setShowModal(true)} style={{
                      marginTop: "1rem", background: "none", border: "1px solid var(--border)",
                      color: "var(--amber)", padding: ".6rem 1.2rem", fontSize: ".68rem",
                      cursor: "pointer", fontFamily: "var(--mono)"
                    }}>+ Añadir primer valor</button>
                  </div>
                ) : (
                  stocks.map(s => (
                    <StockCard
                      key={s.ticker}
                      stock={s}
                      result={results[s.ticker]}
                      onAnalyze={analyzeOne}
                      onRemove={removeStock}
                    />
                  ))
                )}
              </div>
            )}

            {/* Settings tab */}
            {activeTab === "settings" && (
              <div style={{ padding: "2rem 1.8rem", maxWidth: 560 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: "1.1rem", fontWeight: 600, color: "var(--amber)", marginBottom: "1.5rem" }}>
                  ⚙ Configuración
                </div>

                <Section title="Gestión de cartera">
                  <p style={{ fontSize: ".7rem", color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "1rem" }}>
                    Los valores de tu cartera se guardan automáticamente en el navegador.
                    Puedes añadir o eliminar valores desde el panel principal o desde aquí.
                  </p>
                  <div style={{ display: "flex", gap: ".6rem" }}>
                    <BtnSecondary onClick={() => setShowModal(true)}>+ Añadir valor</BtnSecondary>
                    <BtnSecondary onClick={() => { if (confirm("¿Restaurar la cartera por defecto?")) { setStocks(DEFAULT_STOCKS); setResults({}); } }}>
                      ↺ Restaurar cartera original
                    </BtnSecondary>
                  </div>
                </Section>

                <Section title="Sobre esta app">
                  <div style={{ fontSize: ".68rem", color: "var(--text-dim)", lineHeight: 1.9 }}>
                    <p>Esta aplicación usa la API de <strong style={{ color: "var(--text)" }}>Claude AI</strong> con búsqueda web en tiempo real para analizar cada valor de tu cartera.</p>
                    <br />
                    <p>Los análisis son informativos y <strong style={{ color: "var(--red)" }}>no constituyen asesoramiento financiero</strong>. Consulta siempre con un profesional antes de tomar decisiones de inversión.</p>
                    <br />
                    <p style={{ color: "var(--text-dim)", fontSize: ".63rem" }}>
                      Powered by Anthropic Claude · Next.js · Vercel
                    </p>
                  </div>
                </Section>
              </div>
            )}
          </main>
        </div>
      </div>

      {showModal && <AddModal onAdd={addStock} onClose={() => setShowModal(false)} />}
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{
        fontSize: ".6rem", letterSpacing: ".13em", textTransform: "uppercase",
        color: "var(--text-dim)", marginBottom: ".8rem",
        paddingBottom: ".4rem", borderBottom: "1px solid var(--border)"
      }}>{title}</div>
      {children}
    </div>
  );
}
