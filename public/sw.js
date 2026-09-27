// Service Worker for Hirush Global AMS PWA
// Provides offline fallback and asset caching without stale chunk trapping.

const CACHE_NAME = 'hirush-ams-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/assets/company-logo.png',
  '/assets/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass service worker for Firebase, Google APIs, and external authentication requests
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('script.google.com')
  ) {
    return;
  }

  // Network-first strategy for navigation requests (HTML pages) to prevent stale Next.js builds
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first strategy for static image assets
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request).then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
        );
      })
    );
    return;
  }
});
