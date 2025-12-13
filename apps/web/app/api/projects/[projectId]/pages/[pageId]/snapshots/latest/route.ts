import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ContentSnapshot } from '@/lib/types';

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

        const snapshotsRef = pageRef.collection('snapshots');
        const latestQuery = await snapshotsRef.orderBy('createdAt', 'desc').limit(1).get();

        if (latestQuery.empty) {
            return NextResponse.json({ error: 'No snapshot found' }, { status: 404 });
        }

        const latestDoc = latestQuery.docs[0];
        const snapshot: ContentSnapshot = latestDoc.data() as ContentSnapshot;

        return NextResponse.json(snapshot);
    } catch (error) {
        console.error('Error fetching latest snapshot:', error);
        return NextResponse.json({ error: 'Failed to fetch snapshot' }, { status: 500 });
    }
}
