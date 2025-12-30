import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { transcribeUserAudio } from '@/lib/gemini';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const jsonWithCors = (data: unknown, init?: ResponseInit) =>
    NextResponse.json(data, {
        ...init,
        headers: {
            ...corsHeaders,
            ...(init?.headers ?? {}),
        },
    });

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const siteId = formData.get('siteId') as string;

        if (!audioFile || !siteId) {
            return jsonWithCors({ error: 'Missing audio or siteId' }, { status: 400 });
        }

        // 1. Verify Project Exists
        const db = getDb();
        const projectDoc = await db.collection('projects').doc(siteId).get();

        if (!projectDoc.exists) {
            return jsonWithCors({ error: 'Project not found' }, { status: 404 });
        }

        // 2. Convert File to Buffer
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Transcribe User Audio (extract what they said)
        const transcription = await transcribeUserAudio(buffer);

        // 4. Save Transcription to Interaction Pool
        // Store in projects/{projectId}/interactions collection
        const interactionsRef = db
            .collection('projects')
            .doc(siteId)
            .collection('interactions');

        await interactionsRef.add({
            transcription: transcription,
            timestamp: new Date(),
            createdAt: new Date(),
            // Note: We do NOT save the audio file to reduce storage costs
        });

        // 5. Return success (no audio response)
        return jsonWithCors({
            success: true,
            message: 'Thank you for your feedback!',
            transcription: transcription, // Return transcription for UI display
        });

    } catch (error) {
        console.error('Conversation API Error:', error);
        return jsonWithCors({ error: 'Failed to process conversation' }, { status: 500 });
    }
}
