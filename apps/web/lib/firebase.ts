// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAI, getGenerativeModel, VertexAIBackend, GenerativeModel } from "firebase/ai";
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

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

// Initialize Firebase
let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let ai: ReturnType<typeof getAI> | null = null;
let model: GenerativeModel | null = null;

if (hasFirebaseConfig) {
    const existingApps = getApps();
    app = existingApps.length ? existingApps[0] : initializeApp(firebaseConfig);

    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }

    ai = getAI(app, { backend: new VertexAIBackend() });
    model = getGenerativeModel(ai, {
        model: 'gemini-2.5-flash',
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
        },
    });
} else {
    console.warn('Firebase client config missing; skipping client initialization. Set NEXT_PUBLIC_FIREBASE_* env vars to enable.');
}

// Initialize Firestore
import { getFirestore, Firestore } from "firebase/firestore";
let db: Firestore | null = null;

if (hasFirebaseConfig && typeof window !== 'undefined' && app) {
    db = getFirestore(app);
}

const getModel = () => model;

export { app, analytics, ai, model, db, getModel };
