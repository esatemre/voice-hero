import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PageSegment, ScriptVersion } from '@/lib/types';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ projectId: string; pageId: string; segmentId: string }> }
) {
    try {
        const { projectId, pageId, segmentId } = await params;
        const body = await request.json();
        const { scriptContent, voiceId, audioUrl, lastContentSnapshotId, lastContentHash } = body;

        if (typeof scriptContent !== 'string' || scriptContent.trim().length === 0) {
            return NextResponse.json({ error: 'scriptContent is required' }, { status: 400 });
        }

        const db = getDb();

        const pageRef = db.collection('projects').doc(projectId).collection('pages').doc(pageId);
        const pageDoc = await pageRef.get();

        if (!pageDoc.exists) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        const segmentRef = pageRef.collection('segments').doc(segmentId);
        const segmentDoc = await segmentRef.get();

        if (!segmentDoc.exists) {
            return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
        }

        const existingSegment = segmentDoc.data() as PageSegment;

        const updateData: Partial<PageSegment> = {
            scriptContent,
            version: (existingSegment.version || 0) + 1,
        };

        if (voiceId !== undefined) updateData.voiceId = voiceId;
        if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
        if (lastContentSnapshotId) updateData.lastContentSnapshotId = lastContentSnapshotId;
        if (lastContentHash) updateData.lastContentHash = lastContentHash;

        await segmentRef.update(updateData);

        const versionsRef = segmentRef.collection('scriptVersions');
        const versionDocRef = versionsRef.doc();
        const versionEntry: ScriptVersion = {
            id: versionDocRef.id,
            segmentId,
            scriptContent,
            voiceId: updateData.voiceId ?? existingSegment.voiceId,
            createdAt: Date.now(),
            source: typeof body.source === 'string' ? body.source : 'manual',
            contentSnapshotId: lastContentSnapshotId || existingSegment.lastContentSnapshotId,
        };

        await versionDocRef.set(versionEntry);

        const updatedSegment: PageSegment = {
            ...existingSegment,
            ...updateData,
        };

        return NextResponse.json(updatedSegment);
    } catch (error) {
        console.error('Error updating page segment:', error);
        return NextResponse.json({ error: 'Failed to update segment' }, { status: 500 });
    }
}
