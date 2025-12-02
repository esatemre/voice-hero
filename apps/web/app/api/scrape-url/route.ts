import { NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';
import { processScrapedContent } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const content = await scrapeUrl(url);
        let processedData;

        try {
            // Try to use LLM to process content
            processedData = await processScrapedContent(content);
        } catch (error) {
            console.warn('LLM processing failed, falling back to basic scraping:', error);
            // Fallback to basic logic
            const description = [
                content.headline || content.title,
                content.description,
                content.bullets.length > 0 ? 'Key features:\n' + content.bullets.map(b => `- ${b}`).join('\n') : '',
                content.ctaText.length > 0 ? 'Calls to Action:\n' + content.ctaText.map(c => `- ${c}`).join('\n') : ''
            ].filter(Boolean).join('\n\n');

            processedData = {
                description,
                summary: content.description || '',
                details: content.bullets.join('\n') || ''
            };
        }

        return NextResponse.json({
            title: content.title,
            description: processedData.description,
            summary: processedData.summary,
            details: processedData.details,
            raw: content,
        });
    } catch (error) {
        console.error('Scrape error:', error);
        return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 });
    }
}
