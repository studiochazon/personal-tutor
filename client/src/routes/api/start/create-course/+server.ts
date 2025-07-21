import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConnection } from '$lib/database';
import { OPENAI_API_KEY } from '$env/static/private';
import { videoLogger } from '$lib/video-logger';
import { logOpenAIRequest } from '$lib/llm-logger';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface CreateCourseRequest {
	messages: ChatMessage[];
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!OPENAI_API_KEY) {
			return json(
				{ error: 'OpenAI API key not configured' },
				{ status: 500 }
			);
		}

		const { messages }: CreateCourseRequest = await request.json();

		if (!messages || !Array.isArray(messages)) {
			return json({ error: 'Invalid messages format' }, { status: 400 });
		}

		// Use OpenAI to extract structured course data from the conversation
		const courseData = await extractCourseFromConversation(messages);

		if (!courseData) {
			return json({ error: 'Could not extract course data from conversation' }, { status: 400 });
		}

		// Save course to database
		const connection = await getConnection();
		
		// For now, we'll use a default user ID (1) - in a real app, you'd get this from authentication
		const userId = 1;

		// Insert course
		const [courseResult] = await connection.execute(
			`INSERT INTO courses (title, description, difficulty, estimated_duration, user_id, is_published, created_at, updated_at) 
			 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
			[
				courseData.title,
				courseData.description,
				courseData.difficulty,
				courseData.estimated_duration || null,
				userId,
				false // Start as unpublished
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

		return json({
			success: true,
			course: {
				...course,
				lessons
			}
		});

	} catch (error) {
		console.error('Create course API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

async function extractCourseFromConversation(messages: ChatMessage[]): Promise<any> {
	try {
		// Get the user's prompt from the messages
		const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
		
		// Create a more robust prompt for course generation
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
      "video_url": "URL to relevant video content (YouTube, Vimeo, etc.)",
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
- Choose high-quality educational videos from YouTube, Vimeo, or other reputable platforms
- Video duration should be appropriate (2-15 minutes for most lessons)`;

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

		console.log('OpenAI response data:', JSON.stringify(data, null, 2));
		
		const content = data?.choices?.[0]?.message?.content;

		if (!content) {
			console.error('No content in OpenAI response:', data);
			throw new Error('No response content from OpenAI');
		}

		// Clean the content to extract JSON
		let jsonContent = content.trim();
		
		// Remove any markdown code blocks
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
		}
		
		// Try to find JSON object in the response
		const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			jsonContent = jsonMatch[0];
		}

		// Try to parse the JSON response
		try {
			const courseData = JSON.parse(jsonContent);
			
			// Validate and set defaults
			return {
				title: courseData.title || 'AI Generated Course',
				description: courseData.description || 'A comprehensive course created with AI assistance.',
				difficulty: courseData.difficulty || 'intermediate',
				estimated_duration: courseData.estimated_duration || 60,
				lessons: courseData.lessons && Array.isArray(courseData.lessons) ? courseData.lessons.map((lesson: any, index: number) => ({
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
						content: 'Welcome to your AI-generated course! This lesson will introduce you to the key concepts.',
						video_url: null,
						video_title: null,
						video_duration: null,
						order_index: 1,
						estimated_duration: 10
					}
				]
			};
		} catch (parseError) {
			console.error('Failed to parse course data:', parseError);
			console.error('Raw content:', content);
			
			// Generate a fallback course based on the user's request
			const fallbackTitle = userMessage.includes('course') ? 
				userMessage.replace(/create.*course.*about/i, '').trim() || 'AI Generated Course' :
				`Course about ${userMessage}`;
			
			return {
				title: fallbackTitle,
				description: `A comprehensive course about ${userMessage}. This course was generated with AI assistance and covers the essential topics you need to know.`,
				difficulty: 'intermediate',
				estimated_duration: 60,
				lessons: [
					{
						title: 'Introduction',
						content: `Welcome to your course about ${userMessage}! In this lesson, we'll introduce you to the fundamental concepts and what you can expect to learn throughout this course.`,
						video_url: null,
						video_title: null,
						video_duration: null,
						order_index: 1,
						estimated_duration: 10
					},
					{
						title: 'Getting Started',
						content: `Let's dive into the basics of ${userMessage}. This lesson will cover the essential foundations you need to understand before moving forward.`,
						video_url: null,
						video_title: null,
						video_duration: null,
						order_index: 2,
						estimated_duration: 15
					},
					{
						title: 'Core Concepts',
						content: `Now we'll explore the core concepts and principles related to ${userMessage}. This is where the real learning begins!`,
						video_url: null,
						video_title: null,
						video_duration: null,
						order_index: 3,
						estimated_duration: 20
					},
					{
						title: 'Practical Application',
						content: `Let's put what you've learned into practice. This lesson will show you how to apply the concepts of ${userMessage} in real-world scenarios.`,
						video_url: null,
						video_title: null,
						video_duration: null,
						order_index: 4,
						estimated_duration: 15
					}
				]
			};
		}

	} catch (error) {
		console.error('Error extracting course data:', error);
		return null;
	}
} 