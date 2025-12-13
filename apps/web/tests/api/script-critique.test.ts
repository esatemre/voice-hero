import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/script-critique/route';

vi.mock('@/lib/gemini', () => ({
    critiqueScript: vi.fn(),
}));

import { critiqueScript } from '@/lib/gemini';

describe('POST /api/script-critique', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return critique results', async () => {
        const critique = {
            score: 7,
            strengths: ['Clear value prop'],
            weaknesses: ['Too long'],
            suggestions: ['Trim the intro'],
            revisedScript: 'Shortened script text.',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (critiqueScript as any).mockResolvedValue(critique);

        const request = new Request('http://localhost/api/script-critique', {
            method: 'POST',
            body: JSON.stringify({
                script: 'Original script',
                segmentType: 'new_visitor',
                tone: 'professional',
                language: 'en-US',
                lengthSeconds: 25,
                ctaFocus: 'book a demo',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(critique);
        expect(critiqueScript).toHaveBeenCalledWith(
            'Original script',
            expect.objectContaining({
                segmentType: 'new_visitor',
                tone: 'professional',
                language: 'en-US',
                lengthSeconds: 25,
                ctaFocus: 'book a demo',
            }),
        );
    });

    it('should handle errors', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (critiqueScript as any).mockRejectedValue(new Error('AI Error'));

        const request = new Request('http://localhost/api/script-critique', {
            method: 'POST',
            body: JSON.stringify({
                script: 'Original script',
                segmentType: 'new_visitor',
                tone: 'professional',
            }),
        });

        const response = await POST(request);
        expect(response.status).toBe(500);
    });
});
