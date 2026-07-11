const CACHE_NAME = 'sarafat-electronics-v19';
const APP_SHELL = [
  './index.html',
  './Sarafat_Electronics_App.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// HTML পেজের জন্য: আগে নেটওয়ার্ক থেকে নতুন ভার্সন আনার চেষ্টা, না পেলে ক্যাশ থেকে (অফলাইন সাপোর্ট)
// অন্য ফাইলের (icon, manifest) জন্য: আগে ক্যাশ, পেছনে নেটওয়ার্ক দিয়ে আপডেট
self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  var isHTML = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(event.request).then(function(response){
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){ return caches.match(event.request); })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || networkFetch;
    })
  );
});
