import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBPvmT-ei-vI8c0JoA3Jh9tgCGW3b8r4Hw",
  authDomain: "revaa-11823.firebaseapp.com",
  projectId: "revaa-11823",
  storageBucket: "revaa-11823.firebasestorage.app",
  messagingSenderId: "282585571547",
  appId: "1:282585571547:web:4cb71f6f6b65736a6a2cfe"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}
export { auth };

export { app };
export const db = getFirestore(app);
export const storage = getStorage(app);
