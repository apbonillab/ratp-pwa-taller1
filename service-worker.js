'use strict';

const CACHE_DATA = 'cache';
const SHELL_CACHE_NAME = 'shell-cache';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/styles/inline.css',
  '/scripts/localforage.min.js',
  '/manifest.json'
];

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  evt.waitUntil(
    caches.open( SHELL_CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
);
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !==  SHELL_CACHE_NAME && key !== CACHE_DATA) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
);

  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
if (evt.request.url.includes('/schedules/')) {
  console.log('[Service Worker] Fetch (data)', evt.request.url);
  evt.respondWith(
      caches.open(CACHE_DATA).then((cache) => {
        return fetch(evt.request)
            .then((response) => {
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
              return response;
            }).catch((err) => {
              return cache.match(evt.request);
            });
      }));
  return;
}
evt.respondWith(
    caches.open( SHELL_CACHE_NAME).then((cache) => {
      return cache.match(evt.request)
          .then((response) => {
            return response || fetch(evt.request);
          });
    })
);

});
