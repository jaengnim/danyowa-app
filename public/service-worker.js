const CACHE_NAME = 'danyowa-v6';
const urlsToCache = [
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing new version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  // Activate immediately - skip waiting
  self.skipWaiting();
});

// Activate event - clean ALL old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - NETWORK FIRST for HTML/JS, cache for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For HTML and JS files, always try network first
  if (event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // For other resources, try cache first
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push received');

  let data = {
    title: '다녀와 알림',
    body: '새로운 알림이 있습니다',
    icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
    data: {}
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[Service Worker] Failed to parse push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    // 진동을 더 길게: 0.5초 진동, 0.2초 쉼, 0.5초 진동
    vibrate: [500, 250, 500, 250, 500],
    tag: data.data?.type || 'default',
    renotify: true,
    requireInteraction: true,
    data: data.data,
    // 시스템 기본 알림음 사용 유도 (지원 브라우저용)
    sound: 'default',
    actions: [
      { action: 'open', title: '앱 열기' },
      { action: 'close', title: '닫기' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open or focus the app with speak=true parameter
  let urlToOpen = event.notification.data?.url || '/';

  // URL에 파라미터 추가 (이미 있으면 & 없으면 ?)
  if (urlToOpen.includes('?')) {
    urlToOpen += '&speak=true';
  } else {
    urlToOpen += '?speak=true';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (client.navigate) {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        // Open new window if not found
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
});

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('[Service Worker] Notification closed');
});