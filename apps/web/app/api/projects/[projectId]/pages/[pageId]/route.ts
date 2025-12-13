import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Page } from '@/lib/types';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ projectId: string; pageId: string }> }
) {
    try {
        const { projectId, pageId } = await params;
        const body = await request.json();
        const { voiceEnabled } = body;

        if (typeof voiceEnabled !== 'boolean') {
            return NextResponse.json(
                { error: 'voiceEnabled must be a boolean' },
                { status: 400 }
            );
        }

        const db = getDb();
        const pageRef = db.collection('projects').doc(projectId).collection('pages').doc(pageId);
        const pageDoc = await pageRef.get();

        if (!pageDoc.exists) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        await pageRef.update({ voiceEnabled });

        const updatedPage: Page = {
            ...(pageDoc.data() as Page),
            voiceEnabled,
        };

        return NextResponse.json(updatedPage);
    } catch (error) {
        console.error('Error updating page:', error);
        return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }
}
