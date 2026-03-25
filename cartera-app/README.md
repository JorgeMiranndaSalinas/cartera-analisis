# 📈 Cartera · Análisis Diario

Aplicación web para seguimiento y análisis diario de tu cartera de inversión, usando Claude AI con búsqueda web en tiempo real.

---

## 🚀 Despliegue en Vercel (paso a paso, ~10 minutos)

### Paso 1 — Obtén tu API key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** → **Create Key**
4. Copia la clave (empieza por `sk-ant-...`) — guárdala, solo se muestra una vez

> ⚠️ El uso de la API tiene un coste pequeño (~0,003€ por análisis completo de 10 acciones). Anthropic da crédito gratuito al registrarse.

---

### Paso 2 — Sube el código a GitHub

1. Ve a [github.com](https://github.com) y crea una cuenta gratuita si no tienes
2. Haz clic en **New repository** → ponle nombre (ej: `cartera-analisis`) → **Create**
3. En la página del repositorio vacío, haz clic en **uploading an existing file**
4. Arrastra y sube **todos los archivos y carpetas** de este ZIP
5. Haz clic en **Commit changes**

---

### Paso 3 — Despliega en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta gratuita (puedes entrar con GitHub)
2. Haz clic en **Add New → Project**
3. Selecciona tu repositorio `cartera-analisis`
4. Vercel detectará automáticamente que es Next.js
5. Antes de hacer clic en **Deploy**, ve a **Environment Variables** y añade:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** tu clave `sk-ant-...`
6. Haz clic en **Deploy**

En 1-2 minutos tendrás tu URL (ej: `cartera-analisis.vercel.app`) — compártela con tu padre y listo.

---

### Paso 4 — (Opcional) Dominio personalizado

En Vercel → tu proyecto → **Domains** puedes añadir un dominio propio (ej: `cartera-familia.com`) por ~10€/año en cualquier registrador.

---

## 🔧 Desarrollo local

Si quieres probar la app en tu ordenador antes de subir:

```bash
# Instala Node.js desde nodejs.org si no lo tienes

# En la carpeta del proyecto:
npm install

# Crea el archivo .env.local con tu API key:
echo "ANTHROPIC_API_KEY=sk-ant-TU_CLAVE_AQUI" > .env.local

# Arranca el servidor de desarrollo:
npm run dev
# Abre http://localhost:3000
```

---

## 📁 Estructura del proyecto

```
cartera-app/
├── pages/
│   ├── index.js        # Interfaz principal
│   ├── _app.js         # Configuración global
│   └── api/
│       └── analyze.js  # Backend seguro (API key aquí, nunca en el cliente)
├── styles/
│   └── globals.css     # Estilos globales
└── package.json
```

---

## ✨ Funcionalidades

- **Análisis completo** — analiza todos los valores de la cartera de una vez
- **Análisis individual** — analiza un valor concreto
- **Añadir/eliminar valores** — cartera personalizable
- **Persistencia** — la cartera se guarda en el navegador automáticamente
- **Búsqueda web en tiempo real** — datos y noticias actuales, no de entrenamiento
- **Responsive** — funciona en móvil y escritorio

---

## ⚠️ Aviso legal

Los análisis generados son informativos y **no constituyen asesoramiento financiero**. Consulta siempre con un profesional antes de tomar decisiones de inversión.
