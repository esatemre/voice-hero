'use client';

import { useEffect, useState } from 'react';
import { Page, PageSegment, SegmentType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Wand2, Play, AlertTriangle } from 'lucide-react';
import ScriptTimelinePanel from '@/components/script-timeline-panel';

interface PageSegmentsViewProps {
    projectId: string;
    page: Page;
    projectName: string;
    projectDescription: string;
    projectTone: string;
}

const SEGMENT_TYPES: { value: SegmentType; label: string }[] = [
    { value: 'new_visitor', label: 'New Visitor' },
    { value: 'returning_visitor', label: 'Returning Visitor' },
    { value: 'utm_source', label: 'UTM Source' },
    { value: 'language', label: 'Language' },
    { value: 'geo', label: 'Geo' },
];

export default function PageSegmentsView({
    projectId,
    page,
    projectName,
    projectDescription,
    projectTone,
}: PageSegmentsViewProps) {
    const [segments, setSegments] = useState<PageSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [newSegmentType, setNewSegmentType] = useState<SegmentType>('new_visitor');
    const [generatingScript, setGeneratingScript] = useState<Record<string, boolean>>({});
    const [savingScript, setSavingScript] = useState<Record<string, boolean>>({});
    const [segmentErrors, setSegmentErrors] = useState<Record<string, string>>({});
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [timelineSegment, setTimelineSegment] = useState<PageSegment | null>(null);

    useEffect(() => {
        fetchSegments();
    }, [page.id]);

    const fetchSegments = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/projects/${projectId}/pages/${page.id}/segments`);
            if (!res.ok) throw new Error('Failed to fetch segments');
            const data = await res.json();
            setSegments(data);
        } catch (err) {
            setError('Failed to load page segments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSegment = async () => {
        setCreating(true);
        setError('');
        try {
            const res = await fetch(`/api/projects/${projectId}/pages/${page.id}/segments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: newSegmentType }),
            });
            if (!res.ok) throw new Error('Failed to create segment');
            const newSegment = await res.json();
            setSegments(prev => [...prev, newSegment]);
        } catch (err) {
            setError('Failed to create segment');
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const handleGenerateScript = async (segment: PageSegment) => {
        setGeneratingScript(prev => ({ ...prev, [segment.id]: true }));
        setSegmentErrors(prev => ({ ...prev, [segment.id]: '' }));
        try {
            const res = await fetch('/api/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: projectName,
                    productDescription: projectDescription,
                    segmentType: segment.type,
                    tone: projectTone,
                }),
            });
            const data = await res.json();
            if (data.script) {
                setSegments(prev =>
                    prev.map(s =>
                        s.id === segment.id
                            ? { ...s, scriptContent: data.script, lastContentHash: page.lastContentHash || undefined }
                            : s
                    )
                );
            }
        } catch (err) {
            setSegmentErrors(prev => ({ ...prev, [segment.id]: 'Failed to generate script' }));
            console.error(err);
        } finally {
            setGeneratingScript(prev => ({ ...prev, [segment.id]: false }));
        }
    };

    const handleSaveScript = async (segment: PageSegment) => {
        if (!segment.scriptContent) return;
        setSavingScript(prev => ({ ...prev, [segment.id]: true }));
        setSegmentErrors(prev => ({ ...prev, [segment.id]: '' }));
        try {
            const res = await fetch(
                `/api/projects/${projectId}/pages/${page.id}/segments/${segment.id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scriptContent: segment.scriptContent,
                        lastContentHash: page.lastContentHash,
                    }),
                }
            );
            if (!res.ok) throw new Error('Failed to save');
            const updated = await res.json();
            setSegments(prev => prev.map(s => (s.id === segment.id ? updated : s)));
        } catch (err) {
            setSegmentErrors(prev => ({ ...prev, [segment.id]: 'Failed to save script' }));
            console.error(err);
        } finally {
            setSavingScript(prev => ({ ...prev, [segment.id]: false }));
        }
    };

    const updateSegmentScript = (segmentId: string, scriptContent: string) => {
        setSegments(prev =>
            prev.map(s => (s.id === segmentId ? { ...s, scriptContent } : s))
        );
    };

    const handleOpenTimeline = (segment: PageSegment) => {
        setTimelineSegment(segment);
        setTimelineOpen(true);
    };

    const handleRestoreVersion = (updatedSegment: PageSegment) => {
        setSegments(prev => prev.map(s => (s.id === updatedSegment.id ? updatedSegment : s)));
    };

    const playAudio = (url: string) => {
        const audio = new Audio(url);
        audio.play();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium">Page-Specific Segments</h4>
                <div className="flex items-center gap-2">
                    <Select value={newSegmentType} onValueChange={(v) => setNewSegmentType(v as SegmentType)}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SEGMENT_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleCreateSegment} disabled={creating}>
                        {creating ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                            <Plus className="mr-1 h-3 w-3" />
                        )}
                        Add Segment
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            {segments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
                    No page-specific segments. Playback will use project-level segments.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {segments.map(segment => (
                        <Card key={segment.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm capitalize">
                                        {segment.type.replace('_', ' ')}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {segment.audioUrl && <Badge variant="secondary">Ready</Badge>}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => handleOpenTimeline(segment)}
                                        >
                                            History
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription className="text-xs">
                                    Version {segment.version}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Script</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleGenerateScript(segment)}
                                        disabled={generatingScript[segment.id]}
                                    >
                                        {generatingScript[segment.id] ? (
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        ) : (
                                            <Wand2 className="mr-1 h-3 w-3" />
                                        )}
                                        Generate
                                    </Button>
                                </div>
                                <Textarea
                                    value={segment.scriptContent}
                                    onChange={(e) => updateSegmentScript(segment.id, e.target.value)}
                                    placeholder="Script for this page..."
                                    className="min-h-[80px] text-sm"
                                />
                                {segmentErrors[segment.id] && (
                                    <div className="text-xs text-red-600">{segmentErrors[segment.id]}</div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleSaveScript(segment)}
                                        disabled={savingScript[segment.id] || !segment.scriptContent}
                                    >
                                        {savingScript[segment.id] ? (
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        ) : null}
                                        Save
                                    </Button>
                                    {segment.audioUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => playAudio(segment.audioUrl!)}
                                        >
                                            <Play className="mr-1 h-3 w-3" />
                                            Play
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ScriptTimelinePanel
                open={timelineOpen}
                onOpenChange={(open) => {
                    setTimelineOpen(open);
                    if (!open) setTimelineSegment(null);
                }}
                projectId={projectId}
                pageId={page.id}
                segment={timelineSegment}
                onRestore={handleRestoreVersion}
            />
        </div>
    );
}
