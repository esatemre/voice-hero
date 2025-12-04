import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateConversationResponse } from '../../lib/gemini';

const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
    return {
        mockGenerateContent: vi.fn(),
        mockGetGenerativeModel: vi.fn(),
    };
});

mockGetGenerativeModel.mockReturnValue({
    generateContent: mockGenerateContent,
});

vi.mock('@/lib/firebase', () => ({
    model: {
        generateContent: mockGenerateContent,
    },
    getGenerativeModel: mockGetGenerativeModel,
    getModel: vi.fn(() => ({
        generateContent: mockGenerateContent,
    })),
    ai: {},
}));

describe('generateConversationResponse', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate response from audio and context', async () => {
        const mockResponse = {
            response: {
                text: () => 'Hello! I can help you with that.',
            },
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const audioBuffer = Buffer.from('fake-audio');
        const context = {
            name: 'Test Product',
            summary: 'A great product',
            details: 'Feature A, Feature B',
        };

        const response = await generateConversationResponse(audioBuffer, context);

        expect(response).toBe('Hello! I can help you with that.');
        expect(mockGenerateContent).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                inlineData: {
                    mimeType: 'audio/mp3',
                    data: expect.any(String), // Base64 string
                },
            }),
        ]));
    });

    it('should handle errors', async () => {
        mockGenerateContent.mockRejectedValue(new Error('Gemini Error'));

        const audioBuffer = Buffer.from('fake-audio');
        const context = { name: 'Test', summary: '', details: '' };

        await expect(generateConversationResponse(audioBuffer, context))
            .rejects.toThrow('Failed to generate conversation response');
    });
});
