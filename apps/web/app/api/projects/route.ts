import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Project, Segment } from '@/lib/types';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, baseUrl, description, tone, language, aiSummary, aiDetails } = body;

        const db = getDb();
        const projectRef = db.collection('projects').doc();
        const projectId = projectRef.id;

        const project: Project = {
            id: projectId,
            ownerId: 'demo-user', // Hardcoded for MVP
            name,
            baseUrl,
            description,
            tone,
            language,
            aiSummary,
            aiDetails,
            createdAt: Date.now(),
        };

        await projectRef.set(project);

        // Create default segments in project subcollection
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
        defaultSegments.forEach(segment => {
            const docRef = projectRef.collection('segments').doc();
            batch.set(docRef, { ...segment, id: docRef.id });
        });

        await batch.commit();

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
