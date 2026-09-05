// MONE — service worker simples, só pra deixar o app instalável (PWA).
const CACHE_NOME = "mone-v2";
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
  const url = new URL(evento.request.url);

  // só mexe em GET de arquivo do próprio app — nunca intercepta chamadas
  // pro Supabase (login, salvar, apagar) nem nada de outro método/origem.
  // Interceptar isso podia causar reenvio duplicado de uma mesma ação.
  if (evento.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  evento.respondWith(
    fetch(evento.request).catch(() => caches.match(evento.request))
  );
});

self.addEventListener("push", (evento) => {
  let dados = { title: "MONE", body: "Você tem uma novidade no MONE." };
  try {
    dados = evento.data.json();
  } catch (erro) {
    /* usa o texto padrão acima */
  }

  evento.waitUntil(
    self.registration.showNotification(dados.title || "MONE", {
      body: dados.body,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  evento.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientes) => {
      for (const cliente of clientes) {
        if ("focus" in cliente) return cliente.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./index.html");
    })
  );
});
