import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPT7OwWQroXFOl1Ksu-w8xw-571Xb-UtE",
  authDomain: "xipfinance.firebaseapp.com",
  projectId: "xipfinance",
  storageBucket: "xipfinance.firebasestorage.app",
  messagingSenderId: "633388493956",
  appId: "1:633388493956:web:7694aa801633e2248fe6d1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;