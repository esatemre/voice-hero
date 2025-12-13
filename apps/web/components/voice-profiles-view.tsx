'use client';

import { useEffect, useRef, useState } from 'react';
import { VoiceProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, Pause, AlertTriangle } from 'lucide-react';

interface VoicesResponse {
    voices: VoiceProfile[];
}

function getLabelTags(labels?: Record<string, string>) {
    if (!labels) return [];
    return Object.entries(labels)
        .filter(([key, value]) => key && value)
        .map(([key, value]) => `${key}: ${value}`);
}

export default function VoiceProfilesView() {
    const [voices, setVoices] = useState<VoiceProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchVoices = async () => {
            setLoading(true);
            setError('');
            setErrorCode('');
            try {
                const res = await fetch('/api/voices');
                const data = await res.json();

                if (!res.ok) {
                    const message = data?.error || 'Failed to fetch voices';
                    const err = new Error(message) as Error & { code?: string };
                    err.code = data?.code;
                    throw err;
                }

                if (mounted) {
                    setVoices((data as VoicesResponse).voices || []);
                }
            } catch (err: unknown) {
                if (mounted) {
                    const message = err instanceof Error ? err.message : 'Failed to fetch voices';
                    const code =
                        err && typeof err === 'object' && 'code' in err
                            ? (err as { code?: string }).code || ''
                            : '';
                    setError(message);
                    setErrorCode(code);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchVoices();

        return () => {
            mounted = false;
        };
    }, []);

    const handlePreview = (voice: VoiceProfile) => {
        if (!voice.previewUrl) return;

        if (playingId === voice.id) {
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(voice.previewUrl);
        audioRef.current = audio;
        setPlayingId(voice.id);
        audio.play().catch(() => {
            setPlayingId(null);
        });
        audio.onended = () => {
            setPlayingId(null);
        };
    };

    const errorHint = errorCode === 'missing_api_key'
        ? 'Add ELEVENLABS_API_KEY to your server environment and try again.'
        : errorCode === 'invalid_api_key'
            ? 'Double-check the ElevenLabs API key configured on the server.'
            : '';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Voice Profiles</CardTitle>
                <CardDescription>
                    Browse ElevenLabs voices and preview samples before assigning them to segments.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading voices...
                    </div>
                ) : error ? (
                    <div className="space-y-2 text-sm text-red-600">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <span>{error}</span>
                        </div>
                        {errorHint && (
                            <div className="text-xs text-muted-foreground">
                                {errorHint}
                            </div>
                        )}
                    </div>
                ) : voices.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground">
                        No voices returned from ElevenLabs yet.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {voices.map((voice) => {
                            const tags = getLabelTags(voice.labels).slice(0, 4);
                            const isPlaying = playingId === voice.id;
                            return (
                                <Card key={voice.id} className="flex flex-col">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">{voice.name}</CardTitle>
                                        {voice.description && (
                                            <CardDescription>{voice.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map((tag) => (
                                                    <Badge key={tag} variant="outline">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handlePreview(voice)}
                                                disabled={!voice.previewUrl}
                                            >
                                                {isPlaying ? (
                                                    <Pause className="mr-2 h-4 w-4" />
                                                ) : (
                                                    <Play className="mr-2 h-4 w-4" />
                                                )}
                                                {isPlaying ? 'Pause preview' : 'Play preview'}
                                            </Button>
                                            {!voice.previewUrl && (
                                                <span className="text-xs text-muted-foreground">
                                                    No preview available
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
