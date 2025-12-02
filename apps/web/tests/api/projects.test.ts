import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/projects/route';

// Mock the db module
const mockSet = vi.fn();
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockDocId = 'mock-doc-id';

// Mock for subcollection
const mockSubCollectionDoc = vi.fn(() => ({
    id: 'mock-segment-id',
}));

const mockSubCollection = vi.fn(() => ({
    doc: mockSubCollectionDoc,
}));

const mockDoc = vi.fn(() => ({
    id: mockDocId,
    set: mockSet,
    collection: mockSubCollection, // Support subcollections
}));

const mockCollection = vi.fn(() => ({
    doc: mockDoc,
}));

const mockBatch = vi.fn(() => ({
    set: mockBatchSet,
    commit: mockBatchCommit,
}));

const mockFirestore = {
    collection: mockCollection,
    batch: mockBatch,
};

vi.mock('@/lib/db', () => ({
    getDb: vi.fn(() => mockFirestore),
}));

describe('POST /api/projects', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a project and default segments', async () => {
        const body = {
            name: 'Test Project',
            baseUrl: 'http://example.com',
            description: 'A test project',
            tone: 'friendly',
            language: 'en',
            aiSummary: 'Summary',
            aiDetails: 'Details',
        };

        const request = new Request('http://localhost/api/projects', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(expect.objectContaining({
            id: mockDocId,
            name: body.name,
            ownerId: 'demo-user',
        }));

        // Verify Project creation
        expect(mockCollection).toHaveBeenCalledWith('projects');
        expect(mockDoc).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            name: body.name,
            id: mockDocId,
        }));

        // Verify Segments created in project subcollection
        expect(mockSubCollection).toHaveBeenCalledWith('segments');
        expect(mockBatch).toHaveBeenCalled();
        expect(mockBatchSet).toHaveBeenCalledTimes(3); // 3 default segments
        expect(mockBatchCommit).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        mockSet.mockRejectedValueOnce(new Error('Database error'));

        const request = new Request('http://localhost/api/projects', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: 'Failed to create project' });
    });
});
