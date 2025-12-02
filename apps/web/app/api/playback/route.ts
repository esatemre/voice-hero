import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Segment } from '@/lib/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const lang = searchParams.get('lang');
    const isReturning = searchParams.get('isReturning') === 'true';
    const utmSource = searchParams.get('utmSource');

    if (!siteId) {
        return NextResponse.json({ error: 'Missing siteId' }, { status: 400 });
    }

    try {
        const db = getDb();
        const segmentsRef = db.collection('projects').doc(siteId).collection('segments');
        const snapshot = await segmentsRef.get();

        if (snapshot.empty) {
            return NextResponse.json({ error: 'No segments found' }, { status: 404 });
        }

        const segments = snapshot.docs.map(doc => doc.data() as Segment);

        // Logic to pick the best segment
        let selectedSegment: Segment | undefined;

        // 1. Check for UTM source match
        if (utmSource) {
            selectedSegment = segments.find(s => s.type === 'utm_source' && s.conditionValue === utmSource);
        }

        // 2. Check for Returning Visitor
        if (!selectedSegment && isReturning) {
            selectedSegment = segments.find(s => s.type === 'returning_visitor');
        }

        // 3. Check for Language
        if (!selectedSegment && lang) {
            selectedSegment = segments.find(s => s.type === 'language' && lang.startsWith(s.conditionValue || ''));
        }

        // 4. Fallback to New Visitor (Default)
        if (!selectedSegment) {
            selectedSegment = segments.find(s => s.type === 'new_visitor');
        }

        // 5. Absolute Fallback
        if (!selectedSegment && segments.length > 0) {
            selectedSegment = segments[0];
        }

        if (!selectedSegment || !selectedSegment.audioUrl) {
            return NextResponse.json({ error: 'No matching segment with audio found' }, { status: 404 });
        }

        return NextResponse.json({
            audioUrl: selectedSegment.audioUrl,
            transcript: selectedSegment.scriptContent,
            label: 'Overview', // Could be dynamic
        });

    } catch (error) {
        console.error('Error fetching playback:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
