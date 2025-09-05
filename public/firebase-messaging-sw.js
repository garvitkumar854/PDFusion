
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
const firebaseConfig = {
  apiKey: "AIzaSyDOr3isTqTHoUxdX189ZULuDKVNjOxRJOE",
  authDomain: "pdfusion-qqsk7.firebaseapp.com",
  projectId: "pdfusion-qqsk7",
  storageBucket: "pdfusion-qqsk7.firebasestorage.app",
  messagingSenderId: "44006442739",
  appId: "1:44006442739:web:7986d77344253443af9986",
  measurementId: ""
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
