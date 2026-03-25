# 📈 Cartera · Análisis Diario v2

## Novedades v2
- ✅ Historial completo de análisis guardado automáticamente
- ✅ Descarga PDF de cada análisis
- ✅ Gráfico de precio 3 meses integrado (Yahoo Finance)
- ✅ Prompt mejorado: bull case / bear case, precio objetivo, comparativa de peers
- ✅ Modelo Claude Sonnet 4.6 (máxima calidad)

## Despliegue en Vercel

### 1. Obtén tu API key
→ https://console.anthropic.com → API Keys → Create Key

### 2. Sube a GitHub
New repo → sube todos los archivos del ZIP → Commit

### 3. Despliega en Vercel
- Importa el repo desde vercel.com
- En Environment Variables añade:
  - Name: ANTHROPIC_API_KEY
  - Value: sk-ant-TU_CLAVE
- Deploy

### 4. Prueba local (opcional)
```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-TU_CLAVE" > .env.local
npm run dev
# Abre http://localhost:3000
```

## Estructura
```
cartera-v2/
├── pages/
│   ├── index.js          # App principal
│   ├── _app.js
│   └── api/
│       ├── analyze.js    # Backend Claude AI (API key segura)
│       └── chart.js      # Proxy Yahoo Finance (gráficos)
├── styles/globals.css
└── package.json
```

## Aviso legal
Los análisis son informativos y no constituyen asesoramiento financiero.
