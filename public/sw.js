// public/sw.js
// Este archivo le dice al móvil que la web es una App real instalable.

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Para una PWA básica que requiere internet (como un CRM), 
    // simplemente dejamos que la petición pase a la red.
    e.respondWith(fetch(e.request));
});