
const CACHE_NAME = 'danyowa-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// #region agent log
self.addEventListener('install', event => {
  fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:install',message:'Service Worker installing',data:{cacheName:CACHE_NAME},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:install',message:'Cache opened successfully',data:{cacheName:CACHE_NAME},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:install',message:'Cache populated, skipping waiting',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return self.skipWaiting();
      })
      .catch(err => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:install',message:'Install failed',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        throw err;
      })
  );
});

self.addEventListener('activate', event => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:activate',message:'Service Worker activating',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:activate',message:'Deleting old cache',data:{oldCache:cacheName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:activate',message:'Claiming clients',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return self.clients.claim();
    }).then(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:activate',message:'Service Worker activated and claimed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    })
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:push',message:'Push event received',data:{hasData:!!event.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  let payload = {};

  try {
    if (event.data) {
      payload = event.data.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:push',message:'Payload parsed from JSON',data:{title:payload.title,body:payload.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  } catch (e) {
    // Not JSON, try text
    try { 
      payload = JSON.parse(event.data.text()); 
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:push',message:'Payload parsed from text',data:{title:payload.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (e) { 
      payload = { body: event.data ? event.data.text() : '' }; 
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:push',message:'Payload fallback to text',data:{error:e.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  }

  const title = payload.title || '다녀와 알림';
  const options = {
    body: payload.body || '새로운 알림이 있습니다',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    vibrate: payload.vibrate || [100, 50, 100],
    requireInteraction: false,
    tag: payload.data?.scheduleId || 'default',
    renotify: false
  };

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:push',message:'Showing notification',data:{title,body:options.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:push',message:'Notification shown successfully',data:{title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      })
      .catch(err => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:push',message:'Notification failed',data:{error:err.message,stack:err.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        throw err;
      })
  );
});

// When the notification is clicked, focus or open the app
self.addEventListener('notificationclick', event => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:notificationclick',message:'Notification clicked',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:notificationclick',message:'Checking for open windows',data:{clientCount:windowClients.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:notificationclick',message:'Focusing existing window',data:{url:client.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          return client.focus();
        }
      }
      if (clients.openWindow) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'service-worker.js:notificationclick',message:'Opening new window',data:{url:urlToOpen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
