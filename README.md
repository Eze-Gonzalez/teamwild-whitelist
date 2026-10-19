# Whitelist Team Wild RP

Formulario de whitelist servido con GitHub Pages. Cada solicitud llega a Discord
a través de un Worker de Cloudflare (`worker.js`), para que la URL del webhook no
sea pública.

- `index.html`, `style.css`, `app.js`: la página.
- `config.js`: URL del Worker y roles a mencionar.
- `worker.js`: se pega en Cloudflare Workers; variables `WEBHOOK_URL` (secreto),
  `ALLOWED_ORIGIN` y `PING_ROLES`.
- Respuestas correctas del cuestionario: campo `ok` de cada pregunta en `app.js`.
