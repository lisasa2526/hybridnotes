// Firebase project configuration, read from Vite environment variables.
//
// Copy `.env.example` to `.env` and fill in the values from your own
// Firebase project (Firebase console → Project settings → Your apps → Web).
// No real keys are committed to this repository: the placeholders below mean
// "not configured", and in that state the app skips Firebase entirely and
// serves results from its built-in local engine (see hybrid-service.js).

const env = import.meta.env ?? {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || "",
};

/** True only when the minimum fields needed by Firebase AI Logic exist. */
export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

/** Optional reCAPTCHA site key for Firebase App Check (see firebase-ai.js). */
export const appCheckSiteKey = env.VITE_FIREBASE_APPCHECK_SITE_KEY || "";
