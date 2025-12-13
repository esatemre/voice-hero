import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '../../app/api/projects/[projectId]/pages/[pageId]/route';

const mockProjectId = 'test-project-id';
const mockPageId = 'test-page-id';

const mockPage = {
    id: mockPageId,
    projectId: mockProjectId,
    url: 'https://example.com/page',
    path: '/page',
    title: 'Test Page',
    status: 'scraped',
    lastScrapedAt: Date.now(),
    voiceEnabled: true,
    lastContentHash: null,
};

let mockPageData: typeof mockPage | null = mockPage;

const mockPageDocGet = vi.fn(() => ({
    exists: !!mockPageData,
    data: () => mockPageData,
}));

const mockPageDocUpdate = vi.fn();

const mockPageDoc = vi.fn(() => ({
    get: mockPageDocGet,
    update: mockPageDocUpdate,
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

const mockFirestore = {
    collection: mockProjectsCollection,
};

vi.mock('@/lib/db', () => ({
    getDb: vi.fn(() => mockFirestore),
}));

describe('PATCH /api/projects/[projectId]/pages/[pageId]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPageData = { ...mockPage };
    });

    it('should update voiceEnabled to false', async () => {
        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceEnabled: false }),
            }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.voiceEnabled).toBe(false);
        expect(mockPageDocUpdate).toHaveBeenCalledWith({ voiceEnabled: false });
    });

    it('should update voiceEnabled to true', async () => {
        mockPageData = { ...mockPage, voiceEnabled: false };

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceEnabled: true }),
            }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.voiceEnabled).toBe(true);
        expect(mockPageDocUpdate).toHaveBeenCalledWith({ voiceEnabled: true });
    });

    it('should return 404 if page not found', async () => {
        mockPageData = null;

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceEnabled: false }),
            }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Page not found');
    });

    it('should return 400 if voiceEnabled is not a boolean', async () => {
        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceEnabled: 'not-a-boolean' }),
            }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await PATCH(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('voiceEnabled must be a boolean');
    });
});
