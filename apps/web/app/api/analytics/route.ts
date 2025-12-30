import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { maybeSendOnboardingEmail } from '@/lib/onboarding-email';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const jsonWithCors = (data: unknown, init?: ResponseInit) =>
    NextResponse.json(data, {
        ...init,
        headers: {
            ...corsHeaders,
            ...(init?.headers ?? {}),
        },
    });

interface AnalyticsEvent {
    sessionId: string;
    eventType: string;
    timestamp: number;
    projectId: string;
    segmentType: string;
    segmentId: string;
    audioVersion: string;
    scriptVersion: string;
    audioUrl?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userContext: Record<string, any>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateEvent(event: any): event is AnalyticsEvent {
    if (!event) return false;

    // Check required string fields are present and not empty
    const requiredStrings = ['sessionId', 'eventType', 'projectId', 'segmentType', 'segmentId', 'audioVersion', 'scriptVersion'];
    for (const field of requiredStrings) {
        if (typeof event[field] !== 'string' || event[field].trim() === '') {
            return false;
        }
    }

    // Check timestamp is a valid number and reasonable (not in far future/past)
    if (typeof event.timestamp !== 'number' || isNaN(event.timestamp)) {
        return false;
    }

    // Timestamp sanity check: between 2024 and 1 year in future
    const now = Date.now();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (event.timestamp < 1704067200000 || event.timestamp > now + oneYear) { // Jan 1 2024
        return false;
    }

    // Check objects
    if (typeof event.metadata !== 'object' || event.metadata === null) return false;
    if (typeof event.userContext !== 'object' || event.userContext === null) return false;

    return true;
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const db = getDb();

        // Handle single event
        if (body.event) {
            const event = body.event;

            if (!validateEvent(event)) {
                return jsonWithCors(
                    { error: 'Invalid event data. Missing required fields.' },
                    { status: 400 }
                );
            }

            // Store in Firestore
            const analyticsRef = db
                .collection('projects')
                .doc(event.projectId)
                .collection('analytics');

            await analyticsRef.add({
                ...event,
                timestamp: new Date(event.timestamp),
                createdAt: new Date(),
            });

            if (event.eventType === 'audio.play') {
                maybeSendOnboardingEmail(event.projectId, 'go-live').catch((error) => {
                    console.error('Failed to send go-live email:', error);
                });
            }

            return jsonWithCors({ success: true });
        }

        // Handle batched events
        if (body.events && Array.isArray(body.events)) {
            const events = body.events;

            // Validate all events
            for (const event of events) {
                if (!validateEvent(event)) {
                    return jsonWithCors(
                        { error: 'Invalid event data in batch. Missing required fields.' },
                        { status: 400 }
                    );
                }
            }

            // Store all events using atomic batch
            const batch = db.batch();

            events.forEach((event: AnalyticsEvent) => {
                const analyticsRef = db
                    .collection('projects')
                    .doc(event.projectId)
                    .collection('analytics')
                    .doc(); // Auto-generate ID

                batch.set(analyticsRef, {
                    ...event,
                    timestamp: new Date(event.timestamp),
                    createdAt: new Date(),
                });
            });

            await batch.commit();

            const projectIds = new Set<string>();
            events.forEach((event: AnalyticsEvent) => {
                if (event.eventType === 'audio.play') {
                    projectIds.add(event.projectId);
                }
            });
            projectIds.forEach((projectId) => {
                maybeSendOnboardingEmail(projectId, 'go-live').catch((error) => {
                    console.error('Failed to send go-live email:', error);
                });
            });

            return jsonWithCors({
                success: true,
                count: events.length,
            });
        }

        return jsonWithCors(
            { error: 'Request must contain either "event" or "events" field' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Analytics error:', error);
        return jsonWithCors(
            { error: 'Failed to store analytics event' },
            { status: 500 }
        );
    }
}
