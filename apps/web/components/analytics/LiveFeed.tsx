'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

import { Timestamp } from 'firebase/firestore';

interface AnalyticsEvent {
    id: string;
    eventType: string;
    timestamp: Timestamp | Date | number;
    segmentType: string;
    audioVersion: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>;
}

export default function LiveFeed({ projectId }: { projectId: string }) {
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;

        const q = query(
            collection(db, 'projects', projectId, 'analytics'),
            orderBy('timestamp', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newEvents = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as AnalyticsEvent[];

            setEvents(newEvents);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    if (loading) {
        return <div className="text-sm text-slate-500">Connecting to live feed...</div>;
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                    Live Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {events.map((event) => (
                        <div key={event.id} className="flex items-start gap-3 text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                            <div className="bg-slate-100 p-1.5 rounded-full mt-0.5">
                                {getIconForEvent(event.eventType)}
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">
                                    {formatEventName(event.eventType)}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {formatTime(event.timestamp)} • {event.segmentType}
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="text-center text-slate-400 py-4">
                            No recent activity
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function getIconForEvent(type: string) {
    switch (type) {
        case 'audio.play': return '▶️';
        case 'audio.complete': return '✅';
        case 'conversation.start': return '🎤';
        case 'ai.response': return '🤖';
        default: return '📝';
    }
}

function formatEventName(type: string) {
    return type.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatTime(timestamp: Timestamp | Date | number) {
    if (!timestamp) return '';
    // Handle Firestore Timestamp or Date or number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const date = (timestamp as any).toDate ? (timestamp as any).toDate() : new Date(timestamp as number | Date | string);
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    }).format(date);
}
