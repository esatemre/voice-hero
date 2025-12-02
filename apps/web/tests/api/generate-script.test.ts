import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/generate-script/route';

// Mock dependencies
vi.mock('@/lib/gemini', () => ({
    generateScript: vi.fn(),
}));

import { generateScript } from '@/lib/gemini';

describe('POST /api/generate-script', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate script successfully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (generateScript as any).mockResolvedValue('Generated Script');

        const request = new Request('http://localhost/api/generate-script', {
            method: 'POST',
            body: JSON.stringify({
                productName: 'Product',
                productDescription: 'Desc',
                segmentType: 'new_visitor',
                tone: 'friendly',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.script).toBe('Generated Script');
        expect(generateScript).toHaveBeenCalledWith('Product', 'Desc', 'new_visitor', 'friendly');
    });

    it('should handle errors', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (generateScript as any).mockRejectedValue(new Error('AI Error'));

        const request = new Request('http://localhost/api/generate-script', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        expect(response.status).toBe(500);
    });
});
