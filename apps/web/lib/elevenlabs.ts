import { serverEnv } from "./env";
import { VoiceProfile } from "./types";

export class ElevenLabsError extends Error {
    statusCode?: number;
    type?: string;
    details?: string;

    constructor(message: string, options?: { statusCode?: number; type?: string; details?: string }) {
        super(message);
        this.name = 'ElevenLabsError';
        this.statusCode = options?.statusCode;
        this.type = options?.type;
        this.details = options?.details;
    }
}

interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    preview_url?: string;
    labels?: Record<string, string>;
    description?: string;
}

interface ElevenLabsVoicesResponse {
    voices?: ElevenLabsVoice[];
}

function extractErrorMessage(payload: unknown): { message: string; type?: string; details?: string } {
    if (!payload || typeof payload !== 'object') {
        return { message: 'Unknown ElevenLabs API error.' };
    }

    const asRecord = payload as Record<string, unknown>;
    const detail = asRecord.detail;
    if (detail && typeof detail === 'object') {
        const detailRecord = detail as Record<string, unknown>;
        const message = typeof detailRecord.message === 'string' ? detailRecord.message : 'ElevenLabs API error.';
        const type = typeof detailRecord.type === 'string' ? detailRecord.type : undefined;
        return { message, type, details: message };
    }

    if (typeof detail === 'string') {
        return { message: detail, details: detail };
    }

    if (typeof asRecord.message === 'string') {
        return { message: asRecord.message, details: asRecord.message };
    }

    if (typeof asRecord.error === 'string') {
        return { message: asRecord.error, details: asRecord.error };
    }

    return { message: 'ElevenLabs API error.' };
}

async function buildElevenLabsError(response: Response): Promise<ElevenLabsError> {
    const fallbackMessage = `ElevenLabs API request failed (${response.status}).`;
    let parsedMessage = fallbackMessage;
    let parsedType: string | undefined;
    let parsedDetails: string | undefined;

    const text = await response.text();
    if (text) {
        try {
            const payload = JSON.parse(text);
            const extracted = extractErrorMessage(payload);
            parsedMessage = extracted.message || fallbackMessage;
            parsedType = extracted.type;
            parsedDetails = extracted.details;
        } catch (error) {
            parsedMessage = text;
            parsedDetails = text;
        }
    }

    return new ElevenLabsError(parsedMessage, {
        statusCode: response.status,
        type: parsedType,
        details: parsedDetails,
    });
}

export async function generateVoice(
    text: string,
    voiceId: string = '21m00Tcm4TlvDq8ikWAM' // Default voice (Rachel)
): Promise<ArrayBuffer> {
    const apiKey = serverEnv.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new ElevenLabsError('Missing ElevenLabs API Key', {
            type: 'missing_api_key',
        });
    }

    let response: Response;
    try {
        response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );
    } catch (error) {
        throw new ElevenLabsError('Failed to reach ElevenLabs API.', {
            type: 'network_error',
            details: error instanceof Error ? error.message : undefined,
        });
    }

    if (!response.ok) {
        const apiError = await buildElevenLabsError(response);
        console.error('ElevenLabs API Error:', apiError.message);
        throw apiError;
    }

    return await response.arrayBuffer();
}

export async function fetchVoices(): Promise<VoiceProfile[]> {
    const apiKey = serverEnv.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new ElevenLabsError('Missing ElevenLabs API Key', {
            type: 'missing_api_key',
        });
    }

    let response: Response;
    try {
        response = await fetch('https://api.elevenlabs.io/v1/voices', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
        });
    } catch (error) {
        throw new ElevenLabsError('Failed to reach ElevenLabs API.', {
            type: 'network_error',
            details: error instanceof Error ? error.message : undefined,
        });
    }

    if (!response.ok) {
        const apiError = await buildElevenLabsError(response);
        console.error('ElevenLabs API Error:', apiError.message);
        throw apiError;
    }

    const payload = (await response.json()) as ElevenLabsVoicesResponse;
    const voices = Array.isArray(payload.voices) ? payload.voices : [];

    return voices.map((voice) => ({
        id: voice.voice_id,
        name: voice.name,
        previewUrl: voice.preview_url,
        labels: voice.labels,
        description: voice.description,
    }));
}
