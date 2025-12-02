import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../app/api/playback/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
    getDb: vi.fn(),
}));

import { getDb } from '@/lib/db';

describe('GET /api/playback', () => {
    const mockGet = vi.fn();

    // Setup mock chain: db.collection().doc().collection().get()
    const mockSegmentsRef = { get: mockGet };
    const mockProjectRef = { collection: vi.fn(() => mockSegmentsRef) };
    const mockProjectsCollection = { doc: vi.fn(() => mockProjectRef) };
    const mockFirestore = { collection: vi.fn(() => mockProjectsCollection) };

    beforeEach(() => {
        vi.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (getDb as any).mockReturnValue(mockFirestore);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createMockSegments = (segments: any[]) => ({
        empty: segments.length === 0,
        docs: segments.map(s => ({ data: () => s })),
    });

    it('should select UTM source segment', async () => {
        const segments = [
            { type: 'new_visitor', audioUrl: 'default.mp3' },
            { type: 'utm_source', conditionValue: 'ads', audioUrl: 'ads.mp3' },
        ];
        mockGet.mockResolvedValue(createMockSegments(segments));

        const request = new Request('http://localhost/api/playback?siteId=123&utmSource=ads');
        const response = await GET(request);
        const data = await response.json();

        expect(data.audioUrl).toBe('ads.mp3');
    });

    it('should select returning visitor segment', async () => {
        const segments = [
            { type: 'new_visitor', audioUrl: 'default.mp3' },
            { type: 'returning_visitor', audioUrl: 'returning.mp3' },
        ];
        mockGet.mockResolvedValue(createMockSegments(segments));

        const request = new Request('http://localhost/api/playback?siteId=123&isReturning=true');
        const response = await GET(request);
        const data = await response.json();

        expect(data.audioUrl).toBe('returning.mp3');
    });

    it('should fallback to new visitor', async () => {
        const segments = [
            { type: 'new_visitor', audioUrl: 'default.mp3' },
            { type: 'returning_visitor', audioUrl: 'returning.mp3' },
        ];
        mockGet.mockResolvedValue(createMockSegments(segments));

        const request = new Request('http://localhost/api/playback?siteId=123');
        const response = await GET(request);
        const data = await response.json();

        expect(data.audioUrl).toBe('default.mp3');
    });

    it('should return 404 if no audio', async () => {
        const segments = [
            { type: 'new_visitor' }, // No audioUrl
        ];
        mockGet.mockResolvedValue(createMockSegments(segments));

        const request = new Request('http://localhost/api/playback?siteId=123');
        const response = await GET(request);

        expect(response.status).toBe(404);
    });
});
