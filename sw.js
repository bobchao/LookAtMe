self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './script.js',
        './manifest.json',
        './bell-sound.mp3',
        './fav64.png',
        './icon-192x192.png',
        './icon-512x512.png',
      ]);
    })
  );
  self.skipWaiting(); // 立即控制頁面
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'v1') {
            return caches.delete(cacheName); // 刪除舊的快取
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open('v1').then((cache) => {
            cache.put(event.request, fetchResponse.clone()); // 更新快取
            return fetchResponse;
          });
        });
      })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});
