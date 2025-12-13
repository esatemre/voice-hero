import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../../app/api/projects/[projectId]/pages/[pageId]/segments/route';
import { PUT } from '../../app/api/projects/[projectId]/pages/[pageId]/segments/[segmentId]/route';
import { PageSegment } from '../../lib/types';

const mockProjectId = 'test-project-id';
const mockPageId = 'test-page-id';
const mockSegmentId = 'test-segment-id';

const mockPageSegment: PageSegment = {
    id: mockSegmentId,
    pageId: mockPageId,
    type: 'new_visitor',
    scriptContent: 'Welcome to this page!',
    version: 1,
    createdAt: Date.now(),
};

const mockPage = {
    id: mockPageId,
    projectId: mockProjectId,
    url: 'https://example.com/page',
    path: '/page',
    title: 'Test Page',
    status: 'scraped',
    voiceEnabled: true,
};

let mockPageData: typeof mockPage | null = mockPage;
let mockSegmentsData: PageSegment[] = [];

const mockSegmentDocUpdate = vi.fn();
const mockVersionDocSet = vi.fn();
const mockVersionDoc = vi.fn(() => ({
    id: 'version-1',
    set: mockVersionDocSet,
}));
const mockVersionsCollection = vi.fn(() => ({
    doc: mockVersionDoc,
}));
const mockSegmentDocGet = vi.fn(() => ({
    exists: mockSegmentsData.some(s => s.id === mockSegmentId),
    data: () => mockSegmentsData.find(s => s.id === mockSegmentId),
}));

const mockSegmentDoc = vi.fn(() => ({
    id: mockSegmentId,
    update: mockSegmentDocUpdate,
    get: mockSegmentDocGet,
    set: vi.fn(),
    collection: mockVersionsCollection,
}));

const mockSegmentsGet = vi.fn(() => ({
    empty: mockSegmentsData.length === 0,
    docs: mockSegmentsData.map(s => ({ data: () => s, id: s.id })),
}));

const mockSegmentsCollection = vi.fn(() => ({
    doc: mockSegmentDoc,
    get: mockSegmentsGet,
}));

const mockPageDocGet = vi.fn(() => ({
    exists: !!mockPageData,
    data: () => mockPageData,
}));

const mockPageDoc = vi.fn(() => ({
    get: mockPageDocGet,
    collection: mockSegmentsCollection,
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

describe('GET /api/projects/[projectId]/pages/[pageId]/segments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPageData = { ...mockPage };
        mockSegmentsData = [];
    });

    it('should return empty array when no page segments exist', async () => {
        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments`
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([]);
    });

    it('should return page segments when they exist', async () => {
        mockSegmentsData = [mockPageSegment];

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments`
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(1);
        expect(data[0].type).toBe('new_visitor');
    });

    it('should return 404 if page not found', async () => {
        mockPageData = null;

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments`
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Page not found');
    });
});

describe('POST /api/projects/[projectId]/pages/[pageId]/segments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPageData = { ...mockPage };
        mockSegmentsData = [];
    });

    it('should create a new page segment', async () => {
        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'new_visitor',
                    scriptContent: 'Hello from this page!',
                }),
            }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.type).toBe('new_visitor');
        expect(data.scriptContent).toBe('Hello from this page!');
        expect(data.pageId).toBe(mockPageId);
        expect(data.version).toBe(1);
    });

    it('should return 404 if page not found', async () => {
        mockPageData = null;

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'new_visitor',
                    scriptContent: 'Hello!',
                }),
            }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Page not found');
    });

    it('should return 400 if type is missing', async () => {
        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptContent: 'Hello!',
                }),
            }
        );

        const params = Promise.resolve({ projectId: mockProjectId, pageId: mockPageId });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('type is required');
    });
});

describe('PUT /api/projects/[projectId]/pages/[pageId]/segments/[segmentId]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPageData = { ...mockPage };
        mockSegmentsData = [mockPageSegment];
    });

    it('should update a page segment script', async () => {
        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments/${mockSegmentId}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptContent: 'Updated page script!',
                }),
            }
        );

        const params = Promise.resolve({
            projectId: mockProjectId,
            pageId: mockPageId,
            segmentId: mockSegmentId,
        });
        const response = await PUT(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.scriptContent).toBe('Updated page script!');
        expect(mockSegmentDocUpdate).toHaveBeenCalled();
        expect(mockVersionDocSet).toHaveBeenCalledWith(
            expect.objectContaining({
                scriptContent: 'Updated page script!',
                source: 'manual',
            }),
        );
    });

    it('should return 404 if page not found', async () => {
        mockPageData = null;

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments/${mockSegmentId}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptContent: 'Updated!',
                }),
            }
        );

        const params = Promise.resolve({
            projectId: mockProjectId,
            pageId: mockPageId,
            segmentId: mockSegmentId,
        });
        const response = await PUT(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Page not found');
    });

    it('should return 404 if segment not found', async () => {
        mockSegmentsData = [];

        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments/${mockSegmentId}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptContent: 'Updated!',
                }),
            }
        );

        const params = Promise.resolve({
            projectId: mockProjectId,
            pageId: mockPageId,
            segmentId: mockSegmentId,
        });
        const response = await PUT(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Segment not found');
    });

    it('should return 400 if scriptContent is empty', async () => {
        const request = new Request(
            `http://localhost/api/projects/${mockProjectId}/pages/${mockPageId}/segments/${mockSegmentId}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptContent: '',
                }),
            }
        );

        const params = Promise.resolve({
            projectId: mockProjectId,
            pageId: mockPageId,
            segmentId: mockSegmentId,
        });
        const response = await PUT(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('scriptContent is required');
    });
});
