import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getDb } from '@/lib/db';
import { discoverPages } from '@/lib/scraper';
import { Page, Project } from '@/lib/types';
import { maybeSendOnboardingEmail } from '@/lib/onboarding-email';

interface PageInput {
    url: string;
    title?: string;
}

function buildPageId(url: string) {
    return createHash('sha1').update(url).digest('hex');
}

function normalizeUrl(input: string, baseUrl: string) {
    try {
        const parsed = new URL(input, baseUrl);
        parsed.hash = '';
        const normalizedPath = parsed.pathname.endsWith('/') && parsed.pathname !== '/'
            ? parsed.pathname.slice(0, -1)
            : parsed.pathname;
        return new URL(`${parsed.origin}${normalizedPath}`);
    } catch (error) {
        return null;
    }
}

async function upsertPages(projectId: string, pages: PageInput[]) {
    const db = getDb();
    const pagesRef = db.collection('projects').doc(projectId).collection('pages');
    const existingSnapshot = await pagesRef.get();
    const existingByUrl = new Map<string, Page>();

    existingSnapshot.forEach((doc) => {
        const data = doc.data() as Page;
        existingByUrl.set(data.url, {
            ...data,
            id: data.id || doc.id,
        });
    });

    const results: Page[] = [];
    let createdCount = 0;
    if (pages.length === 0) {
        return { pages: results, existingCount: existingSnapshot.size, createdCount };
    }

    const batch = db.batch();

    pages.forEach((page) => {
        const parsed = new URL(page.url);
        const existing = existingByUrl.get(page.url);
        const id = existing?.id || buildPageId(page.url);
        const title = page.title || existing?.title || parsed.pathname || page.url;

        const pageData: Page = {
            id,
            projectId,
            url: page.url,
            path: parsed.pathname || '/',
            title,
            status: existing?.status ?? 'discovered',
            lastScrapedAt: existing?.lastScrapedAt ?? null,
            voiceEnabled: existing?.voiceEnabled ?? true,
            lastContentHash: existing?.lastContentHash ?? null,
        };

        if (!existing) {
            createdCount += 1;
        }
        batch.set(pagesRef.doc(id), pageData, { merge: true });
        results.push(pageData);
    });

    await batch.commit();

    return { pages: results, existingCount: existingSnapshot.size, createdCount };
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const db = getDb();
        const snapshot = await db
            .collection('projects')
            .doc(projectId)
            .collection('pages')
            .get();

        const pages = snapshot.docs.map((doc) => {
            const data = doc.data() as Page;
            return {
                ...data,
                id: data.id || doc.id,
            };
        });

        pages.sort((a, b) => a.url.localeCompare(b.url));

        return NextResponse.json(pages);
    } catch (error) {
        console.error('Error fetching pages:', error);
        return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        let body: { url?: string; mode?: string; limit?: number } = {};

        try {
            body = await request.json();
        } catch (error) {
            body = {};
        }

        const db = getDb();
        const projectDoc = await db.collection('projects').doc(projectId).get();

        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projectDoc.data() as Project;
        const baseUrl = project.baseUrl;

        if (body.url) {
            const normalized = normalizeUrl(body.url, baseUrl);
            if (!normalized || normalized.origin !== new URL(baseUrl).origin) {
                return NextResponse.json({ error: 'URL must be on the project domain' }, { status: 400 });
            }

            const { pages, existingCount, createdCount } = await upsertPages(projectId, [{ url: normalized.toString() }]);
            if (existingCount === 0 && createdCount > 0) {
                maybeSendOnboardingEmail(projectId, 'page-discovered').catch((error) => {
                    console.error('Failed to send page discovery email:', error);
                });
            }
            return NextResponse.json({ pages });
        }

        const limit = typeof body.limit === 'number' ? Math.min(body.limit, 50) : 50;
        const discovered = await discoverPages(baseUrl, limit);
        const { pages, existingCount, createdCount } = await upsertPages(projectId, discovered);
        if (existingCount === 0 && createdCount > 0) {
            maybeSendOnboardingEmail(projectId, 'page-discovered').catch((error) => {
                console.error('Failed to send page discovery email:', error);
            });
        }

        return NextResponse.json({ pages });
    } catch (error) {
        console.error('Error discovering pages:', error);
        return NextResponse.json({ error: 'Failed to discover pages' }, { status: 500 });
    }
}
