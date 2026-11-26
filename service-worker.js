
const CACHE_NAME = 'drilling-monitor-v4.7';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './drill-squad.png'
];

// =========================
// INSTALL
// =========================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// =========================
// ACTIVATE
// =========================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// =========================
// FETCH & CACHE
// =========================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// =========================
// PUSH NOTIFICATION
// =========================
self.addEventListener('push', event => {
  let data = {
    title: 'DRILL SQUAD',
    body: 'Ada informasi baru dari tim DRILL SQUAD.',
    icon: './drill-squad.png',
    url: './'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge || './drill-squad.png',
    tag: data.tag || 'drill-squad-notification',
    data: {
      url: data.url || './'
    },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'DRILL SQUAD',
      options
    )
  );
});

// =========================
// NOTIFICATION CLICK
// =========================
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || './',
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin)) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});
