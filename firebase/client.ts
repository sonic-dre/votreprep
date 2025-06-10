import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAvz7kltWY7jtOswRvtXtc1tlI8jXiP6Cc",
  authDomain: "votreprep.firebaseapp.com",
  projectId: "votreprep",
  storageBucket: "votreprep.firebasestorage.app",
  messagingSenderId: "426921732429",
  appId: "1:426921732429:web:01011e5163686af93e6f04",
  measurementId: "G-L1PQ80Q587"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app)