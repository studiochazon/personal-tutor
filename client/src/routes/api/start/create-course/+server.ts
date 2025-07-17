import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConnection } from '$lib/database';
import { OPENAI_API_KEY } from '$env/static/private';

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
			await connection.execute(
				`INSERT INTO lessons (course_id, title, content, order_index, estimated_duration, created_at, updated_at) 
				 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
				[
					courseId,
					lesson.title,
					lesson.content,
					lesson.order_index,
					lesson.estimated_duration || null
				]
			);
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
		// Create a prompt to extract structured course data
		const extractionPrompt = `Based on the conversation below, extract the course information in the following JSON format:

{
  "title": "Course Title",
  "description": "Course description",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_duration": number in minutes,
  "lessons": [
    {
      "title": "Lesson Title",
      "content": "Lesson content",
      "order_index": number,
      "estimated_duration": number in minutes
    }
  ]
}

Conversation:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Extract only the JSON, no additional text.`;

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
						content: 'You are a course data extraction assistant. Extract course information from conversations and return only valid JSON.'
					},
					{
						role: 'user',
						content: extractionPrompt
					}
				],
				max_tokens: 2000,
				temperature: 0.1
			})
		});

		if (!response.ok) {
			throw new Error('Failed to extract course data');
		}

		const data = await response.json();
		const content = data.choices[0]?.message?.content;

		if (!content) {
			throw new Error('No response from OpenAI');
		}

		// Try to parse the JSON response
		try {
			const courseData = JSON.parse(content);
			
			// Validate and set defaults
			return {
				title: courseData.title || 'Untitled Course',
				description: courseData.description || 'A comprehensive course created with AI assistance.',
				difficulty: courseData.difficulty || 'intermediate',
				estimated_duration: courseData.estimated_duration || 60,
				lessons: courseData.lessons || [
					{
						title: 'Introduction',
						content: 'Welcome to the course!',
						order_index: 1,
						estimated_duration: 10
					}
				]
			};
		} catch (parseError) {
			console.error('Failed to parse course data:', parseError);
			// Return a default course structure
			return {
				title: 'AI Generated Course',
				description: 'A comprehensive course created with AI assistance.',
				difficulty: 'intermediate',
				estimated_duration: 60,
				lessons: [
					{
						title: 'Introduction',
						content: 'Welcome to your AI-generated course! This lesson will introduce you to the key concepts.',
						order_index: 1,
						estimated_duration: 10
					}
				]
			};
		}

	} catch (error) {
		console.error('Error extracting course data:', error);
		return null;
	}
} 