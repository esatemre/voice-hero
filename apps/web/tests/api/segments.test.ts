import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/projects/[projectId]/segments/route';
import { Segment } from '../../lib/types';

// Mock the db module
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockProjectId = 'test-project-id';

// Mock for subcollection document
const mockSegmentDoc = vi.fn(() => ({
    id: 'mock-segment-id',
}));

// Mock for segments subcollection
const mockSegmentsCollection = vi.fn(() => ({
    doc: mockSegmentDoc,
}));

// Mock for project document
const mockProjectDoc = vi.fn(() => ({
    collection: mockSegmentsCollection,
}));

// Mock for projects collection
const mockProjectsCollection = vi.fn(() => ({
    doc: mockProjectDoc,
}));

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

describe('POST /api/projects/[projectId]/segments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create default segments for a project', async () => {
        const request = new Request(`http://localhost/api/projects/${mockProjectId}/segments`, {
            method: 'POST',
        });

        const params = Promise.resolve({ projectId: mockProjectId });
        const response = await POST(request, { params });
        const data = await response.json();

        // Verify response
        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(3);

        // Verify all segments have correct structure
        const segments = data as Segment[];

        segments.forEach(segment => {
            expect(segment).toEqual(expect.objectContaining({
                id: expect.any(String),
                projectId: mockProjectId,
                type: expect.any(String),
                scriptContent: expect.any(String),
                createdAt: expect.any(Number),
            }));
        });

        // Verify correct collections were accessed
        expect(mockProjectsCollection).toHaveBeenCalledWith('projects');
        expect(mockProjectDoc).toHaveBeenCalledWith(mockProjectId);
        expect(mockSegmentsCollection).toHaveBeenCalledWith('segments');

        // Verify batch operations
        expect(mockBatch).toHaveBeenCalled();
        expect(mockBatchSet).toHaveBeenCalledTimes(3); // 3 default segments
        expect(mockBatchCommit).toHaveBeenCalled();
    });

    it('should create segments with correct types', async () => {
        const request = new Request(`http://localhost/api/projects/${mockProjectId}/segments`, {
            method: 'POST',
        });

        const params = Promise.resolve({ projectId: mockProjectId });
        const response = await POST(request, { params });
        const data = await response.json();

        const segments = data as Segment[];
        const types = segments.map(segment => segment.type);
        expect(types).toContain('new_visitor');
        expect(types).toContain('returning_visitor');
        expect(types).toContain('utm_source');
    });

    it('should handle errors gracefully', async () => {
        mockBatchCommit.mockRejectedValueOnce(new Error('Database error'));

        const request = new Request(`http://localhost/api/projects/${mockProjectId}/segments`, {
            method: 'POST',
        });

        const params = Promise.resolve({ projectId: mockProjectId });
        const response = await POST(request, { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: 'Failed to create segments' });
    });
});
