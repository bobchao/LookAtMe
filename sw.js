// 快取版本
const CACHE_NAME = 'v1';
// 需要快取的資源列表
const CACHE_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './bell-sound.mp3',
    './fav64.png',
    './icon-192x192.png',
    './icon-512x512.png',
    // 不需要快取的資源
    // 'sw.js', // Service Worker 本身不需要快取
    // 'timerWorker.js' // Web Worker 也不需要快取
];

// Service Worker 安裝
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Service Worker 啟動
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName); // 刪除舊的快取
                        }
                    })
                );
            })
    );
});

// 網路請求攔截
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((fetchResponse) => {
                        // 確保回應是有效的
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }

                        // 將新的回應存入快取
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, fetchResponse.clone());
                                return fetchResponse;
                            });
                    });
            })
    );
});
