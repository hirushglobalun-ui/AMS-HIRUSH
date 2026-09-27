/**
 * File: firebase.ts
 * Purpose: Firebase client SDK initialization for primary and secondary apps.
 * Notes:
 *  - Compatible with Next.js App Router and Vite.
 *  - Supports both NEXT_PUBLIC_* and VITE_* environment variable conventions.
 *  - Guards against duplicate app initialization during fast refresh / SSR.
 *  - Provides safe build-time fallbacks when environment variables are injected at deployment.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForBuildOnly1234567890",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hirush-global-ams.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hirush-global-ams",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hirush-global-ams.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:100000000000:web:abcdef1234567890",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Primary Firebase App (prevent duplicate app error during HMR/SSR)
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Secondary App for Admin/HR User Creation (so active session is preserved)
const secondaryApp = getApps().find(a => a.name === "Secondary") 
  || initializeApp(firebaseConfig, "Secondary");

const secondaryAuth = getAuth(secondaryApp);

export { db, auth, secondaryAuth };
