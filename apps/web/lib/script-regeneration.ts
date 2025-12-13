import { Page, Segment, ContentSnapshot } from './types';

/**
 * Determines if the user should be prompted to regenerate scripts
 * based on content changes since the last script generation.
 */
export function shouldSuggestRegeneration(
    page: Page,
    segment: Segment,
    latestSnapshot: ContentSnapshot | null
): boolean {
    if (!latestSnapshot) {
        return false;
    }

    if (!page.lastContentHash) {
        return false;
    }

    if (!segment.scriptContent) {
        return false;
    }

    if (!segment.lastContentSnapshotId) {
        return true;
    }

    if (segment.lastContentHash !== latestSnapshot.contentHash) {
        return true;
    }

    return false;
}
