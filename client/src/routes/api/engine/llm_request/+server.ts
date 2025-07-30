import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface LLMRequest {
	model: string;
	messages: Array<{
		role: 'system' | 'user' | 'assistant';
		content: string;
	}>;
	context: string;
	max_tokens?: number;
	temperature?: number;
	web_search_options?: object;
}

interface LLMResponse {
	success: boolean;
	response?: string;
	model?: string;
	log_id?: string;
	usage?: object;
	error?: string;
}

// Helper function to verify JWT token
function verifyAuthToken(request: Request): { userId: number; email: string } | null {
	try {
		const authHeader = request.headers.get('Authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return null;
		}

		const token = authHeader.substring(7);
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		
		if (decoded && decoded.userId && decoded.email) {
			return {
				userId: decoded.userId,
				email: decoded.email
			};
		}
		
		return null;
	} catch (error) {
		console.error('JWT verification error:', error);
		return null;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Verify authentication
		const authData = verifyAuthToken(request);
		if (!authData) {
			return json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 }
			);
		}

		if (!OPENAI_API_KEY) {
			return json(
				{ success: false, error: 'OpenAI API key not configured' },
				{ status: 500 }
			);
		}

		const { 
			model, 
			messages, 
			context, 
			max_tokens = 2000, 
			temperature = 0.7,
			web_search_options 
		}: LLMRequest = await request.json();

		// Validate required fields
		if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
			return json({
				success: false,
				error: 'Invalid request: model and messages array are required'
			}, { status: 400 });
		}

		// Build OpenAI request
		const openAIRequest: any = {
			model,
			messages,
			max_tokens
		};

		// Add temperature only for models that support it
		if (!model.includes('search-preview')) {
			openAIRequest.temperature = temperature;
		}

		// Add web search options if provided and model supports it
		if (web_search_options && model.includes('search-preview')) {
			openAIRequest.web_search_options = web_search_options;
		}

		console.log(`Making OpenAI API call with model: ${model}`);

		// Use logging wrapper for non-search models, direct call for search models
		let data;
		let logId;

		if (model.includes('search-preview')) {
			// Direct API call for search models (they don't work well with the logging wrapper)
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${OPENAI_API_KEY}`
				},
				body: JSON.stringify(openAIRequest)
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('OpenAI API error:', response.status, errorText);
				throw new Error(`OpenAI API error: ${response.status}`);
			}

			data = await response.json();
			logId = 'direct-call'; // Could implement separate logging for search models
		} else {
			// Use logging wrapper for standard models
			data = await logOpenAIRequest(
				openAIRequest,
				context || 'Engine API Request',
				async () => {
					const response = await fetch('https://api.openai.com/v1/chat/completions', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${OPENAI_API_KEY}`
						},
						body: JSON.stringify(openAIRequest)
					});

					if (!response.ok) {
						const errorText = await response.text();
						console.error('OpenAI API error:', response.status, errorText);
						throw new Error(`OpenAI API error: ${response.status}`);
					}

					return response;
				}
			);
			logId = 'logged'; // The logOpenAIRequest function handles the actual log ID
		}

		const responseContent = data?.choices?.[0]?.message?.content;
		const responseModel = data?.model || model;
		const usage = data?.usage;

		if (!responseContent) {
			console.error('No content in OpenAI response:', data);
			return json({
				success: false,
				error: 'No response content from OpenAI'
			}, { status: 500 });
		}

		return json({
			success: true,
			response: responseContent,
			model: responseModel,
			log_id: logId,
			usage: usage
		});

	} catch (error) {
		console.error('LLM request error:', error);
		
		// Handle specific OpenAI API errors
		if (error instanceof Error) {
			if (error.message.includes('429')) {
				return json({
					success: false,
					error: 'OpenAI API quota exceeded. Please try again later.'
				}, { status: 503 });
			} else if (error.message.includes('401')) {
				return json({
					success: false,
					error: 'OpenAI API authentication failed.'
				}, { status: 500 });
			}
		}
		
		return json({
			success: false,
			error: 'LLM request failed. Please try again later.'
		}, { status: 500 });
	}
};