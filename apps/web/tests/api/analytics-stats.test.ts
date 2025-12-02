import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../app/api/analytics/stats/route';
import { NextRequest } from 'next/server';

// Mock Firestore
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockGet = vi.fn();

const mockQuery = {
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    get: mockGet,
};

// Chain mocks to return the query object
mockWhere.mockReturnValue(mockQuery);
mockOrderBy.mockReturnValue(mockQuery);
mockLimit.mockReturnValue(mockQuery);

// Create analytics collection that returns the query
const analyticsCollectionMock = {
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    get: mockGet,
};

// Create doc mock that returns analytics collection
const docMock = {
    collection: vi.fn(() => analyticsCollectionMock),
};

// Create top-level collection mock
const mockCollection = vi.fn(() => ({
    doc: vi.fn(() => docMock),
}));

const mockFirestore = {
    collection: mockCollection,
};

vi.mock('@/lib/db', () => ({
    getDb: vi.fn(() => mockFirestore),
}));

describe('GET /api/analytics/stats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWhere.mockReturnValue(mockQuery);
    });

    it('should return analytics stats for a project', async () => {
        const mockEvents = [
            {
                data: () => ({
                    eventType: 'widget.loaded',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    audioVersion: 'v1',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
            {
                data: () => ({
                    eventType: 'audio.play',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    audioVersion: 'v1',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
            {
                data: () => ({
                    eventType: 'audio.complete',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    audioVersion: 'v1',
                    metadata: { completionRate: 100 },
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
        ];

        mockGet.mockResolvedValue({
            docs: mockEvents,
            empty: false,
        });

        const request = new NextRequest(
            'http://localhost/api/analytics/stats?projectId=proj-1'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalPlays).toBe(1);
        expect(data.uniqueVisitors).toBe(1);
        expect(data.completions).toBe(1);
        expect(data.listenThroughRate).toBe(100);
    });

    it('should calculate metrics by segment', async () => {
        const mockEvents = [
            {
                data: () => ({
                    eventType: 'audio.play',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    audioVersion: 'v1',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
            {
                data: () => ({
                    eventType: 'audio.play',
                    sessionId: 'session-2',
                    segmentType: 'returning',
                    audioVersion: 'v1',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
            {
                data: () => ({
                    eventType: 'audio.complete',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    audioVersion: 'v1',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
        ];

        mockGet.mockResolvedValue({
            docs: mockEvents,
            empty: false,
        });

        const request = new NextRequest(
            'http://localhost/api/analytics/stats?projectId=proj-1'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(data.segmentBreakdown).toBeDefined();
        expect(data.segmentBreakdown.new_visitor).toEqual({
            plays: 1,
            completions: 1,
            engagementRate: 100,
        });
        expect(data.segmentBreakdown.returning).toEqual({
            plays: 1,
            completions: 0,
            engagementRate: 0,
        });
    });

    it('should calculate metrics by version', async () => {
        const mockEvents = [
            {
                data: () => ({
                    eventType: 'audio.play',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    audioVersion: 'v1',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
            {
                data: () => ({
                    eventType: 'audio.play',
                    sessionId: 'session-2',
                    segmentType: 'new_visitor',
                    audioVersion: 'v2',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
            {
                data: () => ({
                    eventType: 'audio.complete',
                    sessionId: 'session-2',
                    segmentType: 'new_visitor',
                    audioVersion: 'v2',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
        ];

        mockGet.mockResolvedValue({
            docs: mockEvents,
            empty: false,
        });

        const request = new NextRequest(
            'http://localhost/api/analytics/stats?projectId=proj-1'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(data.versionBreakdown).toBeDefined();
        expect(data.versionBreakdown.v1).toEqual({
            plays: 1,
            completions: 0,
            engagementRate: 0,
        });
        expect(data.versionBreakdown.v2).toEqual({
            plays: 1,
            completions: 1,
            engagementRate: 100,
        });
    });

    it('should filter by date range', async () => {
        mockGet.mockResolvedValue({
            docs: [],
            empty: true,
        });

        const startDate = '2025-11-01';
        const endDate = '2025-11-30';

        const request = new NextRequest(
            `http://localhost/api/analytics/stats?projectId=proj-1&startDate=${startDate}&endDate=${endDate}`
        );

        await GET(request);

        expect(mockWhere).toHaveBeenCalledWith('projectId', '==', 'proj-1');
        expect(mockWhere).toHaveBeenCalledWith('timestamp', '>=', expect.any(Object));
        expect(mockWhere).toHaveBeenCalledWith('timestamp', '<=', expect.any(Object));
    });

    it('should return empty stats when no events exist', async () => {
        mockGet.mockResolvedValue({
            docs: [],
            empty: true,
        });

        const request = new NextRequest(
            'http://localhost/api/analytics/stats?projectId=proj-1'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalPlays).toBe(0);
        expect(data.uniqueVisitors).toBe(0);
        expect(data.completions).toBe(0);
        expect(data.listenThroughRate).toBe(0);
    });

    it('should require projectId parameter', async () => {
        const request = new NextRequest('http://localhost/api/analytics/stats');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
    });

    it('should calculate conversation metrics', async () => {
        const mockEvents = [
            {
                data: () => ({
                    eventType: 'audio.play',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
            {
                data: () => ({
                    eventType: 'conversation.start',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
            {
                data: () => ({
                    eventType: 'ai.response',
                    sessionId: 'session-1',
                    segmentType: 'new_visitor',
                    metadata: { responseTime: 1500 },
                    timestamp: { toMillis: () => Date.now() },
                }),
            },
        ];

        mockGet.mockResolvedValue({
            docs: mockEvents,
            empty: false,
        });

        const request = new NextRequest(
            'http://localhost/api/analytics/stats?projectId=proj-1'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(data.conversationStarts).toBe(1);
        expect(data.conversationRate).toBe(100);
        expect(data.avgResponseTime).toBe(1500);
    });
});
