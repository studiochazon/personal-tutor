/**
 * Gemini API Client
 * Provides functions to make requests to Google's Gemini API
 */

import { GEMINI_API_KEY } from '$env/static/private';

export interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface GeminiRequest {
    model: string;
    messages: GeminiMessage[];
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        topK?: number;
        topP?: number;
    };
}

export interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
            role: string;
        };
        finishReason: string;
        index: number;
    }>;
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

/**
 * Make a request to Gemini API
 */
export async function makeGeminiRequest(request: GeminiRequest): Promise<GeminiResponse> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    // Convert OpenAI-style messages to Gemini format
    const contents = request.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.parts[0].text }]
    }));

    const geminiRequest = {
        contents,
        generationConfig: request.generationConfig
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiRequest)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    return response.json();
}

/**
 * Convert OpenAI-style request to Gemini format
 */
export function convertOpenAIToGemini(openAIRequest: any): GeminiRequest {
    const messages: GeminiMessage[] = openAIRequest.messages.map((msg: any) => ({
        role: msg.role === 'system' ? 'user' : msg.role, // Gemini doesn't have system role
        parts: [{ text: msg.content }]
    }));

    // Merge system message with first user message if present
    if (openAIRequest.messages[0]?.role === 'system') {
        const systemContent = openAIRequest.messages[0].content;
        const userContent = openAIRequest.messages[1]?.content || '';
        
        messages[0] = {
            role: 'user',
            parts: [{ text: `${systemContent}\n\n${userContent}` }]
        };
        
        // Remove the duplicate user message
        if (messages.length > 1) {
            messages.splice(1, 1);
        }
    }

    return {
        model: openAIRequest.model,
        messages,
        generationConfig: {
            temperature: openAIRequest.temperature,
            maxOutputTokens: openAIRequest.max_tokens,
            topK: 40,
            topP: 0.95
        }
    };
}

/**
 * Convert Gemini response to OpenAI format for compatibility
 */
export function convertGeminiToOpenAI(geminiResponse: GeminiResponse): any {
    const content = geminiResponse.candidates[0]?.content?.parts[0]?.text || '';
    
    return {
        choices: [{
            message: {
                role: 'assistant',
                content: content
            },
            finish_reason: geminiResponse.candidates[0]?.finishReason || 'stop',
            index: 0
        }],
        usage: {
            prompt_tokens: geminiResponse.usageMetadata?.promptTokenCount || 0,
            completion_tokens: geminiResponse.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: geminiResponse.usageMetadata?.totalTokenCount || 0
        }
    };
}