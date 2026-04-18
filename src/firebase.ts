import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC55XXTW2_VEt4M-Eex8bVmnYUyLf9nlu8",
  authDomain: "permit-system-816b5.firebaseapp.com",
  projectId: "permit-system-816b5",
  storageBucket: "permit-system-816b5.firebasestorage.app",
  messagingSenderId: "108885624234",
  appId: "1:108885624234:web:6d67eb9023cbb52c1417d3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
