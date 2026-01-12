
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, GoogleAuthProvider } from 'firebase/auth';
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

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export { app, auth, db, googleProvider };
