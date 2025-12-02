import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateConversationResponse } from '@/lib/gemini';
import { generateVoice } from '@/lib/elevenlabs';
import { saveAudioFile } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const siteId = formData.get('siteId') as string;

        if (!audioFile || !siteId) {
            return NextResponse.json({ error: 'Missing audio or siteId' }, { status: 400 });
        }

        // 1. Get Project Context
        const db = getDb();
        const projectDoc = await db.collection('projects').doc(siteId).get();

        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projectDoc.data();
        const context = {
            name: project?.name || 'Product',
            summary: project?.aiSummary || '',
            details: project?.aiDetails || '',
        };

        // 2. Convert File to Buffer
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Generate Text Response (Gemini Multimodal)
        const transcript = await generateConversationResponse(buffer, context);

        // 4. Generate Audio Response (ElevenLabs)
        const audioResponseBuffer = await generateVoice(transcript);

        // 5. Save Audio File
        const audioUrl = await saveAudioFile(audioResponseBuffer, `conversation-${siteId}`);

        return NextResponse.json({
            audioUrl,
            transcript,
        });

    } catch (error) {
        console.error('Conversation API Error:', error);
        return NextResponse.json({ error: 'Failed to process conversation' }, { status: 500 });
    }
}
