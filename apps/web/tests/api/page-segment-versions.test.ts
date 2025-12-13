import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../app/api/projects/[projectId]/pages/[pageId]/segments/[segmentId]/versions/route';
import { POST } from '../../app/api/projects/[projectId]/pages/[pageId]/segments/[segmentId]/versions/restore/route';

const mockVersionSet = vi.fn();
const mockVersionGet = vi.fn();
const mockVersionDoc = vi.fn(() => ({
    id: 'version-new',
    set: mockVersionSet,
    get: mockVersionGet,
}));
const mockVersionsGet = vi.fn();
const mockVersionsOrderBy = vi.fn(() => ({
    get: mockVersionsGet,
}));
const mockVersionsCollection = vi.fn(() => ({
    doc: mockVersionDoc,
    orderBy: mockVersionsOrderBy,
}));

const mockSegmentUpdate = vi.fn();
const mockSegmentGet = vi.fn();
const mockSegmentDoc = vi.fn(() => ({
    get: mockSegmentGet,
    update: mockSegmentUpdate,
    collection: mockVersionsCollection,
}));

const mockSegmentsCollection = vi.fn(() => ({
    doc: mockSegmentDoc,
}));

const mockPageDoc = vi.fn(() => ({
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

describe('GET /api/projects/[projectId]/pages/[pageId]/segments/[segmentId]/versions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return script versions for a segment', async () => {
        mockSegmentGet.mockResolvedValue({ exists: true });
        mockVersionsGet.mockResolvedValue({
            docs: [
                { data: () => ({ id: 'v1', scriptContent: 'A', createdAt: 2 }) },
                { data: () => ({ id: 'v2', scriptContent: 'B', createdAt: 1 }) },
            ],
        });

        const request = new Request('http://localhost');
        const params = Promise.resolve({
            projectId: 'proj-1',
            pageId: 'page-1',
            segmentId: 'seg-1',
        });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(2);
        expect(data[0].id).toBe('v1');
    });
});

describe('POST /api/projects/[projectId]/pages/[pageId]/segments/[segmentId]/versions/restore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should restore a script version', async () => {
        mockSegmentGet.mockResolvedValue({
            exists: true,
            data: () => ({
                id: 'seg-1',
                scriptContent: 'Current',
                version: 2,
            }),
        });
        mockVersionGet.mockResolvedValue({
            exists: true,
            data: () => ({
                id: 'v1',
                scriptContent: 'Old script',
                voiceId: 'voice-1',
                contentSnapshotId: 'snap-1',
            }),
        });

        const request = new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify({ versionId: 'v1' }),
        });

        const params = Promise.resolve({
            projectId: 'proj-1',
            pageId: 'page-1',
            segmentId: 'seg-1',
        });

        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.scriptContent).toBe('Old script');
        expect(mockSegmentUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                scriptContent: 'Old script',
                voiceId: 'voice-1',
                lastContentSnapshotId: 'snap-1',
                version: 3,
            }),
        );
        expect(mockVersionSet).toHaveBeenCalledWith(
            expect.objectContaining({
                scriptContent: 'Old script',
                source: 'restore',
            }),
        );
    });
});
