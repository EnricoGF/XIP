// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBg-zfrwL2bcmSaF7UV21cXQo_Obvhuhq0",
  authDomain: "xxiipp.firebaseapp.com",
  projectId: "xxiipp",
  storageBucket: "xxiipp.firebasestorage.app",
  messagingSenderId: "28104476995",
  appId: "1:28104476995:web:302bac082d432d89c1c7f6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);