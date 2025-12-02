'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/firebase';

export function FirebaseAnalytics() {
    useEffect(() => {
        if (analytics) {
            console.log('Firebase Analytics initialized successfully');
        }
    }, []);

    return null;
}
