import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface ContentGenerationRequest {
	lesson_title: string;
	learning_objectives: string[];
	topic: string;
	audience: 'beginner' | 'intermediate' | 'advanced';
	format: 'markdown' | 'html' | 'text';
	duration?: number; // Lesson duration in minutes
	include_examples?: boolean;
	include_exercises?: boolean;
	web_search?: boolean; // Use web search for current information
}

interface GeneratedContent {
	content: string;
	examples: string[];
	exercises: string[];
	key_points: string[];
	estimated_reading_time: number;
}

interface ContentGenerationResponse {
	success: boolean;
	generated_content?: GeneratedContent;
	format?: string;
	log_id?: string;
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

function createContentGenerationPrompt(
	lessonTitle: string,
	objectives: string[],
	topic: string,
	audience: string,
	format: string,
	duration: number,
	includeExamples: boolean,
	includeExercises: boolean
): string {
	const audienceGuidelines = {
		beginner: {
			language: 'simple, clear language avoiding jargon',
			approach: 'step-by-step explanations with plenty of context',
			examples: 'basic, relatable examples from everyday life'
		},
		intermediate: {
			language: 'clear explanations with some technical terms',
			approach: 'balanced theory and practice with moderate complexity',
			examples: 'relevant industry examples and use cases'
		},
		advanced: {
			language: 'precise technical language and concepts',
			approach: 'in-depth analysis with advanced concepts',
			examples: 'complex, real-world scenarios and edge cases'
		}
	};

	const formatGuidelines = {
		markdown: 'Use proper markdown formatting with headers, lists, code blocks, and emphasis',
		html: 'Use semantic HTML tags with proper structure and formatting',
		text: 'Use plain text with clear paragraph breaks and simple formatting'
	};

	const guidelines = audienceGuidelines[audience as keyof typeof audienceGuidelines];
	const formatInstructions = formatGuidelines[format as keyof typeof formatGuidelines];

	return `You are an expert educational content creator. Create comprehensive lesson content for "${lessonTitle}".

## Lesson Parameters
- **Topic**: ${topic}
- **Target Audience**: ${audience} level learners
- **Duration**: ${duration} minutes
- **Format**: ${format}
- **Include Examples**: ${includeExamples}
- **Include Exercises**: ${includeExercises}

## Learning Objectives
${objectives.map(obj => `- ${obj}`).join('\n')}

## Content Requirements

### Writing Style
- Use ${guidelines.language}
- Apply ${guidelines.approach}
- Provide ${guidelines.examples}

### Content Structure
1. **Introduction** (10-15% of content)
   - Hook the learner's attention
   - Clearly state what they'll learn
   - Provide context and relevance

2. **Main Content** (70-80% of content)
   - Cover all learning objectives systematically
   - Include clear explanations and concepts
   - Use appropriate depth for ${audience} learners
   - Break complex topics into digestible sections

3. **Summary & Next Steps** (5-10% of content)
   - Recap key concepts
   - Connect to future learning
   - Provide actionable takeaways

### Formatting
- ${formatInstructions}
- Use headers to organize content clearly
- Include bullet points and numbered lists
- Emphasize important concepts

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "content": "The main lesson content formatted as ${format}",
  "examples": [
    "Practical example 1",
    "Practical example 2",
    "Real-world scenario"
  ],
  "exercises": [
    "Practice exercise 1",
    "Hands-on activity 2", 
    "Challenge problem"
  ],
  "key_points": [
    "Key takeaway 1",
    "Important concept 2",
    "Main principle 3"
  ],
  "estimated_reading_time": ${Math.round(duration * 0.7)}
}

${includeExamples ? '**Include specific, relevant examples that illustrate the concepts.**' : '**Focus on clear explanations without separate examples.**'}

${includeExercises ? '**Include practical exercises that help learners apply what they\'ve learned.**' : '**Focus on content delivery without separate exercises.**'}

Create the lesson content now.`;
}

async function makeContentGenerationRequest(
	prompt: string,
	useWebSearch: boolean,
	context: string
): Promise<any> {
	if (useWebSearch) {
		// Use web search model for current information
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
						content: 'You are an expert educational content creator. Use web search to find current, accurate information. Respond with ONLY valid JSON.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 3000
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OpenAI API error:', response.status, errorText);
			throw new Error(`OpenAI API error: ${response.status}`);
		}

		return response.json();
	} else {
		// Use standard model with logging
		return await logOpenAIRequest(
			{
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: 'You are an expert educational content creator. Respond with ONLY valid JSON. Do not include explanatory text or markdown formatting.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 3000,
				temperature: 0.4
			},
			context,
			async () => {
				const response = await fetch('https://api.openai.com/v1/chat/completions', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${OPENAI_API_KEY}`
					},
					body: JSON.stringify({
						model: 'gpt-4',
						messages: [
							{
								role: 'system',
								content: 'You are an expert educational content creator. Respond with ONLY valid JSON.'
							},
							{
								role: 'user',
								content: prompt
							}
						],
						max_tokens: 3000,
						temperature: 0.4
					})
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error('OpenAI API error:', response.status, errorText);
					throw new Error(`OpenAI API error: ${response.status}`);
				}

				return response;
			}
		);
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
			lesson_title,
			learning_objectives,
			topic,
			audience,
			format,
			duration = 15,
			include_examples = true,
			include_exercises = true,
			web_search = false
		}: ContentGenerationRequest = await request.json();

		// Validate required fields
		if (!lesson_title || !learning_objectives || !topic || !audience || !format) {
			return json({
				success: false,
				error: 'Missing required fields: lesson_title, learning_objectives, topic, audience, and format are required'
			}, { status: 400 });
		}

		// Validate enum values
		if (!['beginner', 'intermediate', 'advanced'].includes(audience)) {
			return json({
				success: false,
				error: 'Invalid audience. Must be: beginner, intermediate, or advanced'
			}, { status: 400 });
		}

		if (!['markdown', 'html', 'text'].includes(format)) {
			return json({
				success: false,
				error: 'Invalid format. Must be: markdown, html, or text'
			}, { status: 400 });
		}

		if (!Array.isArray(learning_objectives) || learning_objectives.length === 0) {
			return json({
				success: false,
				error: 'learning_objectives must be a non-empty array'
			}, { status: 400 });
		}

		// Create the content generation prompt
		const prompt = createContentGenerationPrompt(
			lesson_title,
			learning_objectives,
			topic,
			audience,
			format,
			duration,
			include_examples,
			include_exercises
		);

		console.log(`Generating content for: ${lesson_title} (${audience}, ${format})`);

		// Make API call
		const data = await makeContentGenerationRequest(
			prompt,
			web_search,
			`Content generation: ${lesson_title}`
		);

		const responseContent = data?.choices?.[0]?.message?.content;

		if (!responseContent) {
			console.error('No content in OpenAI response:', data);
			return json({
				success: false,
				error: 'No response content from OpenAI'
			}, { status: 500 });
		}

		// Parse JSON response
		let jsonContent = responseContent.trim();
		
		// Remove markdown code blocks if present
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
		}
		
		// Extract JSON from response
		const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			jsonContent = jsonMatch[0];
		}

		try {
			const contentData = JSON.parse(jsonContent);
			
			// Validate and set defaults
			const generatedContent: GeneratedContent = {
				content: contentData.content || `Content for ${lesson_title} will be generated here.`,
				examples: Array.isArray(contentData.examples) ? contentData.examples : [],
				exercises: Array.isArray(contentData.exercises) ? contentData.exercises : [],
				key_points: Array.isArray(contentData.key_points) ? contentData.key_points : [],
				estimated_reading_time: contentData.estimated_reading_time || Math.round(duration * 0.7)
			};

			return json({
				success: true,
				generated_content: generatedContent,
				format: format,
				log_id: web_search ? 'web-search' : 'logged'
			});

		} catch (parseError) {
			console.error('Failed to parse content data:', parseError);
			console.error('Raw content:', responseContent);
			
			// Return fallback content
			const fallbackContent: GeneratedContent = {
				content: `# ${lesson_title}\n\nThis lesson covers the essential concepts of ${topic}.\n\n## Learning Objectives\n${learning_objectives.map(obj => `- ${obj}`).join('\n')}\n\n## Content\n\nDetailed content will be provided here covering all the learning objectives for ${audience} level learners.`,
				examples: include_examples ? [`Example 1 for ${topic}`, `Practical scenario for ${lesson_title}`] : [],
				exercises: include_exercises ? [`Practice exercise for ${lesson_title}`, `Apply your knowledge of ${topic}`] : [],
				key_points: [`Key concept from ${lesson_title}`, `Important takeaway about ${topic}`],
				estimated_reading_time: Math.round(duration * 0.7)
			};

			return json({
				success: true,
				generated_content: fallbackContent,
				format: format,
				log_id: 'fallback'
			});
		}

	} catch (error) {
		console.error('Content generation error:', error);
		
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
			error: 'Content generation failed. Please try again later.'
		}, { status: 500 });
	}
};