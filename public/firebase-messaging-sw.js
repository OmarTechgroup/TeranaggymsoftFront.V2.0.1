// Firebase Messaging Service Worker
// Remplacer les valeurs par celles de votre projet Firebase
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// ⚠️ Remplacer par votre config Firebase (firebaseConfig de votre projet)
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || "AIzaSyDuEr2BmMLgfWD5x_cNFBePj9_GGBdOlhY",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "terangagymsoft.firebaseapp.com",
  projectId: self.FIREBASE_PROJECT_ID || "terangagymsoft",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "terangagymsoft.firebasestorage.app",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "149435193838",
  appId: self.FIREBASE_APP_ID || "1:149435193838:web:12dd2640707f4288f056ff",
});

const messaging = firebase.messaging();

// ── Notification en background (app fermée ou onglet inactif) ─────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Message reçu en background:', payload);

  const { title, body, icon, image } = payload.notification ?? {};
  const clickUrl = payload.data?.url ?? '/portal';

  const notificationTitle = title ?? 'TerangaGym';
  const notificationOptions = {
    body: body ?? '',
    icon: icon ?? '/icons/icon.svg',
    badge: '/icons/icon.svg',
    image: image,
    vibrate: [200, 100, 200],
    data: { url: clickUrl },
    requireInteraction: false,
    tag: 'terangagym-' + Date.now(),
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ── Click sur la notification ─────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/portal';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
