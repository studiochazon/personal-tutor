import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface ChatRequest {
	messages: ChatMessage[];
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!OPENAI_API_KEY) {
			return json(
				{ error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.' },
				{ status: 500 }
			);
		}

		const { messages }: ChatRequest = await request.json();

		if (!messages || !Array.isArray(messages)) {
			return json({ error: 'Invalid messages format' }, { status: 400 });
		}

		// Call OpenAI API
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-4',
				messages: messages,
				max_tokens: 2000,
				temperature: 0.7,
				stream: false
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('OpenAI API error:', errorData);
			return json(
				{ error: 'Failed to get response from OpenAI API' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		const assistantMessage = data.choices[0]?.message?.content;

		if (!assistantMessage) {
			return json({ error: 'No response from OpenAI' }, { status: 500 });
		}

		// Check if the response indicates a complete course structure
		const hasCourseStructure = checkForCourseStructure(assistantMessage);

		return json({
			content: assistantMessage,
			courseData: hasCourseStructure ? extractCourseData(assistantMessage) : null
		});

	} catch (error) {
		console.error('Chat API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

function checkForCourseStructure(message: string): boolean {
	// Check if the message contains course structure indicators
	const indicators = [
		'course structure',
		'lesson plan',
		'learning objectives',
		'course outline',
		'curriculum',
		'lesson 1:',
		'lesson 2:',
		'week 1:',
		'week 2:'
	];

	return indicators.some(indicator => 
		message.toLowerCase().includes(indicator.toLowerCase())
	);
}

function extractCourseData(message: string): any {
	// This is a simple extraction - in a real app, you'd want more sophisticated parsing
	// For now, we'll return a basic structure that the frontend can work with
	return {
		title: extractTitle(message),
		description: extractDescription(message),
		difficulty: extractDifficulty(message),
		lessons: extractLessons(message)
	};
}

function extractTitle(message: string): string {
	// Look for title patterns
	const titleMatch = message.match(/(?:course title|title|course name):\s*([^\n]+)/i);
	return titleMatch ? titleMatch[1].trim() : 'Untitled Course';
}

function extractDescription(message: string): string {
	// Look for description patterns
	const descMatch = message.match(/(?:description|overview|summary):\s*([^\n]+)/i);
	return descMatch ? descMatch[1].trim() : 'A comprehensive course created with AI assistance.';
}

function extractDifficulty(message: string): 'beginner' | 'intermediate' | 'advanced' {
	const lowerMessage = message.toLowerCase();
	if (lowerMessage.includes('beginner')) return 'beginner';
	if (lowerMessage.includes('advanced')) return 'advanced';
	return 'intermediate';
}

function extractLessons(message: string): Array<{ title: string; content: string; order_index: number }> {
	const lessons: Array<{ title: string; content: string; order_index: number }> = [];
	
	// Split by lesson indicators
	const lessonSections = message.split(/(?:lesson|week|module)\s*\d+/i);
	
	if (lessonSections.length > 1) {
		lessonSections.slice(1).forEach((section, index) => {
			const lines = section.split('\n').filter(line => line.trim());
			if (lines.length > 0) {
				const title = lines[0].replace(/^[:\-\s]+/, '').trim();
				const content = lines.slice(1).join('\n').trim();
				
				if (title) {
					lessons.push({
						title: title || `Lesson ${index + 1}`,
						content: content || 'Content will be generated.',
						order_index: index + 1
					});
				}
			}
		});
	}
	
	// If no lessons found, create a basic structure
	if (lessons.length === 0) {
		lessons.push({
			title: 'Introduction',
			content: 'Welcome to the course! This lesson will introduce you to the key concepts.',
			order_index: 1
		});
	}
	
	return lessons;
} 