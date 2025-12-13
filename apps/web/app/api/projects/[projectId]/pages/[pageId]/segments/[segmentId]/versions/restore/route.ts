import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PageSegment, ScriptVersion } from '@/lib/types';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ projectId: string; pageId: string; segmentId: string }> }
) {
    try {
        const { projectId, pageId, segmentId } = await params;
        const body = await request.json();
        const { versionId } = body;

        if (!versionId) {
            return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
        }

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

        const versionsRef = segmentRef.collection('scriptVersions');
        const versionDoc = await versionsRef.doc(versionId).get();

        if (!versionDoc.exists) {
            return NextResponse.json({ error: 'Version not found' }, { status: 404 });
        }

        const versionData = versionDoc.data() as ScriptVersion;
        const existingSegment = segmentDoc.data() as PageSegment;

        const updateData: Partial<PageSegment> = {
            scriptContent: versionData.scriptContent,
            version: (existingSegment.version || 0) + 1,
        };

        if (versionData.voiceId !== undefined) {
            updateData.voiceId = versionData.voiceId;
        }
        if (versionData.contentSnapshotId) {
            updateData.lastContentSnapshotId = versionData.contentSnapshotId;
        }

        await segmentRef.update(updateData);

        const restoreDocRef = versionsRef.doc();
        const restoreEntry: ScriptVersion = {
            id: restoreDocRef.id,
            segmentId,
            scriptContent: versionData.scriptContent,
            voiceId: versionData.voiceId,
            createdAt: Date.now(),
            source: 'restore',
            contentSnapshotId: versionData.contentSnapshotId,
        };

        await restoreDocRef.set(restoreEntry);

        const updatedSegment: PageSegment = {
            ...existingSegment,
            ...updateData,
        };

        return NextResponse.json(updatedSegment);
    } catch (error) {
        console.error('Error restoring script version:', error);
        return NextResponse.json(
            { error: 'Failed to restore script version' },
            { status: 500 },
        );
    }
}
