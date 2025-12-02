/**
 * Environment variable configuration
 * 
 * This file loads and validates environment variables at runtime.
 * - In development: Variables are loaded from .env.local
 * - In production: Variables are loaded from server environment
 */

// Server-side environment variables (not exposed to browser)
function getServerEnv() {
    return {
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
        FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    };
}

// Client-side environment variables (exposed to browser via NEXT_PUBLIC_ prefix)
function getClientEnv() {
    return {
        FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };
}

// Validate required server environment variables
function validateServerEnv() {
    const env = getServerEnv();

    if (!env.ELEVENLABS_API_KEY) {
        console.warn('Warning: ELEVENLABS_API_KEY is not set');
    }

    if (!env.FIREBASE_PROJECT_ID) {
        console.warn('Warning: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
    }

    return env;
}

// Validate required client environment variables
function validateClientEnv() {
    const env = getClientEnv();

    const requiredVars = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_PROJECT_ID',
    ];

    const missing = requiredVars.filter(key => !env[key as keyof typeof env]);

    if (missing.length > 0) {
        console.warn(`Warning: Missing client environment variables: ${missing.join(', ')}`);
    }

    return env;
}

// Export validated environment variables
export const serverEnv = validateServerEnv();
export const clientEnv = validateClientEnv();

// Type-safe exports
export type ServerEnv = ReturnType<typeof getServerEnv>;
export type ClientEnv = ReturnType<typeof getClientEnv>;
