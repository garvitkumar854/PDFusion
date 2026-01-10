import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Statically defined Firebase configuration as provided
const firebaseConfig = {
    apiKey: "AIzaSyDOr3isTqTHoUxdX189ZULuDKVNjOxRJOE",
    authDomain: "pdfusion-qqsk7.firebaseapp.com",
    projectId: "pdfusion-qqsk7",
    storageBucket: "pdfusion-qqsk7.firebasestorage.app",
    messagingSenderId: "44006442739",
    appId: "1:44006442739:web:7986d77344253443af9986",
    measurementId: "G-MWFFW61FJP"
};

function getFirebaseInstances() {
  // Ensure this only runs on the client
  if (typeof window !== 'undefined') {
    if (!app) { // Initialize only if not already initialized
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }
      auth = getAuth(app);
      db = getFirestore(app);
    }
  }
  return { app, auth, db };
}

export { getFirebaseInstances };
