import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Segment } from '@/lib/types';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const db = getDb();

        const defaultSegments: Omit<Segment, 'id'>[] = [
            {
                projectId,
                type: 'new_visitor',
                scriptContent: 'Welcome to our site! Check out our amazing features.',
                createdAt: Date.now(),
            },
            {
                projectId,
                type: 'returning_visitor',
                scriptContent: 'Welcome back! Here is what is new since your last visit.',
                createdAt: Date.now(),
            },
            {
                projectId,
                type: 'utm_source',
                conditionValue: 'ads',
                scriptContent: 'Thanks for clicking our ad! Here is the special offer we promised.',
                createdAt: Date.now(),
            },
        ];

        const batch = db.batch();
        const createdSegments: Segment[] = [];

        defaultSegments.forEach(segment => {
            const docRef = db.collection('projects').doc(projectId).collection('segments').doc();
            const segmentWithId = { ...segment, id: docRef.id };
            batch.set(docRef, segmentWithId);
            createdSegments.push(segmentWithId);
        });

        await batch.commit();

        return NextResponse.json(createdSegments);
    } catch (error) {
        console.error('Error creating segments:', error);
        return NextResponse.json({ error: 'Failed to create segments' }, { status: 500 });
    }
}
