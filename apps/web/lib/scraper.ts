import * as cheerio from 'cheerio';

export interface ScrapedContent {
    title: string;
    description: string;
    headline: string;
    bullets: string[];
    ctaText: string[];
}

export interface DiscoveredPage {
    url: string;
    title?: string;
}

function isSkippableLink(href: string) {
    const trimmed = href.trim().toLowerCase();
    if (!trimmed) return true;
    if (trimmed.startsWith('#')) return true;
    if (trimmed.startsWith('mailto:')) return true;
    if (trimmed.startsWith('tel:')) return true;
    if (trimmed.startsWith('javascript:')) return true;
    return false;
}

function normalizeUrl(url: URL) {
    const normalizedPath = url.pathname.endsWith('/') && url.pathname !== '/'
        ? url.pathname.slice(0, -1)
        : url.pathname;
    return `${url.origin}${normalizedPath}`;
}

function isAssetPath(pathname: string) {
    return /\.(png|jpe?g|gif|svg|ico|pdf|zip|css|js|map|woff2?|ttf|eot)$/i.test(pathname);
}

export async function discoverPages(url: string, limit = 50): Promise<DiscoveredPage[]> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch URL');

        const html = await response.text();
        const $ = cheerio.load(html);
        const baseUrl = new URL(url);
        const discovered: DiscoveredPage[] = [];
        const seen = new Set<string>();

        const addPage = (candidate: URL, title?: string) => {
            if (candidate.origin !== baseUrl.origin) return;
            if (isAssetPath(candidate.pathname)) return;
            candidate.hash = '';
            const normalized = normalizeUrl(candidate);
            if (seen.has(normalized)) return;
            seen.add(normalized);
            discovered.push({ url: normalized, title });
        };

        addPage(baseUrl, $('title').text().trim() || undefined);

        $('a[href]').each((_, el) => {
            if (discovered.length >= limit) return false;
            const href = $(el).attr('href');
            if (!href || isSkippableLink(href)) return;

            let candidate: URL;
            try {
                candidate = new URL(href, baseUrl);
            } catch (error) {
                return;
            }

            const title = $(el).text().trim() || undefined;
            addPage(candidate, title);
        });

        return discovered.slice(0, limit);
    } catch (error) {
        console.error('Discover pages error:', error);
        throw new Error('Failed to discover pages');
    }
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
