import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAeOC3S3cRPo5spaF7JPmVX8xWmrSSsfQ",
  authDomain: "jaunty-affinity-86ppv.firebaseapp.com",
  projectId: "jaunty-affinity-86ppv",
  storageBucket: "jaunty-affinity-86ppv.firebasestorage.app",
  messagingSenderId: "214633595531",
  appId: "1:214633595531:web:007be81458e2bd28cc8a8e"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use the specific firestore database ID from config
export const db = getFirestore(app, "ai-studio-857b72de-8716-47fd-9314-1fbc05973931");
