import { describe, it, expect } from 'vitest';
import { shouldSuggestRegeneration } from '../../lib/script-regeneration';
import { Page, Segment, ContentSnapshot } from '../../lib/types';

const basePage: Page = {
    id: 'page-1',
    projectId: 'project-1',
    url: 'https://example.com',
    path: '/',
    title: 'Example',
    status: 'scraped',
    lastScrapedAt: Date.now(),
    voiceEnabled: true,
    lastContentHash: 'hash-abc123',
};

const baseSegment: Segment = {
    id: 'segment-1',
    projectId: 'project-1',
    type: 'new_visitor',
    scriptContent: 'Welcome to our site!',
    createdAt: Date.now() - 10000,
};

const baseSnapshot: ContentSnapshot = {
    id: 'snapshot-1',
    pageId: 'page-1',
    createdAt: Date.now(),
    raw: {
        title: 'Example',
        headline: 'Welcome',
        description: 'A great site',
        bullets: [],
        ctaText: [],
    },
    processed: {
        description: 'AI description',
        summary: 'AI summary',
        details: 'AI details',
    },
    contentHash: 'hash-abc123',
};

describe('shouldSuggestRegeneration', () => {
    it('should return true when segment has no lastContentSnapshotId', () => {
        const segment = { ...baseSegment };
        const result = shouldSuggestRegeneration(basePage, segment, baseSnapshot);
        expect(result).toBe(true);
    });

    it('should return true when content hash changed since last script generation', () => {
        const segment = {
            ...baseSegment,
            lastContentSnapshotId: 'old-snapshot-id',
            lastContentHash: 'old-hash',
        };
        const result = shouldSuggestRegeneration(basePage, segment, baseSnapshot);
        expect(result).toBe(true);
    });

    it('should return false when segment was generated from current snapshot', () => {
        const segment = {
            ...baseSegment,
            lastContentSnapshotId: 'snapshot-1',
            lastContentHash: 'hash-abc123',
        };
        const result = shouldSuggestRegeneration(basePage, segment, baseSnapshot);
        expect(result).toBe(false);
    });

    it('should return false when no snapshot exists', () => {
        const segment = { ...baseSegment };
        const result = shouldSuggestRegeneration(basePage, segment, null);
        expect(result).toBe(false);
    });

    it('should return false when page has no content hash', () => {
        const page = { ...basePage, lastContentHash: null };
        const segment = { ...baseSegment };
        const result = shouldSuggestRegeneration(page, segment, baseSnapshot);
        expect(result).toBe(false);
    });

    it('should return true when segment has matching snapshotId but different hash', () => {
        const segment = {
            ...baseSegment,
            lastContentSnapshotId: 'snapshot-1',
            lastContentHash: 'different-hash',
        };
        const snapshot = { ...baseSnapshot, contentHash: 'new-hash' };
        const result = shouldSuggestRegeneration(basePage, segment, snapshot);
        expect(result).toBe(true);
    });

    it('should return false when segment has no script content', () => {
        const segment = {
            ...baseSegment,
            scriptContent: '',
        };
        const result = shouldSuggestRegeneration(basePage, segment, baseSnapshot);
        expect(result).toBe(false);
    });
});
