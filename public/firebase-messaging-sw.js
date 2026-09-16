importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyBV7ahbIYfiTaKDmCR9nvH24P6l-YHzL-s",
  authDomain: "furnix-crm.firebaseapp.com",
  projectId: "furnix-crm",
  storageBucket: "furnix-crm.firebasestorage.app",
  messagingSenderId: "188942936378",
  appId: "1:188942936378:web:eb30fc30f73ccc304b4803",
  measurementId: "G-FJT5KB0WVX",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle =
    payload.data?.title || payload.notification?.title || "Notification";
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || "",
    icon: payload.notification?.image,
    data: {
      redirect_url: payload.data?.redirect_url || "",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const redirectUrl = event.notification?.data?.redirect_url;
  if (!redirectUrl) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(redirectUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(redirectUrl);
        }
      }
    )
  );
});
