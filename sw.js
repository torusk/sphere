const CACHE_NAME = 'gantz-timer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/sphere.js',
  '/sphere.png',
  '/timer10.mp3',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// インストール時にリソースをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュを開いています');
        return cache.addAll(urlsToCache);
      })
  );
});

// リクエスト時にキャッシュを確認
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュが見つかればそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュになければネットワークからフェッチ
        return fetch(event.request)
          .then(response => {
            // 有効なレスポンスでなければそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // キャッシュに追加するためにレスポンスをクローン
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
