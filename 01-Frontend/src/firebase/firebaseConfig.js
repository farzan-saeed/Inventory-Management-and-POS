import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Environment helper safe for both Vite bundler and Node.js runtime
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDemoInventoryKey1234567890abcdef",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "smart-inventory-demo.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "smart-inventory-demo",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "smart-inventory-demo.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
};

// Check if credentials are placeholders
export const isDemoConfig = 
  !env.VITE_FIREBASE_API_KEY || 
  env.VITE_FIREBASE_API_KEY.includes('Demo') ||
  env.VITE_FIREBASE_API_KEY === 'your_api_key_here';

// Initialize Firebase App singleton safely
let app;
let auth;
let db;
let functions;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'us-central1');
} catch (error) {
  console.warn("Firebase initialization warning (running in offline demo mode):", error.message);
}

export { app, auth, db, functions };
export default app;
