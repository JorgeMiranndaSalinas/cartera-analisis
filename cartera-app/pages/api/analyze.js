export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ticker, name, market } = req.body;
  if (!ticker) return res.status(400).json({ error: "Ticker requerido" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key no configurada en el servidor" });

  const today = new Date().toLocaleDateString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric", month: "long", year: "numeric",
  });

  const prompt = `Hoy es ${today}. Analiza la acción ${ticker} (${name || ticker}, mercado ${market || "desconocido"}).

Usa búsqueda web para obtener datos ACTUALES de hoy. Responde en español con estas secciones exactas:

## 📊 Precio y variación reciente
Precio actual y variación en los últimos días. Tendencia semanal y mensual.

## 📰 Noticias relevantes
Las 2-3 noticias más importantes de esta semana que afecten a esta acción.

## 🔍 Análisis de expertos
Opinión reciente de analistas: precio objetivo, recomendaciones, consenso del mercado.

## ⚡ Señales a vigilar
Catalizadores positivos o negativos próximos (resultados, eventos, sector).

## 🎯 Veredicto
Una frase directa sobre si el momento es favorable, desfavorable o neutral para vender. Incluye exactamente una de estas palabras en mayúsculas: COMPRAR, MANTENER o VENDER.

Sé conciso y usa datos reales actuales.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1200,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || `Error ${response.status}` });
    }

    const data = await response.json();
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
