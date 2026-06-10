importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC9CceYEeuiedJk5AH7o6R8pafwf31Om4A",
  authDomain: "wc26-97d18.firebaseapp.com",
  projectId: "wc26-97d18",
  storageBucket: "wc26-97d18.firebasestorage.app",
  messagingSenderId: "780635766881",
  appId: "1:780635766881:web:75c8e79303be4a4bb82a20",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = "WorldCup26", body = "" } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.data?.tag ?? "wc26",
    data: { url: self.registration.scope },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
