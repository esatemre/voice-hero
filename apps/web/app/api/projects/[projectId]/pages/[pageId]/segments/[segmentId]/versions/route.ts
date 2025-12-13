import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ScriptVersion } from '@/lib/types';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string; pageId: string; segmentId: string }> }
) {
    try {
        const { projectId, pageId, segmentId } = await params;
        const db = getDb();

        const segmentRef = db
            .collection('projects')
            .doc(projectId)
            .collection('pages')
            .doc(pageId)
            .collection('segments')
            .doc(segmentId);

        const segmentDoc = await segmentRef.get();
        if (!segmentDoc.exists) {
            return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
        }

        const versionsSnapshot = await segmentRef
            .collection('scriptVersions')
            .orderBy('createdAt', 'desc')
            .get();

        const versions = versionsSnapshot.docs.map((doc) => {
            const data = doc.data() as ScriptVersion;
            return {
                ...data,
                id: data.id || doc.id,
            };
        });

        return NextResponse.json(versions);
    } catch (error) {
        console.error('Error fetching script versions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch script versions' },
            { status: 500 },
        );
    }
}
