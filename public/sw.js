
// Service Worker for Ramadan App

const CACHE_NAME = 'ramadan-app-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache
const filesToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/alarm-sound.mp3'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(filesToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Push notification event
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Prayer time notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Prayer Time', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(clientList => {
        // Check if there is already a window/tab open with the target URL
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url === '/' && 'focus' in client)
            return client.focus();
        }
        // If no open window/tab, open a new one
        if (clients.openWindow)
          return clients.openWindow('/');
      })
  );
});

// Handle alarm events
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_ALARM') {
    const alarmTime = new Date(event.data.time).getTime();
    const now = Date.now();
    const timeUntilAlarm = alarmTime - now;
    
    if (timeUntilAlarm > 0) {
      setTimeout(() => {
        self.registration.showNotification(event.data.title, {
          body: event.data.body,
          icon: '/favicon.ico',
          vibrate: [100, 50, 100, 50, 100, 50, 100]
        });
        
        // Attempt to play sound if possible
        if (event.data.clientId) {
          self.clients.get(event.data.clientId).then(client => {
            if (client) {
              client.postMessage({
                type: 'ALARM_TRIGGERED',
                alarmId: event.data.alarmId
              });
            }
          });
        }
      }, timeUntilAlarm);
    }
  }
});
