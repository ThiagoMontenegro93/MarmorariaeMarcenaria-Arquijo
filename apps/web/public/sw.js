/* Service worker do PWA Arquijo (RNF03 — medição offline).
 * Estratégias:
 *  - /api/*: só rede (dados sensíveis nunca vão para o cache)
 *  - /_next/static/*, ícones, manifest: cache primeiro (arquivos versionados)
 *  - navegação para /app/medicao: rede primeiro, cópia em cache para abrir offline
 *  - demais navegações: rede; se offline, página de aviso
 * Outras telas internas NÃO são guardadas em cache (contêm dados de clientes).
 */
const VERSAO = 'arquijo-pwa-v1';
const ESTATICOS = ['/offline.html', '/icone-192.png', '/icone-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cachePrimeiro(req) {
  const emCache = await caches.match(req);
  if (emCache) return emCache;
  const resp = await fetch(req);
  if (resp.ok) (await caches.open(VERSAO)).put(req, resp.clone());
  return resp;
}

async function redePrimeiro(req, guardar) {
  try {
    const resp = await fetch(req);
    if (guardar && resp.ok && !resp.redirected) (await caches.open(VERSAO)).put(req.url.split('?')[0], resp.clone());
    return resp;
  } catch {
    const emCache = guardar ? await caches.match(req.url.split('?')[0]) : null;
    return emCache ?? (await caches.match('/offline.html')) ?? new Response('Sem conexão', { status: 503 });
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/static/') || ESTATICOS.includes(url.pathname)) {
    e.respondWith(cachePrimeiro(req));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(redePrimeiro(req, url.pathname === '/app/medicao'));
  }
});

self.addEventListener('message', (e) => {
  // Logout: apaga as páginas guardadas.
  if (e.data === 'limpar-cache') e.waitUntil(caches.delete(VERSAO));
  // Primeira visita: a página ainda não era controlada pelo SW; o cliente envia o que já carregou
  // (JS/CSS versionados e a própria tela de medição) para guardar e abrir offline depois.
  if (e.data && e.data.tipo === 'precache' && Array.isArray(e.data.urls)) {
    const permitidas = e.data.urls.filter((u) => {
      try {
        const url = new URL(u, self.location.origin);
        return url.origin === self.location.origin && (url.pathname.startsWith('/_next/static/') || url.pathname === '/app/medicao');
      } catch {
        return false;
      }
    });
    e.waitUntil(
      caches.open(VERSAO).then((c) =>
        Promise.all(
          permitidas.map((u) =>
            fetch(u, { credentials: 'same-origin' })
              .then((r) => (r.ok && !r.redirected ? c.put(new URL(u, self.location.origin).pathname === '/app/medicao' ? '/app/medicao' : u, r) : undefined))
              .catch(() => undefined),
          ),
        ),
      ),
    );
  }
});
