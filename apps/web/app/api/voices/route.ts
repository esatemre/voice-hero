import { NextResponse } from 'next/server';
import { ElevenLabsError, fetchVoices } from '@/lib/elevenlabs';
import { VoiceProfile } from '@/lib/types';

const CACHE_TTL_MS = 1000 * 60 * 5;
let cachedVoices: { voices: VoiceProfile[]; expiresAt: number } | null = null;

export async function GET(request: Request) {
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === 'true';
    const now = Date.now();

    if (!refresh && cachedVoices && cachedVoices.expiresAt > now) {
        return NextResponse.json({ voices: cachedVoices.voices, cached: true });
    }

    try {
        const voices = await fetchVoices();
        cachedVoices = {
            voices,
            expiresAt: now + CACHE_TTL_MS,
        };
        return NextResponse.json({ voices, cached: false });
    } catch (error) {
        console.error('Error fetching voices:', error);

        if (error instanceof ElevenLabsError) {
            const message = error.message || 'Failed to fetch voices';
            const normalizedMessage = message.toLowerCase();
            let status = error.statusCode || 500;
            let code = 'elevenlabs_error';
            let responseMessage = message;

            if (error.type === 'missing_api_key') {
                status = 500;
                code = 'missing_api_key';
                responseMessage = 'Missing ElevenLabs API key on the server.';
            } else if (
                error.statusCode === 401 ||
                normalizedMessage.includes('api key') ||
                normalizedMessage.includes('unauthorized')
            ) {
                status = 401;
                code = 'invalid_api_key';
                responseMessage = 'Invalid ElevenLabs API key.';
            } else if (error.statusCode === 429 || normalizedMessage.includes('rate limit')) {
                status = 429;
                code = 'rate_limited';
                responseMessage = 'ElevenLabs rate limit reached. Please retry shortly.';
            } else if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
                status = error.statusCode;
            }

            return NextResponse.json(
                { error: responseMessage, code, details: error.details },
                { status },
            );
        }

        return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
    }
}
