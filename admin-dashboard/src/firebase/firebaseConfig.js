import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDaLSeACrHVSS89fQcjGX18nO2E9EwDpHQ',
  authDomain: 'businessconnect-b6310.firebaseapp.com',
  projectId: 'businessconnect-b6310',
  storageBucket: 'businessconnect-b6310.firebasestorage.app',
  messagingSenderId: '337650877938',
  appId: '1:337650877938:web:04febf76a6c3054b9f576b',
  measurementId: 'G-H1RL0ENDHF',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };