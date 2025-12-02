// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAI, getGenerativeModel, VertexAIBackend } from "firebase/ai";
import { clientEnv } from "./env";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: clientEnv.FIREBASE_API_KEY,
    authDomain: clientEnv.FIREBASE_AUTH_DOMAIN,
    projectId: clientEnv.FIREBASE_PROJECT_ID,
    storageBucket: clientEnv.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: clientEnv.FIREBASE_MESSAGING_SENDER_ID,
    appId: clientEnv.FIREBASE_APP_ID,
    measurementId: clientEnv.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics | null = null;

// Only initialize if not already initialized
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Analytics can only be initialized in browser environment
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

// Initialize the Vertex AI Gemini API backend service
const ai = getAI(app, { backend: new VertexAIBackend() });

// Create a GenerativeModel instance with gemini-2.5-flash
const model = getGenerativeModel(ai, {
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
    },
});

// Initialize Firestore
import { getFirestore, Firestore } from "firebase/firestore";
let db: Firestore | null = null;

if (typeof window !== 'undefined') {
    db = getFirestore(app);
}

export { app, analytics, ai, model, db };
