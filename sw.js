// Simple SW: cache-first for app shell
const CACHE = 'sinapscore-codigo-infarto-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './site.webmanifest',
  './ios_app_icon_1024.png',
  './apple_touch_icon_180.png',
  './pwa_icon_512.png',
  './icon_1024.png',
  './favicon.jpeg'
];
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=> k===CACHE? null : caches.delete(k)))));
});
self.addEventListener('fetch', (e)=>{
  const { request } = e;
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
