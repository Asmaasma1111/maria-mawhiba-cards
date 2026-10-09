/* sw.js — يعمل بلا إنترنت بعد أول فتح. ارفعي الرقم مع كل نشر. */
var CACHE = 'maria-cards-v6';
var ASSETS = ['./','index.html','parent.html','exam.html','app.css','manifest.json','icon.svg',
  'generator.js','store.js','bank.js','scheduler.js','session.js','parent.js','exam.js','skills.json','banks.json','icons-blend.js','openmoji-map.json','extra-questions.json','assets/openmoji/1F9E3.svg','assets/openmoji/1FAA8.svg','assets/openmoji/1F30A.svg','assets/openmoji/1F319.svg','assets/openmoji/1F327.svg','assets/openmoji/1F331.svg','assets/openmoji/1F333.svg','assets/openmoji/1F33B.svg','assets/openmoji/1F343.svg','assets/openmoji/1F345.svg','assets/openmoji/1F347.svg','assets/openmoji/1F34C.svg','assets/openmoji/1F34E.svg','assets/openmoji/1F352.svg','assets/openmoji/1F353.svg','assets/openmoji/1F35E.svg','assets/openmoji/1F36F.svg','assets/openmoji/1F374.svg','assets/openmoji/1F37D.svg','assets/openmoji/1F3A7.svg','assets/openmoji/1F3A8.svg','assets/openmoji/1F3A9.svg','assets/openmoji/1F404.svg','assets/openmoji/1F408.svg','assets/openmoji/1F40E.svg','assets/openmoji/1F411.svg','assets/openmoji/1F414.svg','assets/openmoji/1F415.svg','assets/openmoji/1F41B.svg','assets/openmoji/1F41D.svg','assets/openmoji/1F41F.svg','assets/openmoji/1F441.svg','assets/openmoji/1F442.svg','assets/openmoji/1F443.svg','assets/openmoji/1F453.svg','assets/openmoji/1F455.svg','assets/openmoji/1F456.svg','assets/openmoji/1F45E.svg','assets/openmoji/1F4C4.svg','assets/openmoji/1F4D6.svg','assets/openmoji/1F512.svg','assets/openmoji/1F528.svg','assets/openmoji/1F576.svg','assets/openmoji/1F58A.svg','assets/openmoji/1F58C.svg','assets/openmoji/1F58D.svg','assets/openmoji/1F5BC.svg','assets/openmoji/1F686.svg','assets/openmoji/1F68C.svg','assets/openmoji/1F697.svg','assets/openmoji/1F6B2.svg','assets/openmoji/1F955.svg','assets/openmoji/1F95A.svg','assets/openmoji/1F95B.svg','assets/openmoji/1F981.svg','assets/openmoji/1F988.svg','assets/openmoji/1F98B.svg','assets/openmoji/1F9B6.svg','assets/openmoji/1F9E4.svg','assets/openmoji/1F9F6.svg','assets/openmoji/1FA91.svg','assets/openmoji/1FA9A.svg','assets/openmoji/1FA9B.svg','assets/openmoji/2600.svg','assets/openmoji/2601.svg','assets/openmoji/2602.svg','assets/openmoji/2615.svg','assets/openmoji/26F0.svg','assets/openmoji/26F5.svg','assets/openmoji/2702.svg','assets/openmoji/2708.svg','assets/openmoji/270B.svg','assets/openmoji/270F.svg','assets/openmoji/2744.svg',
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
