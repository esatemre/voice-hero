import * as cheerio from 'cheerio';

export interface ScrapedContent {
    title: string;
    description: string;
    headline: string;
    bullets: string[];
    ctaText: string[];
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch URL');

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract title
        const title = $('title').text() || $('h1').first().text() || '';

        // Extract meta description
        const description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') || '';

        // Extract main headline
        const headline = $('h1').first().text() || $('h2').first().text() || '';

        // Extract bullet points (ul/li)
        const bullets: string[] = [];
        $('ul li').slice(0, 5).each((_, el) => {
            const text = $(el).text().trim();
            if (text && text.length < 200) bullets.push(text);
        });

        // Extract CTA text (buttons, links with specific classes)
        const ctaText: string[] = [];
        $('button, a.btn, a.button, [class*="cta"]').slice(0, 3).each((_, el) => {
            const text = $(el).text().trim();
            if (text && text.length < 50) ctaText.push(text);
        });

        return {
            title: title.trim(),
            description: description.trim(),
            headline: headline.trim(),
            bullets,
            ctaText,
        };
    } catch (error) {
        console.error('Scraping error:', error);
        throw new Error('Failed to scrape URL');
    }
}
