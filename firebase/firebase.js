// Firebase web SDK setup (client-side only). Used for Google and email/password sign-in.
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCO0zgEv7zCaW32hqlpwTV9OIO5NmjGh9k",
  authDomain: "units-manager-9d221.firebaseapp.com",
  projectId: "units-manager-9d221",
  storageBucket: "units-manager-9d221.firebasestorage.app",
  messagingSenderId: "333727354523",
  appId: "1:333727354523:web:9e0a341d9f6776e907c03e",
  measurementId: "G-S7WWYHTV0H",
};

// Initialize Firebase once (hot reloads re-import this module).
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Local development against the Auth emulator: NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
if (emulatorHost && !auth.emulatorConfig) {
  connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
}

// Analytics only works in the browser; load it lazily so server rendering never touches it.
if (typeof window !== "undefined" && !emulatorHost) {
  import("firebase/analytics").then(async ({ getAnalytics, isSupported }) => {
    if (await isSupported()) getAnalytics(app);
  });
}
