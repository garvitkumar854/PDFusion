
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDOr3isTqTHoUxdX189ZULuDKVNjOxRJOE",
    authDomain: "pdfusion-qqsk7.firebaseapp.com",
    projectId: "pdfusion-qqsk7",
    storageBucket: "pdfusion-qqsk7.firebasestorage.app",
    messagingSenderId: "44006442739",
    appId: "1:44006442739:web:7986d77344253443af9986",
    measurementId: "G-MWFFW61FJP"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

// @ts-ignore
export { app, auth, db };
