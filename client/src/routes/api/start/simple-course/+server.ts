import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { simpleLogger } from '$lib/simple-logger';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface SimpleCourseRequest {
	userPrompt: string;
}

// Helper function to verify JWT token and get user ID
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
				{ error: 'Authentication required' },
				{ status: 401 }
			);
		}

		if (!OPENAI_API_KEY) {
			return json(
				{ error: 'OpenAI API key not configured' },
				{ status: 500 }
			);
		}

		const { userPrompt }: SimpleCourseRequest = await request.json();

		if (!userPrompt || typeof userPrompt !== 'string') {
			return json({ error: 'Invalid user prompt' }, { status: 400 });
		}

		// Enhanced system prompt for structured course creation
		const systemPrompt = `Create a comprehensive course based on the user's request. Include:

1. Course title and description
2. Learning objectives  
3. Well-organized lessons with:
   - Clear lesson titles
   - Detailed lesson content
   - Real YouTube video URLs (embed format: https://www.youtube.com/embed/VIDEO_ID)
   - Estimated duration for each lesson

Format the response as a complete course outline with all lessons clearly structured. Use real, working YouTube video URLs that are relevant to each lesson topic. Include current information from web search when available.`;

		try {
			console.log('Making OpenAI API call with web search for course creation...');

			// Use OpenAI web search model
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${OPENAI_API_KEY}`
				},
				body: JSON.stringify({
					model: 'gpt-4o-search-preview',
					web_search_options: {},
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: userPrompt
						}
					],
					max_tokens: 4000
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('OpenAI API error:', response.status, errorText);
				
				// Handle specific OpenAI API errors
				if (response.status === 429) {
					return json({ 
						error: 'OpenAI API quota exceeded. Please try again later or contact support.' 
					}, { status: 503 });
				} else if (response.status === 401) {
					return json({ 
						error: 'OpenAI API authentication failed. Please contact support.' 
					}, { status: 500 });
				}
				
				return json({ 
					error: 'Course creation failed. Please try again later.' 
				}, { status: 500 });
			}

			const data = await response.json();
			console.log('OpenAI response received:', JSON.stringify(data, null, 2));
			
			const responseContent = data?.choices?.[0]?.message?.content;
			const model = data?.model || 'gpt-4o-search-preview';

			if (!responseContent) {
				console.error('No content in OpenAI response:', data);
				return json({ error: 'No response content from OpenAI' }, { status: 500 });
			}

			// Log the simple response
			const logId = await simpleLogger.logSimpleResponse(
				userPrompt,
				responseContent,
				model
			);

			return json({
				success: true,
				response: responseContent,
				logId: logId,
				model: model,
				userId: authData.userId
			});

		} catch (error) {
			console.error('Course creation error:', error);
			
			// Handle specific errors
			if (error instanceof Error) {
				if (error.message.includes('429')) {
					return json({ 
						error: 'OpenAI API quota exceeded. Please try again later or contact support.' 
					}, { status: 503 });
				} else if (error.message.includes('401')) {
					return json({ 
						error: 'OpenAI API authentication failed. Please contact support.' 
					}, { status: 500 });
				}
			}
			
			return json({ 
				error: 'Course creation failed. Please try again later.' 
			}, { status: 500 });
		}

	} catch (error) {
		console.error('Simple course creation API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}; 