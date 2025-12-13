import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateConversationResponse } from '@/lib/gemini';
import { ElevenLabsError, generateVoice } from '@/lib/elevenlabs';
import { saveAudioFile } from '@/lib/storage';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const siteId = formData.get('siteId') as string;

        if (!audioFile || !siteId) {
            return NextResponse.json(
                { error: 'Missing audio or siteId' },
                {
                    status: 400,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        // 1. Get Project Context
        const db = getDb();
        const projectDoc = await db.collection('projects').doc(siteId).get();

        if (!projectDoc.exists) {
            return NextResponse.json(
                { error: 'Project not found' },
                {
                    status: 404,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
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

        return NextResponse.json(
            {
                audioUrl,
                transcript,
            },
            {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );

    } catch (error) {
        console.error('Conversation API Error:', error);

        if (error instanceof ElevenLabsError) {
            const message = error.message || 'Failed to process conversation';
            const normalizedMessage = message.toLowerCase();
            let status = error.statusCode || 500;
            let code = 'elevenlabs_error';
            let responseMessage = message;

            if (normalizedMessage.includes('model') && normalizedMessage.includes('deprecat')) {
                status = 400;
                code = 'model_deprecated';
                responseMessage = 'Voice model deprecated. Please switch to eleven_turbo_v2_5.';
            } else if (error.type === 'missing_api_key') {
                status = 500;
                code = 'missing_api_key';
                responseMessage = 'Missing ElevenLabs API key on the server.';
            } else if (error.statusCode === 401 || normalizedMessage.includes('api key') || normalizedMessage.includes('unauthorized')) {
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
                {
                    status,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        return NextResponse.json(
            { error: 'Failed to process conversation' },
            {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
}
