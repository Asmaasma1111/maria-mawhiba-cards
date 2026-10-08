/* sw.js — يعمل بلا إنترنت بعد أول فتح. ارفعي الرقم مع كل نشر. */
var CACHE = 'maria-cards-v3';
var ASSETS = ['./','index.html','parent.html','exam.html','app.css','manifest.json','icon.svg',
  'generator.js','store.js','bank.js','scheduler.js','session.js','parent.js','exam.js','skills.json',
  'content/exams.json','content/shapes.js','content/icons.js','content/diagrams.js',
  'content/fonts/Tajawal-Regular-arabic.woff2','content/fonts/Tajawal-Regular-latin.woff2',
  'content/fonts/Tajawal-Bold-arabic.woff2','content/fonts/Tajawal-Bold-latin.woff2'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(function (r) {
      var c = r.clone(); caches.open(CACHE).then(function (k) { k.put(e.request, c); }); return r;
    }).catch(function () {
      return caches.match(e.request).then(function (h) { return h || caches.match('index.html'); });
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (hit) {
    var net = fetch(e.request).then(function (r) {
      if (r && r.ok) { var c = r.clone(); caches.open(CACHE).then(function (k) { k.put(e.request, c); }); }
      return r;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
