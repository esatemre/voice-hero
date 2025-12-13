import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper';
import { processScrapedContent } from '@/lib/gemini';
import { ContentSnapshot, ContentSnapshotProcessed, Page } from '@/lib/types';
import { createHash } from 'crypto';

function generateContentHash(raw: ContentSnapshot['raw']): string {
    const content = JSON.stringify(raw);
    return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function createFallbackProcessed(raw: ContentSnapshot['raw']): ContentSnapshotProcessed {
    return {
        description: raw.headline || raw.title,
        summary: raw.description,
        details: raw.bullets.join('\n'),
    };
}

export async function POST(
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

        const page = pageDoc.data() as Page;

        let raw: ContentSnapshot['raw'];
        try {
            raw = await scrapeUrl(page.url);
        } catch (error) {
            console.error('Scraping error:', error);
            return NextResponse.json({ error: 'Failed to scrape page' }, { status: 500 });
        }

        let processed: ContentSnapshotProcessed;
        try {
            processed = await processScrapedContent(raw);
        } catch (error) {
            console.error('AI processing error, using fallback:', error);
            processed = createFallbackProcessed(raw);
        }

        const snapshotsRef = pageRef.collection('snapshots');
        const snapshotDocRef = snapshotsRef.doc();
        const contentHash = generateContentHash(raw);
        const now = Date.now();

        const snapshot: ContentSnapshot = {
            id: snapshotDocRef.id,
            pageId,
            createdAt: now,
            raw,
            processed,
            contentHash,
        };

        await snapshotDocRef.set(snapshot);

        await pageRef.update({
            lastScrapedAt: now,
            lastContentHash: contentHash,
            status: 'scraped',
            title: raw.title || page.title,
        });

        return NextResponse.json(snapshot, { status: 201 });
    } catch (error) {
        console.error('Error creating snapshot:', error);
        return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
    }
}

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
        const snapshotDocs = await snapshotsRef.orderBy('createdAt', 'desc').get();
        const snapshots = snapshotDocs.docs.map((doc) => doc.data() as ContentSnapshot);

        return NextResponse.json(snapshots);
    } catch (error) {
        console.error('Error fetching snapshots:', error);
        return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
    }
}
