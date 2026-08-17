import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

// Default embedded config to guarantee external deployments (Vercel, Netlify) always work out of the box
const fallbackConfig = {
  apiKey: "AIzaSyAzpRo34lLemhGj34YFjjqnLjYaJM6VzzM",
  authDomain: "gen-lang-client-0213350901.firebaseapp.com",
  projectId: "gen-lang-client-0213350901",
  storageBucket: "gen-lang-client-0213350901.firebasestorage.app",
  messagingSenderId: "390341983850",
  appId: "1:390341983850:web:a163f640eddd8d48f85413",
  firestoreDatabaseId: "ai-studio-59a52c44-ee54-464b-8932-111bd2bc67b5",
};

const rawJson = (firebaseConfigJson as Record<string, string> | undefined) || {};

// Supports environment variables on external hosts like Vercel with automatic fallbacks
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawJson.apiKey || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawJson.authDomain || fallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawJson.projectId || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawJson.storageBucket || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawJson.messagingSenderId || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawJson.appId || fallbackConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || rawJson.firestoreDatabaseId || fallbackConfig.firestoreDatabaseId || "(default)",
};

export const app = getApps().length === 0 ? initializeApp(config) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId);
