const CACHE_NAME = 'khata-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './styles/bridgemind-theme.css',
  './js/app.js',
  './js/auth.js',
  './js/company.js',
  './js/db.js',
  './js/demo.js',
  './js/expenses.js',
  './js/reports.js',
  './js/settings.js',
  './js/stores.js',
  './js/transactions.js',
  './Pages/dashboard.html',
  './Pages/company.html',
  './Pages/expenses.html',
  './Pages/reports.html',
  './Pages/settings.html',
  './Pages/stores.html',
  './Pages/transactions.html',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('localStorage') || 
      event.request.url.includes('localhost') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            return caches.match('./index.html');
          });
      })
  );
});