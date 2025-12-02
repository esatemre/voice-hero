'use client';

import { useState } from 'react';
import { Project, Segment } from '@/lib/types';
import { clientEnv } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Play, Loader2, Wand2 } from 'lucide-react';

interface ProjectViewProps {
    project: Project;
    initialSegments: Segment[];
}

export default function ProjectView({ project, initialSegments }: ProjectViewProps) {
    const [segments, setSegments] = useState<Segment[]>(initialSegments);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [initializing, setInitializing] = useState(false);

    // Helper to update local state
    const updateSegment = (segmentId: string, updates: Partial<Segment>) => {
        setSegments(prev => prev.map(s => s.id === segmentId ? { ...s, ...updates } : s));
    };

    const handleInitializeDefaults = async () => {
        setInitializing(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/segments`, {
                method: 'POST',
            });
            if (res.ok) {
                const newSegments = await res.json();
                setSegments(newSegments);
            }
        } catch (error) {
            console.error('Error initializing segments:', error);
        } finally {
            setInitializing(false);
        }
    };

    const handleGenerateScript = async (segment: Segment) => {
        setLoading(prev => ({ ...prev, [segment.id]: true }));
        try {
            const res = await fetch('/api/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: project.name,
                    productDescription: project.description,
                    segmentType: segment.type,
                    tone: project.tone,
                }),
            });
            const data = await res.json();
            if (data.script) {
                updateSegment(segment.id, { scriptContent: data.script });
            }
        } catch (error) {
            console.error('Error generating script:', error);
        } finally {
            setLoading(prev => ({ ...prev, [segment.id]: false }));
        }
    };

    const handleGenerateVoice = async (segment: Segment) => {
        if (!segment.scriptContent) return;
        setLoading(prev => ({ ...prev, [segment.id]: true }));
        try {
            const res = await fetch('/api/generate-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: segment.scriptContent,
                    projectId: project.id,
                    segmentId: segment.id,
                    voiceId: '21m00Tcm4TlvDq8ikWAM', // Default Rachel
                }),
            });
            const data = await res.json();
            if (data.audioUrl) {
                updateSegment(segment.id, { audioUrl: data.audioUrl });
            }
        } catch (error) {
            console.error('Error generating voice:', error);
        } finally {
            setLoading(prev => ({ ...prev, [segment.id]: false }));
        }
    };

    const playAudio = (url: string) => {
        const audio = new Audio(url);
        audio.play();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground">{project.baseUrl}</p>
                </div>
                <Button variant="outline">Settings</Button>
            </div>

            <Tabs defaultValue="segments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="segments">Segments & Scripts</TabsTrigger>
                    <TabsTrigger value="integration">Integration</TabsTrigger>
                </TabsList>

                <TabsContent value="segments" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* If no segments, show button to init defaults */}
                        {segments.length === 0 && (
                            <Card className="col-span-full">
                                <CardHeader>
                                    <CardTitle>No Segments Configured</CardTitle>
                                    <CardDescription>Initialize default segments to get started.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        onClick={handleInitializeDefaults}
                                        disabled={initializing}
                                    >
                                        {initializing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Initializing...
                                            </>
                                        ) : (
                                            'Initialize Defaults'
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {segments.map(segment => (
                            <Card key={segment.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg capitalize">{segment.type.replace('_', ' ')}</CardTitle>
                                        {segment.audioUrl && <Badge variant="secondary">Ready</Badge>}
                                    </div>
                                    <CardDescription>
                                        {segment.type === 'utm_source' ? `Source: ${segment.conditionValue}` :
                                            segment.type === 'language' ? `Lang: ${segment.conditionValue}` : 'Standard visitor'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Script</label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => handleGenerateScript(segment)}
                                                disabled={loading[segment.id]}
                                            >
                                                {loading[segment.id] ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wand2 className="mr-2 h-3 w-3" />}
                                                Generate
                                            </Button>
                                        </div>
                                        <Textarea
                                            value={segment.scriptContent}
                                            onChange={(e) => updateSegment(segment.id, { scriptContent: e.target.value })}
                                            className="min-h-[100px] text-sm"
                                            placeholder="Script will appear here..."
                                        />
                                    </div>

                                    {segment.audioUrl && (
                                        <div className="rounded-md bg-muted p-3 flex items-center justify-between">
                                            <span className="text-xs font-medium">Voice Preview</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8"
                                                onClick={() => playAudio(segment.audioUrl!)}
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="p-6 pt-0 mt-auto">
                                    <Button
                                        className="w-full"
                                        onClick={() => handleGenerateVoice(segment)}
                                        disabled={loading[segment.id] || !segment.scriptContent}
                                    >
                                        {loading[segment.id] ? 'Generating...' : segment.audioUrl ? 'Regenerate Voice' : 'Generate Voice'}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="integration">
                    <Card>
                        <CardHeader>
                            <CardTitle>Integration</CardTitle>
                            <CardDescription>Add this code to your website to enable VoiceHero.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md bg-muted p-4">
                                <code className="text-sm break-all">
                                    {`<script src="${clientEnv.APP_URL}/widget.js" data-site-id="${project.id}"></script>`}
                                </code>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
