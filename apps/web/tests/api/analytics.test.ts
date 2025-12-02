import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/analytics/route';

// Mock Firestore
const mockAdd = vi.fn();
const mockSet = vi.fn();

// Mock Firestore Batch
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockBatch = vi.fn(() => ({
    set: mockBatchSet,
    commit: mockBatchCommit,
}));

// Create analytics collection mock
const analyticsCollectionMock = {
    add: mockAdd,
    doc: vi.fn(() => ({
        set: mockSet,
    })),
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
    batch: mockBatch,
};

vi.mock('@/lib/db', () => ({
    getDb: vi.fn(() => mockFirestore),
}));

describe('POST /api/analytics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should accept a single analytics event', async () => {
        mockAdd.mockResolvedValue({ id: 'event-123' });

        const event = {
            sessionId: 'session-abc',
            eventType: 'audio.play',
            timestamp: Date.now(),
            projectId: 'proj-1',
            segmentType: 'new_visitor',
            segmentId: 'seg-1',
            audioVersion: 'v1',
            scriptVersion: '1',
            audioUrl: 'https://example.com/audio.mp3',
            metadata: {
                audioDuration: 20,
            },
            userContext: {
                deviceType: 'mobile',
                userAgent: 'Mozilla/5.0',
                language: 'en-US',
            },
        };

        const request = new Request('http://localhost/api/analytics', {
            method: 'POST',
            body: JSON.stringify({ event }),
        }) as unknown as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockAdd).toHaveBeenCalledWith(
            expect.objectContaining({
                sessionId: 'session-abc',
                eventType: 'audio.play',
                projectId: 'proj-1',
                segmentType: 'new_visitor',
            })
        );
    });

    it('should accept batched analytics events', async () => {
        mockBatchCommit.mockResolvedValue(undefined);

        const events = [
            {
                sessionId: 'session-abc',
                eventType: 'widget.loaded',
                timestamp: Date.now(),
                projectId: 'proj-1',
                segmentType: 'new_visitor',
                segmentId: 'seg-1',
                audioVersion: 'v1',
                scriptVersion: '1',
                metadata: {},
                userContext: { deviceType: 'mobile' },
            },
            {
                sessionId: 'session-abc',
                eventType: 'bubble.clicked',
                timestamp: Date.now(),
                projectId: 'proj-1',
                segmentType: 'new_visitor',
                segmentId: 'seg-1',
                audioVersion: 'v1',
                scriptVersion: '1',
                metadata: {},
                userContext: { deviceType: 'mobile' },
            },
            {
                sessionId: 'session-abc',
                eventType: 'audio.play',
                timestamp: Date.now(),
                projectId: 'proj-1',
                segmentType: 'new_visitor',
                segmentId: 'seg-1',
                audioVersion: 'v1',
                scriptVersion: '1',
                audioUrl: 'https://example.com/audio.mp3',
                metadata: { audioDuration: 20 },
                userContext: { deviceType: 'mobile' },
            },
        ];

        const request = new Request('http://localhost/api/analytics', {
            method: 'POST',
            body: JSON.stringify({ events }),
        }) as unknown as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.count).toBe(3);
        expect(mockBatchCommit).toHaveBeenCalled();
        expect(mockBatchSet).toHaveBeenCalledTimes(3);
    });

    it('should validate required fields', async () => {
        const invalidEvent = {
            sessionId: 'session-abc',
            // Missing eventType
            timestamp: Date.now(),
        };

        const request = new Request('http://localhost/api/analytics', {
            method: 'POST',
            body: JSON.stringify({ event: invalidEvent }),
        }) as unknown as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
        expect(mockAdd).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors gracefully', async () => {
        mockAdd.mockRejectedValue(new Error('Firestore error'));

        const event = {
            sessionId: 'session-abc',
            eventType: 'audio.play',
            timestamp: Date.now(),
            projectId: 'proj-1',
            segmentType: 'new_visitor',
            segmentId: 'seg-1',
            audioVersion: 'v1',
            scriptVersion: '1',
            metadata: {},
            userContext: {},
        };

        const request = new Request('http://localhost/api/analytics', {
            method: 'POST',
            body: JSON.stringify({ event }),
        }) as unknown as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
    });

    it('should store segment and version information', async () => {
        mockAdd.mockResolvedValue({ id: 'event-123' });

        const event = {
            sessionId: 'session-abc',
            eventType: 'audio.complete',
            timestamp: Date.now(),
            projectId: 'proj-1',
            segmentType: 'utm_source_ads',
            segmentId: 'seg-2',
            audioVersion: 'v2',
            scriptVersion: '2',
            audioUrl: 'https://example.com/audio-v2.mp3',
            metadata: {
                audioDuration: 18,
                completionRate: 100,
            },
            userContext: {
                deviceType: 'desktop',
                utmSource: 'google_ads',
            },
        };

        const request = new Request('http://localhost/api/analytics', {
            method: 'POST',
            body: JSON.stringify({ event }),
        }) as unknown as NextRequest;

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockAdd).toHaveBeenCalledWith(
            expect.objectContaining({
                segmentType: 'utm_source_ads',
                segmentId: 'seg-2',
                audioVersion: 'v2',
                scriptVersion: '2',
                audioUrl: 'https://example.com/audio-v2.mp3',
            })
        );
    });

    it('should accept events without optional audioUrl', async () => {
        mockAdd.mockResolvedValue({ id: 'event-123' });

        const event = {
            sessionId: 'session-abc',
            eventType: 'widget.loaded',
            timestamp: Date.now(),
            projectId: 'proj-1',
            segmentType: 'new_visitor',
            segmentId: 'seg-1',
            audioVersion: 'v1',
            scriptVersion: '1',
            // No audioUrl for widget.loaded event
            metadata: {},
            userContext: {},
        };

        const request = new Request('http://localhost/api/analytics', {
            method: 'POST',
            body: JSON.stringify({ event }),
        }) as unknown as NextRequest;

        const response = await POST(request);

        expect(response.status).toBe(200);
    });
});
