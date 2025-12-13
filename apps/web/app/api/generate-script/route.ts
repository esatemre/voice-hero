import { NextResponse } from 'next/server';
import { generateScript } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            productName,
            productDescription,
            segmentType,
            tone,
            language,
            lengthSeconds,
            wordCount,
            ctaFocus,
        } = body;

        const options = {
            ...(typeof language !== 'undefined' && { language }),
            ...(typeof lengthSeconds !== 'undefined' && { lengthSeconds }),
            ...(typeof wordCount !== 'undefined' && { wordCount }),
            ...(typeof ctaFocus !== 'undefined' && { ctaFocus }),
        };

        const script = await generateScript(
            productName,
            productDescription,
            segmentType,
            tone,
            options,
        );

        return NextResponse.json({ script });
    } catch (error) {
        console.error('Error generating script:', error);
        return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
    }
}
