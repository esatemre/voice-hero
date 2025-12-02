import { NextResponse } from 'next/server';
import { generateScript } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productName, productDescription, segmentType, tone } = body;

        const script = await generateScript(productName, productDescription, segmentType, tone);

        return NextResponse.json({ script });
    } catch (error) {
        console.error('Error generating script:', error);
        return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
    }
}
