importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
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
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
