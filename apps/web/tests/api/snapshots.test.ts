import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../app/api/projects/[projectId]/pages/[pageId]/snapshots/latest/route';
import { POST } from '../../app/api/projects/[projectId]/pages/[pageId]/snapshots/route';
import { ContentSnapshot } from '../../lib/types';

const mockProjectId = 'test-project-id';
const mockPageId = 'test-page-id';
const mockSnapshotId = 'mock-snapshot-id';

const mockSnapshot: ContentSnapshot = {
    id: mockSnapshotId,
    pageId: mockPageId,
    createdAt: Date.now(),
    raw: {
        title: 'Test Title',
        headline: 'Test Headline',
        description: 'Test Description',
        bullets: ['Bullet 1', 'Bullet 2'],
        ctaText: ['Buy Now'],
    },
    processed: {
        description: 'AI Description',
        summary: 'AI Summary',
        details: 'AI Details',
    },
    contentHash: 'abc123',
};

const mockPage = {
    id: mockPageId,
    projectId: mockProjectId,
    url: 'https://example.com/page',
    path: '/page',
    title: 'Test Page',
    status: 'scraped',
    lastScrapedAt: Date.now(),
    voiceEnabled: false,
    lastContentHash: null,
};

let mockSnapshotData: ContentSnapshot | null = null;
let mockPageData: typeof mockPage | null = mockPage;

const mockSnapshotDocGet = vi.fn(() => ({
    exists: !!mockSnapshotData,
    data: () => mockSnapshotData,
    id: mockSnapshotId,
}));

const mockSnapshotDocSet = vi.fn();

const mockSnapshotDocRef = vi.fn(() => ({
    id: mockSnapshotId,
    get: mockSnapshotDocGet,
    set: mockSnapshotDocSet,
}));

const mockSnapshotsOrderBy = vi.fn(() => ({
    limit: vi.fn(() => ({
        get: vi.fn(() => ({
            empty: !mockSnapshotData,
            docs: mockSnapshotData ? [{ data: () => mockSnapshotData, id: mockSnapshotId }] : [],
        })),
    })),
}));

const mockSnapshotsCollection = vi.fn(() => ({
    doc: mockSnapshotDocRef,
    orderBy: mockSnapshotsOrderBy,
}));

const mockPageDocGet = vi.fn(() => ({
    exists: !!mockPageData,
    data: () => mockPageData,
}));

const mockPageDocUpdate = vi.fn();

const mockPageDoc = vi.fn(() => ({
    get: mockPageDocGet,
    update: mockPageDocUpdate,
    collection: mockSnapshotsCollection,
}));

const mockPagesCollection = vi.fn(() => ({
    doc: mockPageDoc,
}));

const mockProjectDoc = vi.fn(() => ({
    collection: mockPagesCollection,
}));

const mockProjectsCollection = vi.fn(() => ({
    doc: mockProjectDoc,
}));

const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockBatch = vi.fn(() => ({
    set: mockBatchSet,
    commit: mockBatchCommit,
}));

const mockFirestore = {
    collection: mockProjectsCollection,
    batch: mockBatch,
};

vi.mock('@/lib/db', () => ({
    getDb: vi.fn(() => mockFirestore),
}));

vi.mock('@/lib/scraper', () => ({
    scrapeUrl: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
    processScrapedContent: vi.fn(),
}));

import { scrapeUrl } from '@/lib/scraper';
import { processScrapedContent } from '@/lib/gemini';

describe('GET /api/projects/[projectId]/pages/[pageId]/snapshots/latest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSnapshotData = null;
        mockPageData = mockPage;
    });

    it('should return the latest snapshot', async () => {
        mockSnapshotData = mockSnapshot;

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/snapshots/latest`
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockSnapshot);
    });

    it('should return 404 if page not found', async () => {
        mockPageData = null;

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/snapshots/latest`
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Page not found');
    });

    it('should return 404 if no snapshot exists', async () => {
        mockSnapshotData = null;

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/snapshots/latest`
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('No snapshot found');
    });
});

describe('POST /api/projects/[projectId]/pages/[pageId]/snapshots', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSnapshotData = null;
        mockPageData = mockPage;
    });

    it('should create a new snapshot by rescraping', async () => {
        const mockRaw = {
            title: 'New Title',
            headline: 'New Headline',
            description: 'New Description',
            bullets: ['New Bullet'],
            ctaText: ['Sign Up'],
        };

        const mockProcessed = {
            description: 'New AI Description',
            summary: 'New AI Summary',
            details: 'New AI Details',
        };

        (scrapeUrl as ReturnType<typeof vi.fn>).mockResolvedValue(mockRaw);
        (processScrapedContent as ReturnType<typeof vi.fn>).mockResolvedValue(mockProcessed);

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/snapshots`,
            { method: 'POST' }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.raw).toEqual(mockRaw);
        expect(data.processed).toEqual(mockProcessed);
        expect(data.pageId).toBe(mockPageId);
        expect(data.id).toBeDefined();
        expect(data.createdAt).toBeDefined();
        expect(data.contentHash).toBeDefined();
    });

    it('should return 404 if page not found', async () => {
        mockPageData = null;

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/snapshots`,
            { method: 'POST' }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Page not found');
    });

    it('should fallback when AI processing fails', async () => {
        const mockRaw = {
            title: 'Test Title',
            headline: 'Test Headline',
            description: 'Test Description',
            bullets: ['Bullet 1'],
            ctaText: ['Buy'],
        };

        (scrapeUrl as ReturnType<typeof vi.fn>).mockResolvedValue(mockRaw);
        (processScrapedContent as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('AI Error'));

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/snapshots`,
            { method: 'POST' }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.raw).toEqual(mockRaw);
        expect(data.processed.description).toContain('Test Headline');
        expect(data.processed.summary).toBe('Test Description');
    });

    it('should return 500 if scraping fails', async () => {
        (scrapeUrl as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Scrape failed'));

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/snapshots`,
            { method: 'POST' }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to scrape page');
    });
});
