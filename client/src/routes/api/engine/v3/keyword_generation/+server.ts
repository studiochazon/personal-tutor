import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface KeywordGenerationRequest {
	course_title: string;
	course_topic: string;
	lessons: Array<{
		title: string;
		key_concepts: string[];
		objectives: string[];
	}>;
	audience: 'beginner' | 'intermediate' | 'advanced';
	depth: 'overview' | 'comprehensive' | 'deep-dive';
}

interface KeywordCloud {
	primary_keywords: string[];      // 5-8 most important keywords
	secondary_keywords: string[];    // 10-15 supporting keywords  
	long_tail_keywords: string[];    // 15-20 specific phrases
	video_search_terms: string[];    // 20-30 optimized for video search
	excluded_terms: string[];        // Terms to avoid in searches
}

interface KeywordGenerationResponse {
	success: boolean;
	keyword_cloud?: KeywordCloud;
	total_keywords?: number;
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

function createKeywordGenerationPrompt(
	courseTitle: string,
	courseTopic: string,
	lessons: any[],
	audience: string,
	depth: string
): string {
	const lessonDetails = lessons.map((lesson, index) => 
		`${index + 1}. **${lesson.title}**
   - Key Concepts: ${lesson.key_concepts.join(', ')}
   - Objectives: ${lesson.objectives.join('; ')}`
	).join('\n\n');

	return `You are an expert content strategist. Generate a comprehensive keyword cloud for finding educational videos for this course.

## Course Information
- **Title**: ${courseTitle}
- **Topic**: ${courseTopic}
- **Audience**: ${audience}
- **Depth**: ${depth}
- **Number of Lessons**: ${lessons.length}

## Lesson Details
${lessonDetails}

## Task: Generate Comprehensive Keyword Cloud

Create a strategic keyword cloud optimized for finding high-quality educational videos across all video platforms (YouTube, Vimeo, etc.).

### Keyword Categories

1. **Primary Keywords** (5-8 terms)
   - Core concepts that define the course
   - Most important search terms
   - Broad but specific to the topic

2. **Secondary Keywords** (10-15 terms)
   - Supporting concepts from lessons
   - Related terminology and synonyms
   - Industry-specific terms

3. **Long-tail Keywords** (15-20 phrases)
   - Specific multi-word phrases
   - Natural language queries
   - Educational context phrases like "how to", "tutorial", "explained"

4. **Video Search Terms** (20-30 optimized terms)
   - YouTube/video-specific terms
   - Terms that work well with video discovery
   - Include educational modifiers: "tutorial", "course", "lesson", "guide"
   - Audience-specific terms: "beginner", "introduction", "basics" (for beginners)

5. **Excluded Terms** (5-10 terms)
   - Terms to avoid that might bring irrelevant results
   - Overly broad or unrelated terms

### Guidelines
- Focus on ${audience}-level content
- Optimize for ${depth} coverage
- Include educational keywords: "tutorial", "explained", "course", "lesson"
- Consider different ways experts refer to these concepts
- Include both technical and layperson terms
- Think about what someone would search for when looking for videos on this topic

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "primary_keywords": [
    "core concept 1",
    "main topic term",
    "essential keyword"
  ],
  "secondary_keywords": [
    "supporting concept",
    "related term",
    "industry term"
  ],
  "long_tail_keywords": [
    "how to learn specific concept",
    "complete guide to topic",
    "topic explained for beginners"
  ],
  "video_search_terms": [
    "topic tutorial",
    "concept lesson",
    "guide for beginners",
    "topic course online"
  ],
  "excluded_terms": [
    "overly broad term",
    "unrelated concept"
  ]
}

Generate the keyword cloud now.`;
}

// New endpoint for parsing course plans from text
export const PATCH: RequestHandler = async ({ request }) => {
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

		const body = await request.json();
		const { course_plan_text, audience = 'intermediate', depth = 'comprehensive' } = body;

		// Validate required fields
		if (!course_plan_text) {
			return json({
				success: false,
				error: 'Missing required field: course_plan_text is required'
			}, { status: 400 });
		}

		// Create the keyword extraction prompt for course plan text
		const prompt = `You are an expert content strategist. Extract and generate comprehensive keywords from this course plan text for finding educational videos and materials online.

## Course Plan Text:
${course_plan_text}

## Task: Extract and Generate Keywords

Analyze the course plan and generate a comprehensive keyword cloud optimized for finding high-quality educational content online (videos, articles, resources).

### Keyword Categories

1. **Primary Keywords** (5-8 terms)
   - Core topics and concepts from the course
   - Main subject areas covered
   - Essential terms that define the course

2. **Secondary Keywords** (10-15 terms)
   - Supporting concepts from lessons
   - Related terminology and technical terms
   - Key concepts mentioned throughout

3. **Long-tail Keywords** (15-20 phrases)
   - Specific phrases from lesson titles and descriptions
   - Natural language queries people might search
   - Educational phrases like "introduction to", "history of", "types of"

4. **Video Search Terms** (20-30 optimized terms)
   - Terms optimized for video discovery
   - Include educational modifiers: "tutorial", "explained", "guide", "course"
   - Audience-specific terms based on complexity

5. **Excluded Terms** (5-10 terms)
   - Overly broad terms that might bring irrelevant results
   - Terms that are too general or unrelated

### Guidelines
- Extract actual topics and concepts mentioned in the text
- Include variations and synonyms of key terms
- Consider different academic levels and approaches
- Focus on terms that would help find educational content
- Include both specific and general terms for comprehensive coverage

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "primary_keywords": [
    "extracted main concept 1",
    "core topic from course",
    "essential subject area"
  ],
  "secondary_keywords": [
    "supporting concept",
    "technical term from lessons",
    "related terminology"
  ],
  "long_tail_keywords": [
    "specific phrase from course plan",
    "introduction to topic name",
    "types of concept mentioned"
  ],
  "video_search_terms": [
    "topic tutorial",
    "concept explained",
    "course topic guide",
    "learn topic basics"
  ],
  "excluded_terms": [
    "overly broad term",
    "unrelated concept"
  ]
}

Generate the keyword cloud now based on the provided course plan text.`;

		console.log(`Extracting keywords from course plan text (${course_plan_text.length} characters)`);

		// Make API call with logging
		const data = await logOpenAIRequest(
			{
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: 'You are an expert content strategist specializing in keyword extraction from educational content. Respond with ONLY valid JSON.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 2000,
				temperature: 0.3
			},
			`Course plan keyword extraction`,
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
								content: 'You are an expert content strategist specializing in keyword extraction. Respond with ONLY valid JSON.'
							},
							{
								role: 'user',
								content: prompt
							}
						],
						max_tokens: 2000,
						temperature: 0.3
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

		const responseContent = data?.choices?.[0]?.message?.content;

		if (!responseContent) {
			console.error('No content in OpenAI response:', data);
			return json({
				success: false,
				error: 'No response content from OpenAI'
			}, { status: 500 });
		}

		// Parse JSON response (same parsing logic as existing POST method)
		let jsonContent = responseContent.trim();
		
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
		}
		
		const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			jsonContent = jsonMatch[0];
		}

		try {
			const keywordData = JSON.parse(jsonContent);
			
			const keywordCloud: KeywordCloud = {
				primary_keywords: Array.isArray(keywordData.primary_keywords) ? keywordData.primary_keywords : [],
				secondary_keywords: Array.isArray(keywordData.secondary_keywords) ? keywordData.secondary_keywords : [],
				long_tail_keywords: Array.isArray(keywordData.long_tail_keywords) ? keywordData.long_tail_keywords : [],
				video_search_terms: Array.isArray(keywordData.video_search_terms) ? keywordData.video_search_terms : [],
				excluded_terms: Array.isArray(keywordData.excluded_terms) ? keywordData.excluded_terms : []
			};

			const totalKeywords = keywordCloud.primary_keywords.length + 
								 keywordCloud.secondary_keywords.length + 
								 keywordCloud.long_tail_keywords.length + 
								 keywordCloud.video_search_terms.length;

			return json({
				success: true,
				keyword_cloud: keywordCloud,
				total_keywords: totalKeywords,
				log_id: 'course_plan_extraction'
			});

		} catch (parseError) {
			console.error('Failed to parse keyword data:', parseError);
			console.error('Raw content:', responseContent);
			
			return json({
				success: false,
				error: 'Failed to parse keyword extraction results'
			}, { status: 500 });
		}

	} catch (error) {
		console.error('Course plan keyword extraction error:', error);
		
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
			error: 'Keyword extraction failed. Please try again later.'
		}, { status: 500 });
	}
};

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
			course_title,
			course_topic,
			lessons,
			audience,
			depth
		}: KeywordGenerationRequest = await request.json();

		// Validate required fields
		if (!course_title || !course_topic || !lessons || !audience || !depth) {
			return json({
				success: false,
				error: 'Missing required fields: course_title, course_topic, lessons, audience, and depth are required'
			}, { status: 400 });
		}

		// Validate lessons structure
		if (!Array.isArray(lessons) || lessons.length === 0) {
			return json({
				success: false,
				error: 'lessons must be a non-empty array'
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

		// Create the keyword generation prompt
		const prompt = createKeywordGenerationPrompt(
			course_title,
			course_topic,
			lessons,
			audience,
			depth
		);

		console.log(`Generating keyword cloud for: ${course_title} (${audience}, ${depth})`);

		// Make API call with logging
		const data = await logOpenAIRequest(
			{
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: 'You are an expert content strategist and SEO specialist. Generate comprehensive keyword clouds for video discovery. Respond with ONLY valid JSON.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 2000,
				temperature: 0.4
			},
			`Keyword generation: ${course_title}`,
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
								content: 'You are an expert content strategist. Generate keyword clouds for video discovery. Respond with ONLY valid JSON.'
							},
							{
								role: 'user',
								content: prompt
							}
						],
						max_tokens: 2000,
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
			const keywordData = JSON.parse(jsonContent);
			
			// Validate and set defaults
			const keywordCloud: KeywordCloud = {
				primary_keywords: Array.isArray(keywordData.primary_keywords) ? keywordData.primary_keywords : [],
				secondary_keywords: Array.isArray(keywordData.secondary_keywords) ? keywordData.secondary_keywords : [],
				long_tail_keywords: Array.isArray(keywordData.long_tail_keywords) ? keywordData.long_tail_keywords : [],
				video_search_terms: Array.isArray(keywordData.video_search_terms) ? keywordData.video_search_terms : [],
				excluded_terms: Array.isArray(keywordData.excluded_terms) ? keywordData.excluded_terms : []
			};

			const totalKeywords = keywordCloud.primary_keywords.length + 
								 keywordCloud.secondary_keywords.length + 
								 keywordCloud.long_tail_keywords.length + 
								 keywordCloud.video_search_terms.length;

			return json({
				success: true,
				keyword_cloud: keywordCloud,
				total_keywords: totalKeywords,
				log_id: 'logged'
			});

		} catch (parseError) {
			console.error('Failed to parse keyword data:', parseError);
			console.error('Raw content:', responseContent);
			
			// Return fallback keyword cloud
			const fallbackKeywords: KeywordCloud = {
				primary_keywords: [course_topic, course_title.toLowerCase()],
				secondary_keywords: lessons.flatMap(lesson => lesson.key_concepts).slice(0, 10),
				long_tail_keywords: [`${course_topic} tutorial`, `learn ${course_topic}`, `${course_topic} for ${audience}`],
				video_search_terms: [`${course_topic} course`, `${course_topic} lesson`, `${course_topic} explained`],
				excluded_terms: ['advanced', 'complex'] // Generic exclusions
			};

			return json({
				success: true,
				keyword_cloud: fallbackKeywords,
				total_keywords: Object.values(fallbackKeywords).flat().length,
				log_id: 'fallback'
			});
		}

	} catch (error) {
		console.error('Keyword generation error:', error);
		
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
			error: 'Keyword generation failed. Please try again later.'
		}, { status: 500 });
	}
};