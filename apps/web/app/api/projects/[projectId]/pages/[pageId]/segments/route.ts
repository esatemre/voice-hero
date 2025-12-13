import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PageSegment, SegmentType } from '@/lib/types';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string; pageId: string }> }
) {
    try {
        const { projectId, pageId } = await params;
        const db = getDb();

        const pageRef = db.collection('projects').doc(projectId).collection('pages').doc(pageId);
        const pageDoc = await pageRef.get();

        if (!pageDoc.exists) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        const segmentsSnapshot = await pageRef.collection('segments').get();

        const segments: PageSegment[] = segmentsSnapshot.docs.map(doc => doc.data() as PageSegment);

        return NextResponse.json(segments);
    } catch (error) {
        console.error('Error fetching page segments:', error);
        return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ projectId: string; pageId: string }> }
) {
    try {
        const { projectId, pageId } = await params;
        const body = await request.json();
        const { type, scriptContent, conditionValue, voiceId } = body;

        if (!type) {
            return NextResponse.json({ error: 'type is required' }, { status: 400 });
        }

        const db = getDb();

        const pageRef = db.collection('projects').doc(projectId).collection('pages').doc(pageId);
        const pageDoc = await pageRef.get();

        if (!pageDoc.exists) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        const segmentsRef = pageRef.collection('segments');
        const segmentDocRef = segmentsRef.doc();

        const segment: PageSegment = {
            id: segmentDocRef.id,
            pageId,
            type: type as SegmentType,
            scriptContent: scriptContent || '',
            version: 1,
            createdAt: Date.now(),
            ...(conditionValue && { conditionValue }),
            ...(voiceId && { voiceId }),
        };

        await segmentDocRef.set(segment);

        return NextResponse.json(segment, { status: 201 });
    } catch (error) {
        console.error('Error creating page segment:', error);
        return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
    }
}
