import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
} from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import type { Auth, Persistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDaLSeACrHVSS89fQcjGX18nO2E9EwDpHQ",
  authDomain: "businessconnect-b6310.firebaseapp.com",
  projectId: "businessconnect-b6310",
  storageBucket: "businessconnect-b6310.firebasestorage.app",
  messagingSenderId: "337650877938",
  appId: "1:337650877938:web:04febf76a6c3054b9f576b",
  measurementId: "G-H1RL0ENDHF",
};

// 1. Initialize app once
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize auth with RN persistence (fallback to existing instance on hot reload)
let auth: Auth;
const getReactNativePersistence = (FirebaseAuth as {
  getReactNativePersistence?: (storage: typeof ReactNativeAsyncStorage) => Persistence;
}).getReactNativePersistence;

try {
  auth = getReactNativePersistence
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      })
    : initializeAuth(app);
} catch {
  auth = getAuth(app);
}

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
const functions = getFunctions(app);
const storage = getStorage(app);

export { app, auth, db, functions, storage };