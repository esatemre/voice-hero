'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/firebase';

export function FirebaseAnalytics() {
    useEffect(() => {
        if (!analytics) {
            console.error('Analytics not initialized');
        }
    }, []);

    return null;
}
