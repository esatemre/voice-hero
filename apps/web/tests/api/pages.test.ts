import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../../app/api/projects/[projectId]/pages/route';

const mockPagesGet = vi.fn();
const mockProjectGet = vi.fn();
const mockPagesDoc = vi.fn((id?: string) => ({ id: id || 'generated-id' }));
const mockPagesCollection = vi.fn(() => ({
    doc: mockPagesDoc,
    get: mockPagesGet,
}));
const mockProjectDoc = vi.fn(() => ({
    get: mockProjectGet,
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
    discoverPages: vi.fn(),
}));

import { discoverPages } from '@/lib/scraper';

describe('Projects pages API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBatchCommit.mockResolvedValue(undefined);
    });

    it('should list pages for a project', async () => {
        mockPagesGet.mockResolvedValue({
            docs: [
                {
                    id: 'page-1',
                    data: () => ({
                        id: 'page-1',
                        projectId: 'proj-1',
                        url: 'https://example.com',
                        path: '/',
                        title: 'Home',
                        status: 'discovered',
                        lastScrapedAt: null,
                        voiceEnabled: true,
                        lastContentHash: null,
                    }),
                },
            ],
            size: 1,
            forEach: (cb: (doc: { id: string; data: () => unknown }) => void) => {
                cb({
                    id: 'page-1',
                    data: () => ({
                        id: 'page-1',
                        projectId: 'proj-1',
                        url: 'https://example.com',
                        path: '/',
                        title: 'Home',
                        status: 'discovered',
                        lastScrapedAt: null,
                        voiceEnabled: true,
                        lastContentHash: null,
                    }),
                });
            },
        });

        const params = Promise.resolve({ projectId: 'proj-1' });
        const response = await GET(new Request('http://localhost'), { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(1);
        expect(data[0]).toEqual(expect.objectContaining({
            id: 'page-1',
            url: 'https://example.com',
        }));
    });

    it('should discover pages for a project', async () => {
        mockProjectGet.mockResolvedValue({
            exists: true,
            data: () => ({ baseUrl: 'https://example.com' }),
        });
        mockPagesGet.mockResolvedValue({ docs: [], forEach: () => {}, size: 0 });
        (discoverPages as unknown as vi.Mock).mockResolvedValue([
            { url: 'https://example.com', title: 'Home' },
            { url: 'https://example.com/pricing', title: 'Pricing' },
        ]);

        const request = new Request('http://localhost/api/projects/proj-1/pages', {
            method: 'POST',
            body: JSON.stringify({ mode: 'discover' }),
        });

        const params = Promise.resolve({ projectId: 'proj-1' });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(discoverPages).toHaveBeenCalledWith('https://example.com', 50);
        expect(mockBatchSet).toHaveBeenCalledTimes(2);
        expect(data.pages).toHaveLength(2);
    });

    it('should add a page manually', async () => {
        mockProjectGet.mockResolvedValue({
            exists: true,
            data: () => ({ baseUrl: 'https://example.com' }),
        });
        mockPagesGet.mockResolvedValue({ docs: [], forEach: () => {}, size: 0 });

        const request = new Request('http://localhost/api/projects/proj-1/pages', {
            method: 'POST',
            body: JSON.stringify({ url: '/pricing' }),
        });

        const params = Promise.resolve({ projectId: 'proj-1' });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(discoverPages).not.toHaveBeenCalled();
        expect(mockBatchSet).toHaveBeenCalledTimes(1);
        expect(data.pages).toHaveLength(1);
    });
});
