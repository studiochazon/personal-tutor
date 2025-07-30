import { OPENAI_API_KEY } from '$env/static/private';
import { simpleLogger } from '$lib/simple-logger';

interface CourseCreationRequest {
	userPrompt: string;
	audience?: string;
	depth?: string;
}

interface SimpleCourseResult {
	success: boolean;
	response?: string;
	logId?: string;
	model?: string;
	error?: string;
}

/**
 * Simple Course Creation Service
 * - Uses OpenAI web search for current information
 * - Outputs natural language text responses
 * - Saves to text files with consecutive numbering
 * - Enhanced prompting with structured lessons
 */
export class SimpleCourseService {
	
	/**
	 * Create a course using the simple web search system
	 */
	async createCourse(request: CourseCreationRequest): Promise<SimpleCourseResult> {
		try {
			if (!OPENAI_API_KEY) {
				return { success: false, error: 'OpenAI API key not configured' };
			}

			// Enhanced system prompt for structured course creation
			const systemPrompt = this.createSystemPrompt();

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
							content: request.userPrompt
						}
					],
					max_tokens: 4000
					// Note: gpt-4o-search-preview doesn't support temperature parameter
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('OpenAI API error:', response.status, errorText);
				
				// Handle specific OpenAI API errors
				if (response.status === 429) {
					return { 
						success: false,
						error: 'OpenAI API quota exceeded. Please try again later or contact support.' 
					};
				} else if (response.status === 401) {
					return { 
						success: false,
						error: 'OpenAI API authentication failed. Please contact support.' 
					};
				}
				
				return { 
					success: false,
					error: 'Course creation failed. Please try again later.' 
				};
			}

			const data = await response.json();
			console.log('OpenAI response received:', JSON.stringify(data, null, 2));
			
			const responseContent = data?.choices?.[0]?.message?.content;
			const model = data?.model || 'gpt-4o-search-preview';

			if (!responseContent) {
				console.error('No content in OpenAI response:', data);
				return { success: false, error: 'No response content from OpenAI' };
			}

			// Log the simple response
			const logId = await simpleLogger.logSimpleResponse(
				request.userPrompt,
				responseContent,
				model
			);

			return {
				success: true,
				response: responseContent,
				logId: logId,
				model: model
			};

		} catch (error) {
			console.error('Simple course creation error:', error);
			
			// Handle specific errors
			if (error instanceof Error) {
				if (error.message.includes('429')) {
					return { 
						success: false,
						error: 'OpenAI API quota exceeded. Please try again later or contact support.' 
					};
				} else if (error.message.includes('401')) {
					return { 
						success: false,
						error: 'OpenAI API authentication failed. Please contact support.' 
					};
				}
			}
			
			return { 
				success: false,
				error: 'Course creation failed. Please try again later.' 
			};
		}
	}

	/**
	 * Create enhanced system prompt for structured lessons
	 */
	private createSystemPrompt(): string {
		return `Create a comprehensive course based on the user's request. Include:

1. Course title and description
2. Learning objectives  
3. Well-organized lessons with:
   - Clear lesson titles
   - Detailed lesson content
   - Real YouTube video URLs (embed format: https://www.youtube.com/embed/VIDEO_ID)
   - Estimated duration for each lesson

Format the response as a complete course outline with all lessons clearly structured. Use real, working YouTube video URLs that are relevant to each lesson topic. Include current information from web search when available.`;
	}
}

export const simpleCourseService = new SimpleCourseService();