import { getModel } from '@/lib/firebase';
import { ScriptCritique, ScriptOptions } from '@/lib/types';

function ensureModel() {
    const model = getModel();
    if (!model) {
        throw new Error('Firebase client config is missing. Please set NEXT_PUBLIC_FIREBASE_* environment variables.');
    }
    return model;
}

export async function generateScript(
    productName: string,
    productDescription: string,
    segmentType: string,
    tone: string,
    options: ScriptOptions = {},
): Promise<string> {
    const resolvedTone = options.tone || tone;
    const languageLine = options.language
        ? `Language: ${options.language}`
        : 'Language: English';
    const lengthLine = options.wordCount
        ? `Target length: about ${options.wordCount} words.`
        : options.lengthSeconds
            ? `Target length: about ${options.lengthSeconds} seconds.`
            : 'Target length: under 60 words.';
    const ctaLine = options.ctaFocus
        ? `Call-to-action focus: ${options.ctaFocus}.`
        : 'Call-to-action focus: highlight the next best step.';

    const prompt = `
    You are a professional copywriter for a SaaS product called "${productName}".
    
    Product Description:
    ${productDescription}
    
    Target Audience Segment: ${segmentType}
    Tone: ${resolvedTone}
    ${languageLine}
    ${lengthLine}
    ${ctaLine}
    
    Task: Write a short, engaging spoken pitch script for this specific visitor segment.
    The script should be natural, conversational, and persuasive.
    Do not include any scene directions or sound effects, just the spoken words.
    If the output is longer than the target, trim it.
  `;

    try {
        const model = ensureModel();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
    return text || 'Error generating script.';
  } catch (error) {
    console.error('Error calling Gemini:', error);
    throw new Error('Failed to generate script');
  }
}

export async function critiqueScript(
    script: string,
    context: {
        segmentType: string;
        tone: string;
        language?: string;
        lengthSeconds?: number;
        wordCount?: number;
        ctaFocus?: string;
    },
): Promise<ScriptCritique> {
    const lengthLine = context.wordCount
        ? `Target length: about ${context.wordCount} words.`
        : context.lengthSeconds
            ? `Target length: about ${context.lengthSeconds} seconds.`
            : 'Target length: keep it concise.';
    const languageLine = context.language
        ? `Language: ${context.language}.`
        : 'Language: English.';
    const ctaLine = context.ctaFocus
        ? `CTA focus: ${context.ctaFocus}.`
        : 'CTA focus: identify the clearest next step.';

    const prompt = `
    You are an expert conversion copywriter.

    Script to critique:
    ${script}

    Context:
    Segment: ${context.segmentType}
    Tone: ${context.tone}
    ${languageLine}
    ${lengthLine}
    ${ctaLine}

    Task: Provide a concise critique with strengths, weaknesses, and specific improvement suggestions.
    Include a revised script that keeps the intent but improves clarity and persuasion.

    Output JSON only with the following shape:
    {
      "score": 0-10,
      "strengths": ["..."],
      "weaknesses": ["..."],
      "suggestions": ["..."],
      "revisedScript": "..."
    }
  `;

    try {
        const model = ensureModel();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const jsonString = text.replace(/```json\s*|```/g, '').trim();
        const data = JSON.parse(jsonString) as ScriptCritique;

        if (!data || typeof data !== 'object') {
            throw new Error('Invalid critique response');
        }

        const score = Number((data as ScriptCritique).score);
        const strengths = Array.isArray(data.strengths) ? data.strengths : null;
        const weaknesses = Array.isArray(data.weaknesses) ? data.weaknesses : null;
        const suggestions = Array.isArray(data.suggestions) ? data.suggestions : null;
        const revisedScript =
            typeof data.revisedScript === 'string' ? data.revisedScript : null;

        if (
            !Number.isFinite(score) ||
            score < 0 ||
            score > 10 ||
            !strengths ||
            !weaknesses ||
            !suggestions ||
            revisedScript === null
        ) {
            throw new Error('Invalid critique response');
        }

        return {
            score,
            strengths: strengths.filter((item) => typeof item === 'string'),
            weaknesses: weaknesses.filter((item) => typeof item === 'string'),
            suggestions: suggestions.filter((item) => typeof item === 'string'),
            revisedScript,
        };
    } catch (error) {
        console.error('Error generating script critique:', error);
        throw new Error('Failed to critique script');
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
        const model = ensureModel();
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

export async function transcribeUserAudio(
    audioBuffer: Buffer
): Promise<string> {
    const prompt = `
    Transcribe the user's speech from this audio recording.
    Return only the exact words the user said, without any additional commentary or formatting.
    If the audio is unclear or contains no speech, return an empty string.
    `;

    const audioBase64 = audioBuffer.toString('base64');

    try {
        const model = ensureModel();
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
        return response.text().trim();
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw new Error('Failed to transcribe audio');
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
        const model = ensureModel();
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
