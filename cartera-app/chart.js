import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

/* ── Constants ─────────────────────────────────────────────────────── */
const DEFAULT_STOCKS = [
  { ticker: "TSLA",  name: "Tesla Inc",             market: "NASDAQ", yahooTicker: "TSLA"   },
  { ticker: "TRE",   name: "Técnicas Reunidas SA",  market: "BME",    yahooTicker: "TRE.MC" },
  { ticker: "TUB",   name: "Tubacex SA",            market: "BME",    yahooTicker: "TUB.MC" },
  { ticker: "KKR",   name: "KKR & Co Inc",          market: "NYSE",   yahooTicker: "KKR"    },
  { ticker: "FER",   name: "Ferrovial SE",          market: "BME",    yahooTicker: "FER.MC" },
  { ticker: "MSFT",  name: "Microsoft Corp",        market: "NASDAQ", yahooTicker: "MSFT"   },
  { ticker: "META",  name: "Meta Platforms Inc",    market: "NASDAQ", yahooTicker: "META"   },
  { ticker: "ANE",   name: "Acciona Energía",       market: "BME",    yahooTicker: "ANE.MC" },
  { ticker: "AMZN",  name: "Amazon.com Inc",        market: "NASDAQ", yahooTicker: "AMZN"   },
  { ticker: "HOOD",  name: "Robinhood Markets Inc", market: "NASDAQ", yahooTicker: "HOOD"   },
];
const MARKETS = ["NASDAQ", "NYSE", "BME", "ETR", "LSE", "EURONEXT", "OTRO"];
const ST = { idle: "idle", loading: "loading", done: "done", error: "error" };
const TABS = ["dashboard", "historial", "ajustes"];

/* ── LocalStorage hook ──────────────────────────────────────────────── */
function useLS(key, init) {
  const [val, setVal] = useState(init);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setVal(JSON.parse(s)); } catch {}
  }, [key]);
  const save = useCallback((v) => {
    const next = typeof v === "function" ? v(val) : v;
    setVal(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key, val]);
  return [val, save];
}

/* ── Markdown renderer ──────────────────────────────────────────────── */
function MD({ text, forPrint = false }) {
  if (!text) return null;
  return (
    <div>
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: ".4rem" }} />;
        if (t.startsWith("## ") || t.startsWith("### ")) {
          const label = t.replace(/^##+ /, "");
          return forPrint
            ? <div key={i} className="print-section-head">{label}</div>
            : <div key={i} style={{
                fontFamily: "var(--serif)", fontSize: ".8rem", fontWeight: 700,
                color: "var(--amber)", marginTop: "1rem", marginBottom: ".3rem",
                paddingBottom: ".2rem", borderBottom: "1px solid rgba(245,166,35,.2)"
              }}>{label}</div>;
        }
        const parts = t.split(/(\*\*[^*]+\*\*|COMPRAR|MANTENER|VENDER)/g);
        return (
          <div key={i} style={{ fontSize: ".7rem", color: forPrint ? "#333" : "var(--text-mid)", lineHeight: 1.9, marginBottom: ".1rem" }}>
            {parts.map((p, j) => {
              if (p.startsWith("**") && p.endsWith("**"))
                return <strong key={j} style={{ color: forPrint ? "#000" : "var(--text)" }}>{p.replace(/\*\*/g, "")}</strong>;
              if (p === "COMPRAR") return <Chip key={j} type="buy">{p}</Chip>;
              if (p === "VENDER")  return <Chip key={j} type="sell">{p}</Chip>;
              if (p === "MANTENER") return <Chip key={j} type="hold">{p}</Chip>;
              return p;
            })}
          </div>
        );
      })}
    </div>
  );
}

function Chip({ type, children }) {
  const c = { buy: ["rgba(74,222,128,.15)", "var(--green)", "rgba(74,222,128,.35)"], sell: ["rgba(248,113,113,.15)", "var(--red)", "rgba(248,113,113,.35)"], hold: ["rgba(245,166,35,.15)", "var(--amber)", "rgba(245,166,35,.35)"] }[type];
  return <span style={{ display:"inline-block", padding:".1rem .45rem", fontSize:".58rem", fontWeight:700, letterSpacing:".1em", borderRadius:"2px", margin:"0 .2rem", background:c[0], color:c[1], border:`1px solid ${c[2]}` }}>{children}</span>;
}

/* ── Sparkline chart ────────────────────────────────────────────────── */
function Sparkline({ points, changePercent }) {
  if (!points || points.length < 2) return null;
  const prices = points.map(p => p.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const W = 300, H = 60, PAD = 6;
  const x = (i) => PAD + (i / (prices.length - 1)) * (W - PAD * 2);
  const y = (p) => H - PAD - ((p - min) / range) * (H - PAD * 2);
  const d = prices.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p)}`).join(" ");
  const isUp = parseFloat(changePercent) >= 0;
  const color = isUp ? "#4ade80" : "#f87171";
  const first = { x: x(0), y: y(prices[0]) };
  const last  = { x: x(prices.length - 1), y: y(prices[prices.length - 1]) };

  return (
    <div style={{ marginTop: ".8rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".3rem" }}>
        <span style={{ fontSize: ".58rem", color: "var(--text-dim)", letterSpacing: ".08em" }}>PRECIO 3 MESES</span>
        {changePercent && (
          <span style={{ fontSize: ".7rem", fontWeight: 700, color }}>
            {isUp ? "▲" : "▼"} {Math.abs(changePercent)}%
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 60, display: "block" }}>
        <defs>
          <linearGradient id={`g-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L ${last.x} ${H} L ${first.x} ${H} Z`} fill={`url(#g-${color.replace("#","")})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="3" fill={color} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".55rem", color: "var(--text-dim)", marginTop: ".2rem" }}>
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

/* ── Buttons ────────────────────────────────────────────────────────── */
function BtnPrimary({ onClick, disabled, children, style = {} }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? "var(--amber-dim)" : "var(--amber)", color: disabled ? "#555" : "#000", border: "none", padding: ".6rem 1.3rem", fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s", ...style }}>{children}</button>;
}
function BtnSec({ onClick, disabled, children, style = {} }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: "transparent", color: "var(--text-dim)", border: "1px solid var(--border)", padding: ".6rem 1rem", fontSize: ".63rem", letterSpacing: ".08em", cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s", ...style }}>{children}</button>;
}

/* ── Dot ────────────────────────────────────────────────────────────── */
function Dot({ status }) {
  const color = status === ST.done ? "var(--green)" : status === ST.loading ? "var(--amber)" : status === ST.error ? "var(--red)" : "var(--border)";
  return <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: color, boxShadow: [ST.done, ST.loading].includes(status) ? `0 0 5px ${color}` : "none", animation: status === ST.loading ? "glow 1s infinite" : "none" }} />;
}

/* ── Stock card ─────────────────────────────────────────────────────── */
function StockCard({ stock, result = {}, chartData, onAnalyze, onRemove }) {
  const { status = ST.idle, text, error } = result;
  const [open, setOpen] = useState(true);

  return (
    <div id={`card-${stock.ticker}`} className="print-card" style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "3px", marginBottom: "1rem", overflow: "hidden", animation: "fadeUp .3s ease forwards" }}>
      {/* Header */}
      <div style={{ padding: ".75rem 1.1rem", background: "var(--surface2)", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".8rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".7rem", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
          <Dot status={status} />
          <div>
            <span style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--amber)", letterSpacing: ".05em" }}>{stock.ticker}</span>
            <span style={{ fontSize: ".6rem", color: "var(--text-dim)", marginLeft: ".6rem" }}>{stock.name}</span>
          </div>
          {chartData?.currentPrice && (
            <span style={{ fontSize: ".75rem", color: "var(--text)", fontWeight: 700 }}>
              {chartData.currentPrice.toFixed(2)} {chartData.currency}
            </span>
          )}
        </div>
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
          <span style={{ fontSize: ".55rem", padding: ".15rem .4rem", border: "1px solid var(--border)", color: "var(--text-dim)", letterSpacing: ".1em" }}>{stock.market}</span>
          {(status === ST.idle || status === ST.error || status === ST.done) && (
            <BtnSec onClick={() => onAnalyze(stock)} style={{ padding: ".28rem .65rem", fontSize: ".58rem" }}>
              {status === ST.done ? "↺" : "▶"}
            </BtnSec>
          )}
          {status === ST.done && (
            <BtnSec onClick={() => downloadPDF(stock, text)} style={{ padding: ".28rem .65rem", fontSize: ".58rem" }} title="Descargar PDF">⬇ PDF</BtnSec>
          )}
          <button onClick={() => onRemove(stock.ticker)} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: ".85rem", padding: ".2rem .35rem", cursor: "pointer" }}>×</button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: "1rem 1.1rem" }}>
          {status === ST.idle && <span style={{ fontSize: ".65rem", color: "var(--text-dim)" }}>Sin analizar — pulsa ▶ para obtener el análisis.</span>}
          {status === ST.loading && (
            <div style={{ display: "flex", alignItems: "center", gap: ".7rem", color: "var(--text-dim)", fontSize: ".65rem" }}>
              <div style={{ width: 13, height: 13, border: "2px solid var(--border)", borderTopColor: "var(--amber)", borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
              Buscando datos en tiempo real…
            </div>
          )}
          {status === ST.error && <span style={{ fontSize: ".65rem", color: "var(--red)" }}>⚠ {error}</span>}
          {status === ST.done && (
            <>
              {chartData?.points && <Sparkline points={chartData.points} changePercent={chartData.changePercent} />}
              <div style={{ marginTop: ".8rem" }}><MD text={text} /></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PDF download ───────────────────────────────────────────────────── */
async function downloadPDF(stock, text) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const today = new Date().toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "long", year: "numeric" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 20;

  // Header
  doc.setFillColor(9, 9, 15);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(245, 166, 35);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${stock.ticker} · Análisis`, margin, 13);
  doc.setTextColor(150, 140, 180);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${stock.name} · ${stock.market} · ${today}`, margin, 21);
  y = 38;

  // Content — parse markdown
  const lines = text.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t) { y += 3; continue; }

    if (t.startsWith("## ") || t.startsWith("### ")) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(30, 30, 46);
      doc.rect(margin - 2, y - 4, contentW + 4, 8, "F");
      doc.setTextColor(245, 166, 35);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(t.replace(/^##+ /, ""), margin, y);
      y += 8;
    } else {
      if (y > 270) { doc.addPage(); y = 20; }
      const clean = t.replace(/\*\*/g, "");
      doc.setTextColor(60, 60, 80);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(clean, contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5;
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(80, 80, 100);
    doc.setFontSize(7);
    doc.text("Esto no es asesoramiento financiero · Cartera Análisis App", margin, 290);
    doc.text(`${i}/${pageCount}`, pageW - margin, 290, { align: "right" });
  }

  doc.save(`${stock.ticker}_analisis_${new Date().toISOString().slice(0,10)}.pdf`);
}

/* ── Add modal ──────────────────────────────────────────────────────── */
function AddModal({ onAdd, onClose }) {
  const [ticker, setTicker] = useState("");
  const [name, setName]     = useState("");
  const [market, setMarket] = useState("NASDAQ");
  const [err, setErr]       = useState("");
  const f = { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", padding: ".55rem .75rem", fontSize: ".7rem", width: "100%", outline: "none" };

  function handle() {
    if (!ticker.trim()) { setErr("El ticker es obligatorio"); return; }
    const yahooTicker = market === "BME" ? `${ticker.trim().toUpperCase()}.MC` : ticker.trim().toUpperCase();
    onAdd({ ticker: ticker.trim().toUpperCase(), name: name.trim() || ticker.trim().toUpperCase(), market, yahooTicker });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1.8rem", width: "min(400px, 90vw)" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: ".95rem", fontWeight: 600, color: "var(--amber)", marginBottom: "1.2rem" }}>+ Añadir valor</div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".8rem" }}>
          {[["Ticker *", ticker, setTicker, "AAPL, SAN, NVDA…"], ["Nombre completo", name, setName, "Apple Inc"]].map(([lbl, val, set, ph]) => (
            <div key={lbl}>
              <label style={{ fontSize: ".58rem", color: "var(--text-dim)", letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: ".3rem" }}>{lbl}</label>
              <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={f} onKeyDown={e => e.key === "Enter" && handle()} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: ".58rem", color: "var(--text-dim)", letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: ".3rem" }}>Mercado</label>
            <select value={market} onChange={e => setMarket(e.target.value)} style={{ ...f, appearance: "none" }}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {err && <div style={{ fontSize: ".63rem", color: "var(--red)" }}>{err}</div>}
          <div style={{ display: "flex", gap: ".6rem", marginTop: ".3rem" }}>
            <BtnPrimary onClick={handle} style={{ flex: 1 }}>Añadir</BtnPrimary>
            <BtnSec onClick={onClose} style={{ flex: 1 }}>Cancelar</BtnSec>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── History panel ──────────────────────────────────────────────────── */
function HistoryPanel({ history, onRestore, onClear }) {
  const [selected, setSelected] = useState(null);

  if (history.length === 0) return (
    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-dim)", fontSize: ".7rem" }}>
      Aún no hay análisis guardados.<br />Genera tu primer análisis desde el Dashboard.
    </div>
  );

  const byDate = history.reduce((acc, item) => {
    const d = item.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", height: "100%" }}>
      {/* Left list */}
      <div style={{ borderRight: "1px solid var(--border)", overflowY: "auto" }}>
        <div style={{ padding: ".6rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: ".55rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-dim)" }}>{history.length} análisis</span>
          <button onClick={onClear} style={{ background: "none", border: "none", color: "var(--red)", fontSize: ".58rem", cursor: "pointer" }}>Borrar todo</button>
        </div>
        {Object.entries(byDate).reverse().map(([date, items]) => (
          <div key={date}>
            <div style={{ padding: ".4rem 1rem", fontSize: ".55rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-dim)", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>{date}</div>
            {items.map(item => (
              <div key={item.id} onClick={() => setSelected(item)} style={{
                padding: ".5rem 1rem", cursor: "pointer", borderBottom: "1px solid rgba(37,37,53,.5)",
                background: selected?.id === item.id ? "rgba(124,106,245,.08)" : "transparent",
                borderLeft: selected?.id === item.id ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "background .15s"
              }}>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--amber)" }}>{item.ticker}</div>
                <div style={{ fontSize: ".55rem", color: "var(--text-dim)", marginTop: ".1rem" }}>{item.time} · {item.market}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Right detail */}
      <div style={{ overflowY: "auto", padding: "1.2rem 1.5rem" }}>
        {!selected ? (
          <div style={{ color: "var(--text-dim)", fontSize: ".7rem", paddingTop: "2rem" }}>← Selecciona un análisis para verlo</div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--amber)" }}>{selected.ticker}</span>
                <span style={{ fontSize: ".6rem", color: "var(--text-dim)", marginLeft: ".6rem" }}>{selected.name} · {selected.date} {selected.time}</span>
              </div>
              <div style={{ display: "flex", gap: ".4rem" }}>
                <BtnSec onClick={() => downloadPDF({ ticker: selected.ticker, name: selected.name, market: selected.market }, selected.text)} style={{ fontSize: ".58rem", padding: ".3rem .6rem" }}>⬇ PDF</BtnSec>
              </div>
            </div>
            <MD text={selected.text} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main app ───────────────────────────────────────────────────────── */
export default function Home() {
  const [stocks, setStocks]   = useLS("cartera_stocks_v2", DEFAULT_STOCKS);
  const [history, setHistory] = useLS("cartera_history", []);
  const [results, setResults] = useState({});
  const [charts, setCharts]   = useState({});
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatus]= useState("");
  const [showModal, setModal] = useState(false);
  const [tab, setTab]         = useState("dashboard");
  const [time, setTime]       = useState("");
  const [today, setToday]     = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date(), opts = { timeZone: "Europe/Madrid" };
      setTime(now.toLocaleTimeString("es-ES", { ...opts, hour12: false }));
      setToday(now.toLocaleDateString("es-ES", { ...opts, weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  /* Fetch chart */
  const fetchChart = useCallback(async (stock) => {
    try {
      const res = await fetch(`/api/chart?ticker=${encodeURIComponent(stock.yahooTicker || stock.ticker)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.points) setCharts(prev => ({ ...prev, [stock.ticker]: data }));
    } catch {}
  }, []);

  /* Analyze one */
  const analyzeOne = useCallback(async (stock) => {
    setResults(prev => ({ ...prev, [stock.ticker]: { status: ST.loading } }));
    fetchChart(stock);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stock) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

      setResults(prev => ({ ...prev, [stock.ticker]: { status: ST.done, text: data.text } }));

      // Save to history
      const now = new Date();
      const entry = {
        id: `${stock.ticker}-${Date.now()}`,
        ticker: stock.ticker, name: stock.name, market: stock.market,
        text: data.text,
        date: now.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" }),
        time: now.toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid", hour12: false, hour: "2-digit", minute: "2-digit" }),
      };
      setHistory(prev => [entry, ...prev].slice(0, 200)); // keep last 200
    } catch (e) {
      setResults(prev => ({ ...prev, [stock.ticker]: { status: ST.error, error: e.message } }));
    }
  }, [fetchChart, setHistory]);

  /* Analyze all */
  async function analyzeAll() {
    setRunning(true);
    for (let i = 0; i < stocks.length; i++) {
      setStatus(`Analizando ${stocks[i].ticker} (${i + 1}/${stocks.length})…`);
      await analyzeOne(stocks[i]);
      if (i < stocks.length - 1) await new Promise(r => setTimeout(r, 700));
    }
    setStatus(`✓ Completado · ${new Date().toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid" })}`);
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

  const doneCount = Object.values(results).filter(r => r.status === ST.done).length;

  return (
    <>
      <Head>
        <title>Cartera · Análisis Diario</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Top bar */}
        <header className="no-print" style={{ height: 60, padding: "0 1.8rem", borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg,rgba(124,106,245,.07) 0%,transparent 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "1.05rem", fontWeight: 700 }}>
              CARTERA <span style={{ color: "var(--amber)" }}>·</span> ANÁLISIS
            </span>
            <div style={{ width: 1, height: 20, background: "var(--border)" }} />
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: "none", border: "none", padding: ".25rem .05rem",
                fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase",
                color: tab === t ? "var(--amber)" : "var(--text-dim)",
                borderBottom: tab === t ? "1px solid var(--amber)" : "1px solid transparent",
                cursor: "pointer", fontFamily: "var(--mono)"
              }}>{t === "dashboard" ? "Dashboard" : t === "historial" ? `Historial (${history.length})` : "⚙ Ajustes"}</button>
            ))}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: ".9rem", color: "var(--amber)", fontWeight: 700 }}>{time}</div>
            <div style={{ fontSize: ".52rem", color: "var(--text-dim)", textTransform: "capitalize" }}>{today}</div>
          </div>
        </header>

        {/* Layout */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar */}
          {tab === "dashboard" && (
            <aside className="no-print" style={{ width: 210, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div style={{ padding: ".6rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: ".53rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-dim)" }}>Cartera · {stocks.length}</span>
                <button onClick={() => setModal(true)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--amber)", width: 20, height: 20, fontSize: ".8rem", lineHeight: "18px", textAlign: "center", cursor: "pointer" }}>+</button>
              </div>
              {stocks.map(s => (
                <div key={s.ticker} onClick={() => document.getElementById(`card-${s.ticker}`)?.scrollIntoView({ behavior: "smooth", block: "start" })} style={{ padding: ".5rem 1rem", cursor: "pointer", borderBottom: "1px solid rgba(37,37,53,.5)", display: "flex", alignItems: "center", gap: ".5rem", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Dot status={results[s.ticker]?.status || ST.idle} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text)" }}>{s.ticker}</div>
                    <div style={{ fontSize: ".52rem", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  </div>
                  {charts[s.ticker]?.changePercent && (
                    <span style={{ fontSize: ".58rem", color: parseFloat(charts[s.ticker].changePercent) >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                      {parseFloat(charts[s.ticker].changePercent) >= 0 ? "+" : ""}{charts[s.ticker].changePercent}%
                    </span>
                  )}
                </div>
              ))}
              <div style={{ marginTop: "auto", padding: ".8rem 1rem", borderTop: "1px solid var(--border)", fontSize: ".53rem", color: "var(--text-dim)", lineHeight: 1.8 }}>
                {doneCount}/{stocks.length} analizados<br />
                {history.length} en historial
              </div>
            </aside>
          )}

          {/* Main content */}
          <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Controls — only on dashboard */}
            {tab === "dashboard" && (
              <div className="no-print" style={{ padding: ".8rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: ".6rem", flexShrink: 0, flexWrap: "wrap" }}>
                <BtnPrimary onClick={analyzeAll} disabled={running || stocks.length === 0}>
                  {running ? "⟳ Analizando…" : "▶ Análisis completo"}
                </BtnPrimary>
                <BtnSec onClick={() => { setResults({}); setStatus(""); }} disabled={running}>↺ Limpiar</BtnSec>
                <BtnSec onClick={() => setModal(true)} disabled={running}>+ Añadir valor</BtnSec>
                <span style={{ flex: 1, fontSize: ".6rem", color: "var(--text-dim)" }}>
                  {statusMsg || `${stocks.length} valores · pulsa "Análisis completo" para empezar`}
                </span>
              </div>
            )}

            {/* Dashboard */}
            {tab === "dashboard" && (
              <div style={{ padding: "1.2rem 1.5rem", flex: 1 }}>
                {stocks.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: "5rem", color: "var(--text-dim)", fontSize: ".72rem" }}>
                    Cartera vacía · <button onClick={() => setModal(true)} style={{ background: "none", border: "none", color: "var(--amber)", cursor: "pointer", fontSize: ".72rem", fontFamily: "var(--mono)" }}>+ Añadir primer valor</button>
                  </div>
                ) : stocks.map(s => (
                  <StockCard key={s.ticker} stock={s} result={results[s.ticker]} chartData={charts[s.ticker]} onAnalyze={analyzeOne} onRemove={removeStock} />
                ))}
              </div>
            )}

            {/* Historial */}
            {tab === "historial" && (
              <div style={{ flex: 1, overflow: "hidden" }}>
                <HistoryPanel
                  history={history}
                  onClear={() => { if (confirm("¿Borrar todo el historial?")) setHistory([]); }}
                />
              </div>
            )}

            {/* Ajustes */}
            {tab === "ajustes" && (
              <div style={{ padding: "2rem 1.8rem", maxWidth: 520 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: "1rem", fontWeight: 600, color: "var(--amber)", marginBottom: "1.5rem" }}>⚙ Ajustes</div>
                <Sec title="Gestión de cartera">
                  <p style={{ fontSize: ".68rem", color: "var(--text-dim)", lineHeight: 1.8, marginBottom: ".8rem" }}>La cartera y el historial se guardan automáticamente en tu navegador.</p>
                  <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                    <BtnSec onClick={() => setModal(true)}>+ Añadir valor</BtnSec>
                    <BtnSec onClick={() => { if (confirm("¿Restaurar cartera original?")) { setStocks(DEFAULT_STOCKS); setResults({}); } }}>↺ Restaurar cartera original</BtnSec>
                  </div>
                </Sec>
                <Sec title="Modelo de IA">
                  <p style={{ fontSize: ".68rem", color: "var(--text-dim)", lineHeight: 1.8 }}>
                    Usando <strong style={{ color: "var(--text)" }}>Claude Sonnet 4.6</strong> con búsqueda web en tiempo real.<br />
                    Coste estimado: ~0,03€ por análisis completo de 10 acciones.
                  </p>
                </Sec>
                <Sec title="Aviso legal">
                  <p style={{ fontSize: ".65rem", color: "var(--red)", lineHeight: 1.8 }}>Los análisis son informativos y no constituyen asesoramiento financiero. Consulta siempre con un profesional antes de tomar decisiones de inversión.</p>
                </Sec>
              </div>
            )}
          </main>
        </div>
      </div>

      {showModal && <AddModal onAdd={addStock} onClose={() => setModal(false)} />}
    </>
  );
}

function Sec({ title, children }) {
  return (
    <div style={{ marginBottom: "1.8rem" }}>
      <div style={{ fontSize: ".55rem", letterSpacing: ".13em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: ".7rem", paddingBottom: ".35rem", borderBottom: "1px solid var(--border)" }}>{title}</div>
      {children}
    </div>
  );
}
