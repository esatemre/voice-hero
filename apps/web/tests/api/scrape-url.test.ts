import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/scrape-url/route';

// Mock dependencies
vi.mock('@/lib/scraper', () => ({
    scrapeUrl: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
    processScrapedContent: vi.fn(),
}));

import { scrapeUrl } from '@/lib/scraper';
import { processScrapedContent } from '@/lib/gemini';

describe('POST /api/scrape-url', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return processed content when LLM succeeds', async () => {
        const mockScrapedContent = {
            title: 'Test Title',
            description: 'Test Desc',
            headline: 'Test Headline',
            bullets: ['Point 1'],
            ctaText: ['Buy Now'],
        };

        const mockProcessedContent = {
            description: 'AI Description',
            summary: 'AI Summary',
            details: 'AI Details',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scrapeUrl as any).mockResolvedValue(mockScrapedContent);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (processScrapedContent as any).mockResolvedValue(mockProcessedContent);

        const request = new Request('http://localhost/api/scrape-url', {
            method: 'POST',
            body: JSON.stringify({ url: 'http://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
            title: 'Test Title',
            description: 'AI Description',
            summary: 'AI Summary',
            details: 'AI Details',
            raw: mockScrapedContent,
        });
    });

    it('should fallback to basic scraping when LLM fails', async () => {
        const mockScrapedContent = {
            title: 'Test Title',
            description: 'Test Desc',
            headline: 'Test Headline',
            bullets: ['Point 1'],
            ctaText: ['Buy Now'],
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scrapeUrl as any).mockResolvedValue(mockScrapedContent);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (processScrapedContent as any).mockRejectedValue(new Error('AI Error'));

        const request = new Request('http://localhost/api/scrape-url', {
            method: 'POST',
            body: JSON.stringify({ url: 'http://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        // Verify fallback logic
        expect(data.description).toContain('Test Headline');
        expect(data.summary).toBe('Test Desc');
        expect(data.details).toContain('Point 1');
    });

    it('should return 400 if URL is missing', async () => {
        const request = new Request('http://localhost/api/scrape-url', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
    });
});
