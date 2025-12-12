// Firebase Configuration for 다녀와 App
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBd6BqdIAXm9BlcHCpEU4iEVSE4e6No-2U",
    authDomain: "comeback001.firebaseapp.com",
    projectId: "comeback001",
    storageBucket: "comeback001.firebasestorage.app",
    messagingSenderId: "556217112166",
    appId: "1:556217112166:web:788a181f34d11066bcbfa7",
    measurementId: "G-4KXZRSP61R"
};

// Initialize Firebase safely
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

export { auth };
export default app;

