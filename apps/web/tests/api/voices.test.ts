import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalFetch = global.fetch;
const mockedEnv = {
    ELEVENLABS_API_KEY: 'test-key',
};

vi.mock('@/lib/env', () => ({
    serverEnv: mockedEnv,
}));

describe('GET /api/voices', () => {
    beforeEach(() => {
        vi.resetModules();
        global.fetch = vi.fn();
        mockedEnv.ELEVENLABS_API_KEY = 'test-key';
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('returns voices and caches results', async () => {
        const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                voices: [
                    {
                        voice_id: 'voice-1',
                        name: 'Alpha',
                        labels: { accent: 'us', gender: 'female' },
                        preview_url: 'https://example.com/alpha.mp3',
                    },
                ],
            }),
        });

        const { GET } = await import('../../app/api/voices/route');
        const response = await GET(new Request('http://localhost/api/voices'));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.voices).toHaveLength(1);
        expect(data.voices[0]).toEqual(
            expect.objectContaining({
                id: 'voice-1',
                name: 'Alpha',
                previewUrl: 'https://example.com/alpha.mp3',
            }),
        );

        const response2 = await GET(new Request('http://localhost/api/voices'));
        await response2.json();

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns missing api key error', async () => {
        mockedEnv.ELEVENLABS_API_KEY = undefined;

        const { GET } = await import('../../app/api/voices/route');
        const response = await GET(new Request('http://localhost/api/voices'));
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.code).toBe('missing_api_key');
    });

    it('returns invalid api key error', async () => {
        const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValue({
            ok: false,
            status: 401,
            text: async () =>
                JSON.stringify({
                    detail: {
                        message: 'Invalid API key',
                    },
                }),
        });

        const { GET } = await import('../../app/api/voices/route');
        const response = await GET(new Request('http://localhost/api/voices'));
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.code).toBe('invalid_api_key');
    });
});
