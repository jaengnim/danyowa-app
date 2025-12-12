// Firebase Configuration for 다녀와 App
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBd6BqdIAXm9BlcHCpEU4iEVSE4e6No-2U",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "comeback001.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "comeback001",
    storageBucket: "comeback001.firebasestorage.app",
    messagingSenderId: "556217112166",
    appId: "1:556217112166:web:788a181f34d11066bcbfa7",
    measurementId: "G-4KXZRSP61R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

export default app;
