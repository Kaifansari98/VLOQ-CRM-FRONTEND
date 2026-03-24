import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBV7ahbIYfiTaKDmCR9nvH24P6l-YHzL-s",
  authDomain: "furnix-crm.firebaseapp.com",
  projectId: "furnix-crm",
  storageBucket: "furnix-crm.firebasestorage.app",
  messagingSenderId: "188942936378",
  appId: "1:188942936378:web:eb30fc30f73ccc304b4803",
  measurementId: "G-FJT5KB0WVX",
};

export const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);