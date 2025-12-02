import { NextResponse } from 'next/server';
import { generateVoice } from '@/lib/elevenlabs';
import { getDb } from '@/lib/db';
import { saveAudioFile } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, voiceId, projectId, segmentId } = body;

        const audioBuffer = await generateVoice(text, voiceId);

        // In a real app, we would upload this buffer to Google Cloud Storage
        // For MVP/Hackathon, we might just return the base64 or a temporary URL if we can't set up GCS easily.
        // However, the plan says "Stored directly as ElevenLabs URLs, or Downloaded and put in Cloud Storage".
        // ElevenLabs doesn't give a permanent URL unless we use their history API, but even then it's better to host it.
        // Let's assume we have GCS setup or we can just return base64 for the immediate demo if GCS is too much friction.
        // BUT, the widget needs a URL.
        // Let's try to use a data URI for now if the audio is short (20s is ~1MB maybe? might be heavy).
        // Better: use the history item ID from ElevenLabs if possible, or just mock the storage for now.

        // Actually, let's implement a simple file upload to GCS if we have the credentials.
        // If not, we can save to local disk (in `public/audio`) since we are running locally or on a simple server.
        // Since this is a hackathon project running locally for now, `public/audio` is the easiest.

        // Wait, `public` folder in Next.js is static. We can't write to it at runtime in production Vercel.
        // But for local demo it works.
        // Let's try to write to `public/audio`.

        const audioUrl = await saveAudioFile(audioBuffer, `${projectId}-${segmentId}`);

        // Update segment in Firestore
        if (projectId && segmentId) {
            const db = getDb();
            await db.collection('projects').doc(projectId).collection('segments').doc(segmentId).update({
                audioUrl,
                voiceId
            });
        }

        return NextResponse.json({ audioUrl });
    } catch (error) {
        console.error('Error generating voice:', error);
        return NextResponse.json({ error: 'Failed to generate voice' }, { status: 500 });
    }
}
