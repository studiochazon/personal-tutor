import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface LessonPlanningRequest {
	topic: string;
	audience: 'beginner' | 'intermediate' | 'advanced';
	depth: 'overview' | 'comprehensive' | 'deep-dive';
	lessonCount?: number;
	duration?: number; // Total course duration in minutes
}

interface LessonPlan {
	title: string;
	objectives: string[];
	duration: number;
	order: number;
	key_concepts: string[];
	prerequisites?: string[];
}

interface LessonPlanningResponse {
	success: boolean;
	lessons?: LessonPlan[];
	total_duration?: number;
	difficulty_level?: string;
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

function createLessonPlanningPrompt(
	topic: string, 
	audience: string, 
	depth: string, 
	lessonCount: number,
	duration: number
): string {
	const audienceDescriptions = {
		beginner: 'newcomers with little to no prior knowledge',
		intermediate: 'learners with some basic understanding',
		advanced: 'experienced learners looking to deepen their expertise'
	};

	const depthDescriptions = {
		overview: 'high-level concepts and essential information',
		comprehensive: 'detailed explanations with practical examples',
		'deep-dive': 'advanced concepts, edge cases, and expert-level insights'
	};

	return `You are an expert curriculum designer. Create a comprehensive lesson plan for a course on "${topic}".

## Course Parameters
- **Topic**: ${topic}
- **Target Audience**: ${audienceDescriptions[audience as keyof typeof audienceDescriptions]}
- **Depth**: ${depthDescriptions[depth as keyof typeof depthDescriptions]}
- **Number of Lessons**: ${lessonCount}
- **Total Duration**: ${duration} minutes
- **Average Lesson Duration**: ${Math.round(duration / lessonCount)} minutes

## Requirements

Create a JSON structure with exactly ${lessonCount} lessons. Each lesson should have:
- **title**: Clear, engaging lesson title
- **objectives**: 3-5 specific learning objectives (what students will be able to do)
- **duration**: Estimated time in minutes
- **order**: Lesson sequence number (1-${lessonCount})
- **key_concepts**: 4-6 main concepts covered
- **prerequisites**: Any prior knowledge needed (optional)

## Design Principles

### Pedagogical Structure
- **Progressive Learning**: Each lesson builds on previous ones
- **Clear Objectives**: Specific, measurable learning outcomes
- **Logical Flow**: Concepts introduced in optimal order
- **Balanced Duration**: Appropriate time allocation per lesson

### Content Guidelines
- **${audience} Level**: Use language and examples appropriate for ${audienceDescriptions[audience as keyof typeof audienceDescriptions]}
- **${depth} Coverage**: Provide ${depthDescriptions[depth as keyof typeof depthDescriptions]}
- **Practical Focus**: Include hands-on elements and real-world applications
- **Engagement**: Create compelling, memorable lesson titles

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "lessons": [
    {
      "title": "Lesson title",
      "objectives": [
        "Students will be able to...",
        "Students will understand...",
        "Students will apply..."
      ],
      "duration": number,
      "order": number,
      "key_concepts": [
        "Concept 1",
        "Concept 2"
      ],
      "prerequisites": ["Prior knowledge if needed"]
    }
  ],
  "total_duration": ${duration},
  "difficulty_level": "${audience}"
}

Create the lesson plan now.`;
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
			topic, 
			audience, 
			depth, 
			lessonCount = 6,
			duration = 90 
		}: LessonPlanningRequest = await request.json();

		// Validate required fields
		if (!topic || !audience || !depth) {
			return json({
				success: false,
				error: 'Missing required fields: topic, audience, and depth are required'
			}, { status: 400 });
		}

		// Validate enum values
		if (!['beginner', 'intermediate', 'advanced'].includes(audience)) {
			return json({
				success: false,
				error: 'Invalid audience. Must be: beginner, intermediate, or advanced'
			}, { status: 400 });
		}

		if (!['overview', 'comprehensive', 'deep-dive'].includes(depth)) {
			return json({
				success: false,
				error: 'Invalid depth. Must be: overview, comprehensive, or deep-dive'
			}, { status: 400 });
		}

		// Create the lesson planning prompt
		const systemPrompt = createLessonPlanningPrompt(topic, audience, depth, lessonCount, duration);

		const openAIRequest = {
			model: 'gpt-4',
			messages: [
				{
					role: 'system',
					content: 'You are an expert curriculum designer. Respond with ONLY valid JSON. Do not include explanatory text or markdown formatting.'
				},
				{
					role: 'user',
					content: systemPrompt
				}
			],
			max_tokens: 2000,
			temperature: 0.3
		};

		console.log(`Creating lesson plan for: ${topic} (${audience}, ${depth})`);

		// Make API call with logging
		const data = await logOpenAIRequest(
			openAIRequest,
			`Lesson planning: ${topic}`,
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
			const lessonPlanData = JSON.parse(jsonContent);
			
			// Validate response structure
			if (!lessonPlanData.lessons || !Array.isArray(lessonPlanData.lessons)) {
				throw new Error('Invalid response structure: lessons array is required');
			}

			// Ensure all lessons have required fields
			const validatedLessons = lessonPlanData.lessons.map((lesson: any, index: number) => ({
				title: lesson.title || `Lesson ${index + 1}`,
				objectives: Array.isArray(lesson.objectives) ? lesson.objectives : [`Learn about ${topic}`],
				duration: lesson.duration || Math.round(duration / lessonCount),
				order: lesson.order || index + 1,
				key_concepts: Array.isArray(lesson.key_concepts) ? lesson.key_concepts : [],
				prerequisites: Array.isArray(lesson.prerequisites) ? lesson.prerequisites : undefined
			}));

			return json({
				success: true,
				lessons: validatedLessons,
				total_duration: lessonPlanData.total_duration || duration,
				difficulty_level: lessonPlanData.difficulty_level || audience,
				log_id: 'logged'
			});

		} catch (parseError) {
			console.error('Failed to parse lesson plan data:', parseError);
			console.error('Raw content:', responseContent);
			
			// Return fallback lesson plan
			const fallbackLessons = Array.from({ length: lessonCount }, (_, index) => ({
				title: `${topic} - Part ${index + 1}`,
				objectives: [`Understand key concepts of ${topic}`],
				duration: Math.round(duration / lessonCount),
				order: index + 1,
				key_concepts: [`Core concept ${index + 1}`],
				prerequisites: index === 0 ? undefined : [`Completion of Part ${index}`]
			}));

			return json({
				success: true,
				lessons: fallbackLessons,
				total_duration: duration,
				difficulty_level: audience,
				log_id: 'fallback'
			});
		}

	} catch (error) {
		console.error('Lesson planning error:', error);
		
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
			error: 'Lesson planning failed. Please try again later.'
		}, { status: 500 });
	}
};