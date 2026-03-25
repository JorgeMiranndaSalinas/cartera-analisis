export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "Ticker requerido" });

  try {
    // Yahoo Finance: 3 months of daily data
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=3mo`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) return res.status(response.status).json({ error: "No se pudieron obtener datos del mercado" });

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: "Ticker no encontrado" });

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const currency = result.meta?.currency || "USD";
    const currentPrice = result.meta?.regularMarketPrice;
    const previousClose = result.meta?.previousClose || result.meta?.chartPreviousClose;
    const changePercent = previousClose ? ((currentPrice - previousClose) / previousClose * 100).toFixed(2) : null;

    const points = timestamps
      .map((t, i) => ({ date: new Date(t * 1000).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }), price: closes[i] }))
      .filter(p => p.price != null);

    res.status(200).json({ points, currentPrice, changePercent, currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
