'use client';

import { useEffect, useState } from 'react';
import { Page } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Plus, AlertTriangle, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import SnapshotPanel from '@/components/snapshot-panel';

interface PagesViewProps {
    projectId: string;
    baseUrl: string;
}

const statusLabels: Record<string, string> = {
    discovered: 'Discovered',
    scraped: 'Scraped',
    error: 'Error',
};

function formatStatus(status?: string) {
    return statusLabels[status || 'discovered'] || 'Discovered';
}

function statusVariant(status?: string): 'secondary' | 'default' | 'destructive' {
    if (status === 'error') return 'destructive';
    if (status === 'scraped') return 'default';
    return 'secondary';
}

function formatTimestamp(value: number | null | undefined) {
    if (!value) return 'Never';
    return new Date(value).toLocaleString();
}

export default function PagesView({ projectId, baseUrl }: PagesViewProps) {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [discovering, setDiscovering] = useState(false);
    const [adding, setAdding] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [snapshotPanelOpen, setSnapshotPanelOpen] = useState(false);
    const [togglingVoice, setTogglingVoice] = useState<Record<string, boolean>>({});

    const handleViewSnapshot = (page: Page) => {
        setSelectedPage(page);
        setSnapshotPanelOpen(true);
    };

    const handleToggleVoice = async (page: Page, enabled: boolean) => {
        setTogglingVoice(prev => ({ ...prev, [page.id]: true }));
        setError('');
        try {
            const res = await fetch(`/api/projects/${projectId}/pages/${page.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceEnabled: enabled }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error || 'Failed to update voice setting');
            }

            setPages(prev =>
                prev.map(p => (p.id === page.id ? { ...p, voiceEnabled: enabled } : p))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update voice setting.');
        } finally {
            setTogglingVoice(prev => ({ ...prev, [page.id]: false }));
        }
    };

    const fetchPages = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/projects/${projectId}/pages`);
            if (!res.ok) {
                throw new Error('Failed to fetch pages');
            }
            const data = await res.json();
            setPages(data);
        } catch {
            setError('Failed to load pages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, [projectId]);

    const handleDiscover = async () => {
        setDiscovering(true);
        setError('');
        try {
            const res = await fetch(`/api/projects/${projectId}/pages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'discover', limit: 50 }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error || 'Failed to discover pages');
            }

            await fetchPages();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to discover pages.');
        } finally {
            setDiscovering(false);
        }
    };

    const handleAddPage = async () => {
        if (!manualUrl.trim()) return;
        setAdding(true);
        setError('');
        try {
            const res = await fetch(`/api/projects/${projectId}/pages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: manualUrl.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.error || 'Failed to add page');
            }

            setManualUrl('');
            await fetchPages();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add page.');
        } finally {
            setAdding(false);
        }
    };

    return (
        <Card>
            <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Pages</CardTitle>
                        <CardDescription>
                            Discover and manage pages for {baseUrl}
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleDiscover} disabled={discovering}>
                        {discovering ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Discover pages
                    </Button>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Input
                        value={manualUrl}
                        onChange={(event) => setManualUrl(event.target.value)}
                        placeholder="Add a page URL or path (e.g. /pricing)"
                    />
                    <Button onClick={handleAddPage} disabled={adding || !manualUrl.trim()}>
                        {adding ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        Add page
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="flex items-start gap-2 text-sm text-red-600">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading pages...
                    </div>
                ) : pages.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground">
                        No pages discovered yet. Click Discover pages or add a URL manually.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pages.map((page) => (
                            <div
                                key={page.id}
                                className="rounded-lg border border-border/60 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="font-medium text-foreground">
                                        {page.title || page.path || page.url}
                                    </div>
                                    <div className="text-xs text-muted-foreground break-all">
                                        {page.url}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <Badge variant={statusVariant(page.status)}>
                                        {formatStatus(page.status)}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={page.voiceEnabled !== false}
                                            onCheckedChange={(checked) => handleToggleVoice(page, checked)}
                                            disabled={togglingVoice[page.id]}
                                        />
                                        <span className="text-xs">
                                            {page.voiceEnabled !== false ? 'Voice on' : 'Voice off'}
                                        </span>
                                    </div>
                                    <span>Last scraped: {formatTimestamp(page.lastScrapedAt)}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewSnapshot(page)}
                                    >
                                        <Eye className="mr-1 h-3 w-3" />
                                        View snapshot
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {selectedPage && (
                <SnapshotPanel
                    projectId={projectId}
                    page={selectedPage}
                    open={snapshotPanelOpen}
                    onOpenChange={setSnapshotPanelOpen}
                />
            )}
        </Card>
    );
}
