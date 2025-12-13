import { describe, it, expect, vi, beforeEach } from 'vitest';
import { critiqueScript } from '../../lib/gemini';

const { mockGenerateContent } = vi.hoisted(() => {
    return {
        mockGenerateContent: vi.fn(),
    };
});

vi.mock('@/lib/firebase', () => ({
    getModel: vi.fn(() => ({
        generateContent: mockGenerateContent,
    })),
}));

describe('critiqueScript', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should parse critique JSON response', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () =>
                    '```json\n{"score":7,"strengths":["Clear"],"weaknesses":["Long"],"suggestions":["Trim"],"revisedScript":"Revised."}\n```',
            },
        });

        const result = await critiqueScript('Original', {
            segmentType: 'new_visitor',
            tone: 'casual',
            language: 'en-US',
            lengthSeconds: 20,
        });

        expect(result).toEqual({
            score: 7,
            strengths: ['Clear'],
            weaknesses: ['Long'],
            suggestions: ['Trim'],
            revisedScript: 'Revised.',
        });
        expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should reject invalid critique JSON', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => 'not json',
            },
        });

        await expect(
            critiqueScript('Original', {
                segmentType: 'new_visitor',
                tone: 'casual',
            }),
        ).rejects.toThrow('Failed to critique script');
    });
});
