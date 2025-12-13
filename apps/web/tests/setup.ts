import '@testing-library/jest-dom';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.clear !== 'function') {
    const store = new Map<string, string>();
    globalThis.localStorage = {
        getItem: (key: string) => (store.has(key) ? store.get(key) || null : null),
        setItem: (key: string, value: string) => {
            store.set(key, String(value));
        },
        removeItem: (key: string) => {
            store.delete(key);
        },
        clear: () => {
            store.clear();
        },
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        get length() {
            return store.size;
        },
    } as Storage;
}

// Mock console.error to keep test output clean (optional, can be removed if needed)
// console.error = vi.fn();
