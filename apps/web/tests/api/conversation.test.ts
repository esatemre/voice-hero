import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/conversation/route';

// Mock dependencies
vi.mock('@/lib/db', () => ({
    getDb: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
    generateConversationResponse: vi.fn(),
}));

vi.mock('@/lib/elevenlabs', () => ({
    generateVoice: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
    saveAudioFile: vi.fn(),
}));

import { getDb } from '@/lib/db';
import { generateConversationResponse } from '@/lib/gemini';
import { generateVoice } from '@/lib/elevenlabs';
import { saveAudioFile } from '@/lib/storage';

describe('POST /api/conversation', () => {
    const mockGet = vi.fn();
    const mockDoc = vi.fn(() => ({ get: mockGet }));
    const mockCollection = vi.fn(() => ({ doc: mockDoc }));
    const mockFirestore = { collection: mockCollection };

    beforeEach(() => {
        vi.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (getDb as any).mockReturnValue(mockFirestore);
    });

    it('should process audio and return response', async () => {
        // Mock Firestore
        mockGet.mockResolvedValue({
            exists: true,
            data: () => ({
                name: 'Test Project',
                aiSummary: 'Summary',
                aiDetails: 'Details',
            }),
        });

        // Mock Gemini
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (generateConversationResponse as any).mockResolvedValue('AI Response');

        // Mock ElevenLabs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (generateVoice as any).mockResolvedValue(new ArrayBuffer(8));

        // Mock Storage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (saveAudioFile as any).mockResolvedValue('https://storage.googleapis.com/test-bucket/audio/response.mp3');

        const mockAudioFile = {
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        };
        const formData = {
            get: (key: string) => {
                if (key === 'audio') return mockAudioFile;
                if (key === 'siteId') return 'test-site-id';
                return null;
            },
        } as FormData;

        const request = {
            formData: async () => formData,
        } as Request;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
            audioUrl: 'https://storage.googleapis.com/test-bucket/audio/response.mp3',
            transcript: 'AI Response',
        });

        // Verify Flow
        expect(mockCollection).toHaveBeenCalledWith('projects');
        expect(mockDoc).toHaveBeenCalledWith('test-site-id');
        expect(generateConversationResponse).toHaveBeenCalled();
        expect(generateVoice).toHaveBeenCalledWith('AI Response');
        expect(saveAudioFile).toHaveBeenCalled();
    });

    it('should return 400 if audio is missing', async () => {
        const formData = {
            get: (key: string) => (key === 'siteId' ? 'test-site-id' : null),
        } as FormData;

        const request = {
            formData: async () => formData,
        } as Request;

        const response = await POST(request);
        expect(response.status).toBe(400);
    });
});
