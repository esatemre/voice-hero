import { serverEnv } from "./env";

export async function generateVoice(
    text: string,
    voiceId: string = '21m00Tcm4TlvDq8ikWAM' // Default voice (Rachel)
): Promise<ArrayBuffer> {
    const apiKey = serverEnv.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error('Missing ElevenLabs API Key');
    }

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        console.error('ElevenLabs API Error:', error);
        throw new Error('Failed to generate voice');
    }

    return await response.arrayBuffer();
}
