
const CACHE_NAME = 'danyowa-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Push event: show notification even when the app is closed
self.addEventListener('push', event => {
  let payload = {};

  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    // Not JSON, try text
    try { payload = JSON.parse(event.data.text()); } catch (e) { payload = { body: event.data ? event.data.text() : '' }; }
  }

  const title = payload.title || '다녀와 알림';
  const options = {
    body: payload.body || '새로운 알림이 있습니다',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    vibrate: payload.vibrate || [100, 50, 100]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// When the notification is clicked, focus or open the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
