import { getConnection } from '$lib/database';
import { OPENAI_API_KEY } from '$env/static/private';
import { videoLogger, convertToYouTubeEmbedUrl } from '$lib/video-logger';
import { validateAndGetFallbackVideo } from '$lib/video-validator';
import { logOpenAIRequest } from '$lib/llm-logger';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface CourseCreationRequest {
	userPrompt: string;
	audience?: string;
	depth?: string;
}

interface CourseCreationResult {
	success: boolean;
	course?: any;
	error?: string;
}

/**
 * Original Complex Course Creation Service
 * - Creates structured JSON courses
 * - Stores in database with full course/lesson entities
 * - Includes video validation and fallback systems
 * - Uses complex prompting and JSON parsing
 */
export class OriginalCourseService {
	
	/**
	 * Create a course using the original complex system
	 */
	async createCourse(request: CourseCreationRequest, userId: number): Promise<CourseCreationResult> {
		try {
			if (!OPENAI_API_KEY) {
				return { success: false, error: 'OpenAI API key not configured' };
			}

			// Create complex system prompt based on audience and depth
			const systemPrompt = this.createSystemPrompt(request.audience, request.depth);
			
			// Create messages array for OpenAI
			const messages: ChatMessage[] = [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: request.userPrompt.trim() }
			];

			// Extract course data from conversation
			const courseData = await this.extractCourseFromConversation(messages);
			
			if (!courseData) {
				return { success: false, error: 'Could not extract course data from conversation' };
			}

			// Save course to database
			const course = await this.saveCourseToDatabase(courseData, userId);
			
			return { success: true, course };

		} catch (error) {
			console.error('Original course creation error:', error);
			return { 
				success: false, 
				error: error instanceof Error ? error.message : 'Course creation failed' 
			};
		}
	}

	/**
	 * Create complex system prompt with audience and depth preferences
	 */
	private createSystemPrompt(audience = 'beginners', depth = 'comprehensive'): string {
		return `You are an expert educational content creator and curriculum designer for Personal Tutor AI. Your role is to create comprehensive, engaging, and well-structured learning courses based on user requests.

## Core Principles

### 1. Educational Excellence
- Create content that follows proven learning methodologies
- Structure courses with clear learning objectives
- Ensure progressive difficulty and logical flow
- Include practical examples and real-world applications
- Design for different learning styles (visual, auditory, kinesthetic)

### 2. Content Quality Standards
- Write clear, concise, and engaging content
- Use active voice and conversational tone
- Include relevant examples and case studies
- Provide actionable insights and practical takeaways
- Ensure accuracy and up-to-date information

### 3. Course Structure Guidelines
- **Course Title**: Clear, descriptive, and engaging
- **Description**: Comprehensive overview of what learners will gain
- **Difficulty Level**: ${audience === 'beginners' ? 'beginner' : audience === 'advanced' ? 'advanced' : 'intermediate'}
- **Estimated Duration**: Realistic time commitment in minutes
- **Lessons**: ${depth === 'overview' ? '3-5' : depth === 'deep-dive' ? '10-15' : '5-10'} lessons per course, depending on complexity

## Content Guidelines

### Writing Style
- Use clear, simple language appropriate for ${audience} level
- Avoid jargon unless necessary, and always explain technical terms
- Write in an encouraging, supportive tone
- Use bullet points and numbered lists for better readability
- Include "Pro Tips" and "Common Mistakes to Avoid" sections

### Depth and Coverage
- ${depth === 'overview' ? 'Provide a high-level overview with key concepts and essential information' : depth === 'deep-dive' ? 'Provide comprehensive coverage with detailed explanations, advanced concepts, and extensive examples' : 'Provide comprehensive coverage with detailed explanations and practical examples'}
- ${depth === 'overview' ? 'Focus on breadth over depth' : depth === 'deep-dive' ? 'Include advanced topics, edge cases, and expert-level insights' : 'Balance breadth and depth appropriately'}

## Lesson Structure Template

Each lesson should follow this structure:

1. **Introduction** (10-15% of content)
   - Hook the learner's interest
   - State learning objectives
   - Provide context and relevance

2. **Main Content** (70-80% of content)
   - Core concepts and explanations
   - Examples and demonstrations
   - Step-by-step processes
   - Best practices and tips

3. **Practice/Application** (10-15% of content)
   - Hands-on exercises
   - Real-world scenarios
   - Self-assessment questions
   - Next steps and preparation`;
	}

	/**
	 * Extract structured course data from OpenAI conversation
	 */
	private async extractCourseFromConversation(messages: ChatMessage[]): Promise<any> {
		try {
			const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
			
			const extractionPrompt = `You are an expert educational content creator. Based on the user's request below, create a comprehensive course structure.

User Request: "${userMessage}"

Generate a course with the following JSON structure (respond ONLY with valid JSON, no additional text):

{
  "title": "Engaging and descriptive course title",
  "description": "Comprehensive overview of what learners will gain from this course",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_duration": number in minutes,
  "lessons": [
    {
      "title": "Clear lesson title",
      "content": "Comprehensive lesson content with clear structure, examples, and practical exercises. Use markdown formatting for better readability.",
      "order_index": number,
      "estimated_duration": number in minutes,
      "video_url": "https://www.youtube.com/embed/ACTUAL_VIDEO_ID",
      "video_title": "Title of the video content",
      "video_duration": number in seconds
    }
  ]
}

Guidelines:
- Create 5-10 lessons depending on topic complexity
- Each lesson should be 10-30 minutes of content
- Include practical examples and exercises
- Use clear, engaging language
- Structure content logically from basic to advanced concepts
- Ensure the difficulty level matches the content
- **IMPORTANT**: Include relevant video sources for each lesson when they would enhance learning
- Choose high-quality educational videos from YouTube
- **CRITICAL**: Always use REAL YouTube embed URLs with actual video IDs (e.g., https://www.youtube.com/embed/W6NZfCO5SIk)
- **DO NOT USE PLACEHOLDERS** like VIDEO_ID1, VIDEO_ID2, etc. - use actual YouTube video IDs
- Video duration should be appropriate (2-15 minutes for most lessons)
- For each lesson, find a real YouTube video that matches the lesson topic and use its actual video ID`;

			const openAIRequest = {
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: 'You are a course generation assistant. You must respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or additional content outside the JSON object.'
					},
					{
						role: 'user',
						content: extractionPrompt
					}
				],
				max_tokens: 3000,
				temperature: 0.3
			};

			const data = await logOpenAIRequest(
				openAIRequest,
				userMessage,
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
						throw new Error(`Failed to extract course data: ${response.status}`);
					}

					return response;
				}
			);

			const content = data?.choices?.[0]?.message?.content;
			if (!content) {
				throw new Error('No response content from OpenAI');
			}

			// Parse JSON response
			let jsonContent = content.trim();
			
			// Remove markdown code blocks
			if (jsonContent.startsWith('```json')) {
				jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
			} else if (jsonContent.startsWith('```')) {
				jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
			}
			
			const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				jsonContent = jsonMatch[0];
			}

			const courseData = JSON.parse(jsonContent);
			
			// Validate and set defaults
			return {
				title: courseData.title || 'AI Generated Course',
				description: courseData.description || 'A comprehensive course created with AI assistance.',
				difficulty: courseData.difficulty || 'intermediate',
				estimated_duration: courseData.estimated_duration || 60,
				lessons: courseData.lessons && Array.isArray(courseData.lessons) ? 
					courseData.lessons.map((lesson: any, index: number) => ({
						title: lesson.title || `Lesson ${index + 1}`,
						content: lesson.content || 'Lesson content will be added here.',
						video_url: lesson.video_url || null,
						video_title: lesson.video_title || null,
						video_duration: lesson.video_duration || null,
						order_index: lesson.order_index || index + 1,
						estimated_duration: lesson.estimated_duration || 15
					})) : [
						{
							title: 'Introduction',
							content: 'Welcome to your AI-generated course!',
							video_url: null,
							video_title: null,
							video_duration: null,
							order_index: 1,
							estimated_duration: 10
						}
					]
			};

		} catch (error) {
			console.error('Error extracting course data:', error);
			throw error;
		}
	}

	/**
	 * Save course data to database
	 */
	private async saveCourseToDatabase(courseData: any, userId: number): Promise<any> {
		const connection = await getConnection();
		
		// Insert course
		const [courseResult] = await connection.execute(
			`INSERT INTO courses (title, description, difficulty, estimated_duration, owned_by, is_published, created_at, updated_at) 
			 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				courseData.title,
				courseData.description,
				courseData.difficulty,
				courseData.estimated_duration || null,
				userId,
				true // Automatically publish courses created from prompts
			]
		);

		const courseId = (courseResult as any).insertId;

		// Insert lessons
		for (const lesson of courseData.lessons) {
			const [lessonResult] = await connection.execute(
				`INSERT INTO lessons (course_id, title, content, video_url, video_title, video_duration, order_index, estimated_duration, created_at, updated_at) 
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
				[
					courseId,
					lesson.title,
					lesson.content,
					lesson.video_url || null,
					lesson.video_title || null,
					lesson.video_duration || null,
					lesson.order_index,
					lesson.estimated_duration || null
				]
			);

			const lessonId = (lessonResult as any).insertId;
			
			// Log video source if present
			if (lesson.video_url) {
				videoLogger.logVideoSource(
					lessonId,
					lesson.title,
					courseId,
					courseData.title,
					lesson.video_url,
					lesson.video_title,
					lesson.video_duration
				);
			}
		}

		// Get the created course with lessons
		const [courseRows] = await connection.execute(
			'SELECT * FROM courses WHERE id = ?',
			[courseId]
		);
		const course = (courseRows as any)[0];

		const [lessonRows] = await connection.execute(
			'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
			[courseId]
		);
		const lessons = lessonRows as any[];

		return {
			...course,
			lessons
		};
	}
}

export const originalCourseService = new OriginalCourseService();