// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPvmT-ei-vI8c0JoA3Jh9tgCGW3b8r4Hw",
  authDomain: "revaa-11823.firebaseapp.com",
  projectId: "revaa-11823",
  storageBucket: "revaa-11823.firebasestorage.app",
  messagingSenderId: "282585571547",
  appId: "1:282585571547:web:4cb71f6f6b65736a6a2cfe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);