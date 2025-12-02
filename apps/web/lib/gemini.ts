import { model } from '@/lib/firebase';

export async function generateScript(
    productName: string,
    productDescription: string,
    segmentType: string,
    tone: string
): Promise<string> {
    const prompt = `
    You are a professional copywriter for a SaaS product called "${productName}".
    
    Product Description:
    ${productDescription}
    
    Target Audience Segment: ${segmentType}
    Tone: ${tone}
    
    Task: Write a short, engaging 20-second spoken pitch script for this specific visitor segment.
    The script should be natural, conversational, and persuasive.
    Do not include any scene directions or sound effects, just the spoken words.
    Keep it under 60 words.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text || 'Error generating script.';
    } catch (error) {
        console.error('Error calling Gemini:', error);
        throw new Error('Failed to generate script');
    }
}

export async function processScrapedContent(
    rawContent: {
        title: string;
        description: string;
        headline: string;
        bullets: string[];
        ctaText: string[];
    }
): Promise<{ description: string; summary: string; details: string }> {
    const prompt = `
    You are an expert content strategist. I will provide you with raw scraped content from a landing page.
    
    Raw Content:
    Title: ${rawContent.title}
    Headline: ${rawContent.headline}
    Meta Description: ${rawContent.description}
    Key Points: ${rawContent.bullets.join(', ')}
    CTAs: ${rawContent.ctaText.join(', ')}
    
    Task 1: Create a "Nice Description" (max 2 sentences) that captures the core value proposition. This should be clean and marketing-ready.
    Task 2: Create a "Summary" (max 3 sentences) that explains what the product does in plain English.
    Task 3: Extract "Important Details" (bullet points) that would be useful for generating a sales script later. Focus on unique selling points, target audience, and specific benefits.
    
    Output Format (JSON only):
    {
      "description": "...",
      "summary": "...",
      "details": "..."
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json\n|\n```/g, '').trim();
        const data = JSON.parse(jsonString);

        return {
            description: data.description || '',
            summary: data.summary || '',
            details: data.details || ''
        };
    } catch (error) {
        console.error('Error processing scraped content with Gemini:', error);
        throw new Error('Failed to process content');
    }
}

export async function generateConversationResponse(
    audioBuffer: Buffer,
    context: { name: string; summary: string; details: string }
): Promise<string> {
    const prompt = `
    You are a helpful voice assistant for a product called "${context.name}".
    
    Product Context:
    Summary: ${context.summary}
    Details: ${context.details}
    
    The user has just asked a question via audio. 
    Listen to their question and provide a helpful, concise response (max 2 sentences).
    Keep the tone conversational and friendly.
    Do not use markdown formatting, just plain text suitable for text-to-speech.
    `;

    const audioBase64 = audioBuffer.toString('base64');

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'audio/mp3',
                    data: audioBase64
                }
            }
        ]);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating conversation response:', error);
        throw new Error('Failed to generate conversation response');
    }
}
