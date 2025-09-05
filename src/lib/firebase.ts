
import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  "projectId": "pdfusion-qqsk7",
  "appId": "1:44006442739:web:7986d77344253443af9986",
  "storageBucket": "pdfusion-qqsk7.firebasestorage.app",
  "apiKey": "AIzaSyDOr3isTqTHoUxdX189ZULuDKVNjOxRJOE",
  "authDomain": "pdfusion-qqsk7.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "44006442739"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
