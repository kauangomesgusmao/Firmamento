const CACHE = 'firmamento-v7';
const ASSETS = [
  '/', '/index.html',
  '/css/style.css',
  '/js/config.js', '/js/utils.js', '/js/data.js', '/js/auth.js',
  '/js/router.js', '/js/ui.js', '/js/novel.js', '/js/reader.js',
  '/js/admin.js', '/js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Supabase (contas, dados) sempre direto da rede — nunca do cache.
  if (url.includes('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }
  if (e.request.method !== 'GET') { e.respondWith(fetch(e.request)); return; }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
