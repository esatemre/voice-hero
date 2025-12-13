'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ContentSnapshot, Page } from '@/lib/types';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

interface SnapshotPanelProps {
    projectId: string;
    page: Page;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSnapshotUpdate?: (snapshot: ContentSnapshot) => void;
}

export default function SnapshotPanel({
    projectId,
    page,
    open,
    onOpenChange,
    onSnapshotUpdate,
}: SnapshotPanelProps) {
    const [snapshot, setSnapshot] = useState<ContentSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [rescraping, setRescraping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchLatestSnapshot();
        }
    }, [open, page.id]);

    const fetchLatestSnapshot = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/projects/${projectId}/pages/${page.id}/snapshots/latest`
            );
            if (res.status === 404) {
                setSnapshot(null);
            } else if (!res.ok) {
                throw new Error('Failed to fetch snapshot');
            } else {
                const data = await res.json();
                setSnapshot(data);
            }
        } catch (err) {
            setError('Failed to load snapshot');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRescrape = async () => {
        setRescraping(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/projects/${projectId}/pages/${page.id}/snapshots`,
                { method: 'POST' }
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to rescrape');
            }
            const newSnapshot = await res.json();
            setSnapshot(newSnapshot);
            onSnapshotUpdate?.(newSnapshot);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to rescrape page');
            console.error(err);
        } finally {
            setRescraping(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Page Content Snapshot</DialogTitle>
                            <DialogDescription className="mt-1">
                                {page.url}
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRescrape}
                            disabled={rescraping}
                        >
                            {rescraping ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Rescrape
                        </Button>
                    </div>
                </DialogHeader>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!loading && !snapshot && !error && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No snapshot available for this page.</p>
                        <Button
                            variant="default"
                            className="mt-4"
                            onClick={handleRescrape}
                            disabled={rescraping}
                        >
                            {rescraping ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Scrape Now
                        </Button>
                    </div>
                )}

                {!loading && snapshot && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">
                                {formatDate(snapshot.createdAt)}
                            </Badge>
                            <span>Hash: {snapshot.contentHash}</span>
                        </div>

                        <div className="space-y-4">
                            <Section title="Title">
                                <p className="text-sm">{snapshot.raw.title || 'N/A'}</p>
                            </Section>

                            <Section title="Headline">
                                <p className="text-sm">{snapshot.raw.headline || 'N/A'}</p>
                            </Section>

                            <Section title="Description (Raw)">
                                <p className="text-sm">{snapshot.raw.description || 'N/A'}</p>
                            </Section>

                            <Section title="Bullets">
                                {snapshot.raw.bullets.length > 0 ? (
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {snapshot.raw.bullets.map((bullet, i) => (
                                            <li key={i}>{bullet}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No bullets found</p>
                                )}
                            </Section>

                            <Section title="CTA Text">
                                {snapshot.raw.ctaText.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {snapshot.raw.ctaText.map((cta, i) => (
                                            <Badge key={i} variant="outline">{cta}</Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No CTAs found</p>
                                )}
                            </Section>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">AI-Processed Content</h4>

                                <Section title="Nice Description">
                                    <p className="text-sm">{snapshot.processed.description || 'N/A'}</p>
                                </Section>

                                <Section title="Summary">
                                    <p className="text-sm">{snapshot.processed.summary || 'N/A'}</p>
                                </Section>

                                <Section title="Details">
                                    <p className="text-sm whitespace-pre-wrap">{snapshot.processed.details || 'N/A'}</p>
                                </Section>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {title}
            </h5>
            {children}
        </div>
    );
}
