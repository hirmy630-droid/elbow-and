const CACHE_NAME = 'elbow-v202609290755';
const APP_SHELL = [
  './',
  './index.html',
  './index.html?v=202609290755',
  './manifest.json',
  './manifest.json?v=202609290755',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network First strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // HTTPステータスが正常かつ、自ドメインのリクエストであるか確認
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // キャッシュを更新
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});

// 新しいワーカーへの切り替えをクライアントから強制するための処理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});