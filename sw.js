// Commander Lifetracker: keeps the app working without a connection.
// Bump VERSION whenever index.html changes so installed copies update.
var VERSION = 'lifetracker-v5';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith(caches.open(VERSION).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: url.origin === location.origin }).then(function (hit) {
      var fresh = fetch(e.request).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
        return res;
      });
      if (hit) { fresh.catch(function () {}); return hit; }     // cached copy now, refresh in the background
      return fresh.catch(function () {
        if (e.request.mode === 'navigate') return cache.match('index.html');
        return Response.error();
      });
    });
  }));
});
