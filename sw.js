/* Pulse service worker — installable app + offline shell */
var CACHE = 'pulse-cache-v1';

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png']);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);

  function cachePut(req, res){
    try {
      var cp = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, cp); });
    } catch(err){}
  }

  if(url.origin === location.origin){
    // app shell (page + code): network first so updates arrive instantly, cache when offline
    var isShell = url.pathname === '/' || url.pathname.indexOf('.') === -1 ||
                  url.pathname.endsWith('/index.html') || url.pathname.endsWith('/app.js');
    if(isShell){
      e.respondWith(
        fetch(e.request).then(function(res){ cachePut(e.request, res); return res; })
          .catch(function(){ return caches.match(e.request, { ignoreSearch: true }); })
      );
      return;
    }
    // icons / manifest / other static files: cache first
    e.respondWith(
      caches.match(e.request).then(function(hit){
        return hit || fetch(e.request).then(function(res){ cachePut(e.request, res); return res; });
      })
    );
    return;
  }

  // everything else (supabase library, fonts, API reads, photos):
  // try the network, fall back to the last cached copy when offline
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && (res.ok || res.type === 'opaque')) cachePut(e.request, res);
      return res;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
