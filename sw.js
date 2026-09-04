// MONE — service worker simples, só pra deixar o app instalável (PWA).
const CACHE_NOME = "mone-v1";
const ARQUIVOS = ["./index.html", "./styles.css", "./app.js", "./manifest.json"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE_NOME).map((c) => caches.delete(c))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  evento.respondWith(
    fetch(evento.request).catch(() => caches.match(evento.request))
  );
});
