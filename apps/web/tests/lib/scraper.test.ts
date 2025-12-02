import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeUrl } from '../../lib/scraper';

// Mock global fetch
global.fetch = vi.fn();

describe('scrapeUrl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract title, description, and content correctly', async () => {
        const mockHtml = `
            <html>
                <head>
                    <title>Test Page Title</title>
                    <meta name="description" content="Test meta description">
                </head>
                <body>
                    <h1>Main Headline</h1>
                    <ul>
                        <li>Feature 1</li>
                        <li>Feature 2</li>
                    </ul>
                    <button>Get Started</button>
                    <a class="cta-button">Sign Up</a>
                </body>
            </html>
        `;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: async () => mockHtml,
        });

        const result = await scrapeUrl('http://example.com');

        expect(result).toEqual({
            title: 'Test Page Title',
            description: 'Test meta description',
            headline: 'Main Headline',
            bullets: ['Feature 1', 'Feature 2'],
            ctaText: ['Get Started', 'Sign Up'],
        });
    });

    it('should handle missing elements gracefully', async () => {
        const mockHtml = `<html><body></body></html>`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: async () => mockHtml,
        });

        const result = await scrapeUrl('http://example.com');

        expect(result).toEqual({
            title: '',
            description: '',
            headline: '',
            bullets: [],
            ctaText: [],
        });
    });

    it('should throw error on fetch failure', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global.fetch as any).mockResolvedValue({
            ok: false,
        });

        await expect(scrapeUrl('http://example.com')).rejects.toThrow('Failed to scrape URL');
    });
});
