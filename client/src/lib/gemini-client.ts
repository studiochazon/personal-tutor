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
    tools?: Array<{
        google_search?: {};
    }>;
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
        groundingMetadata?: {
            webSearchQueries?: string[];
            searchEntryPoint?: {
                renderedContent: string;
            };
            groundingChunks?: Array<{
                web?: {
                    uri: string;
                    title: string;
                };
            }>;
            groundingSupports?: Array<{
                segment: {
                    startIndex: number;
                    endIndex: number;
                    text: string;
                };
                groundingChunkIndices: number[];
            }>;
        };
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
        generationConfig: request.generationConfig,
        tools: request.tools
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

    const responseData = await response.json();
    console.log('🔍 Raw Gemini response:', JSON.stringify(responseData, null, 2));
    
    return responseData;
}

/**
 * Convert OpenAI-style request to Gemini format with optional Google Search
 */
export function convertOpenAIToGemini(openAIRequest: any, enableGoogleSearch: boolean = false): GeminiRequest {
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

    const request: GeminiRequest = {
        model: openAIRequest.model,
        messages,
        generationConfig: {
            temperature: openAIRequest.temperature,
            maxOutputTokens: openAIRequest.max_tokens,
            topK: 40,
            topP: 0.95
        }
    };

    // Add Google Search tool if enabled
    if (enableGoogleSearch) {
        request.tools = [{ google_search: {} }];
    }

    return request;
}

/**
 * Convert Gemini response to OpenAI format for compatibility
 */
export function convertGeminiToOpenAI(geminiResponse: GeminiResponse): any {
    // Check if response has candidates
    if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
        console.error('❌ Gemini response missing candidates:', geminiResponse);
        throw new Error('Gemini response missing candidates array');
    }
    
    const candidate = geminiResponse.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('❌ Gemini candidate missing content/parts:', candidate);
        throw new Error('Gemini candidate missing content or parts');
    }
    
    const content = candidate.content.parts[0]?.text || '';
    
    if (!content) {
        console.error('❌ Gemini response has empty content:', candidate);
        throw new Error('Gemini response contains empty content');
    }
    
    return {
        choices: [{
            message: {
                role: 'assistant',
                content: content
            },
            finish_reason: candidate.finishReason || 'stop',
            index: 0
        }],
        usage: {
            prompt_tokens: geminiResponse.usageMetadata?.promptTokenCount || 0,
            completion_tokens: geminiResponse.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: geminiResponse.usageMetadata?.totalTokenCount || 0
        }
    };
}