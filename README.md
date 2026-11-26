<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/994d2c94-2153-44a7-9897-a6a8dbbdd15d

## Acceso por subcuenta

FinanzaPro está conectado a **Cuenta Maestra** (https://cuenta-maestra.vercel.app).
Ya no guarda datos sueltos en el navegador: se abre con un enlace de un solo uso
generado desde la subcuenta («Abrir FinanzaPro con esta subcuenta»). Ese enlace se
canjea por un token vinculado al ID del dispositivo, y todos los movimientos y
metas se guardan en la subcuenta correspondiente. Si abres la URL directamente sin
el enlace, verás la pantalla de acceso.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
