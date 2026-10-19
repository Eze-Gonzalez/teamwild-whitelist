/* Whitelist Team Wild RP :: intermediario en Cloudflare Workers

   La pagina publica envia aqui y el Worker reenvia a Discord, asi la URL del
   webhook nunca aparece en GitHub ni en el navegador.

   Variables del Worker (Settings > Variables and Secrets):
     WEBHOOK_URL     URL del webhook de Discord (tipo Secret)
     ALLOWED_ORIGIN  https://TUUSUARIO.github.io  (sin barra final)
     PING_ROLES      IDs de roles separados por coma: los unicos que pueden sonar */

const MAX_FILES = 2;
const MAX_BYTES = 9 * 1024 * 1024;

export default {
    async fetch(request, env) {
        const cors = {
            'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Vary': 'Origin',
        };
        const reply = (status, text) => new Response(text || null, { status, headers: cors });

        if (request.method === 'OPTIONS') return reply(204);
        if (request.method !== 'POST') return reply(405, 'Method not allowed');

        const origin = request.headers.get('Origin') || '';
        if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) return reply(403, 'Forbidden');
        if (Number(request.headers.get('Content-Length') || 0) > MAX_BYTES) return reply(413, 'Too large');

        let incoming, payload;
        try {
            incoming = await request.formData();
            payload = JSON.parse(incoming.get('payload_json'));
        } catch (e) {
            return reply(400, 'Bad request');
        }

        // Nada de lo que llegue desde fuera decide a quien se menciona
        const roles = String(env.PING_ROLES || '').split(',').map(s => s.trim()).filter(Boolean);
        payload.allowed_mentions = { parse: [], roles, users: [] };
        payload.content = String(payload.content || '').slice(0, 1900);
        payload.embeds = Array.isArray(payload.embeds) ? payload.embeds.slice(0, 1) : [];

        const out = new FormData();
        out.append('payload_json', JSON.stringify(payload));
        for (let i = 0; i < MAX_FILES; i++) {
            const f = incoming.get('files[' + i + ']');
            if (f && typeof f !== 'string') out.append('files[' + i + ']', f, f.name);
        }

        const res = await fetch(env.WEBHOOK_URL, { method: 'POST', body: out });
        return reply(res.ok ? 204 : res.status);
    },
};
