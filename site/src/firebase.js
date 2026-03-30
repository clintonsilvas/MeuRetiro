import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDp0pUTP1jlth2eeefoFCM9OmrnlRZ8Z4U",
  authDomain: "meuretirocatolico.firebaseapp.com",
  projectId: "meuretirocatolico",
  storageBucket: "meuretirocatolico.firebasestorage.app",
  messagingSenderId: "745891552288",
  appId: "1:745891552288:web:f9d7f5114a75a31f767045",
  measurementId: "G-RMSCWB5DFT"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);