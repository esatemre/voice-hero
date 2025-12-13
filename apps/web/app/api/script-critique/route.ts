import { NextResponse } from 'next/server';
import { critiqueScript } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            script,
            segmentType,
            tone,
            language,
            lengthSeconds,
            wordCount,
            ctaFocus,
        } = body;

        if (!script || !segmentType || !tone) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 },
            );
        }

        const critique = await critiqueScript(script, {
            segmentType,
            tone,
            language,
            lengthSeconds,
            wordCount,
            ctaFocus,
        });

        return NextResponse.json(critique);
    } catch (error) {
        console.error('Error generating script critique:', error);
        return NextResponse.json(
            { error: 'Failed to critique script' },
            { status: 500 },
        );
    }
}
