import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface KeywordCloud {
	primary_keywords: string[];
	secondary_keywords: string[];
	long_tail_keywords: string[];
	video_search_terms: string[];
	excluded_terms: string[];
}

interface Lesson {
	title: string;
	topic: string;
	duration?: number;
	key_concepts: string[];
	objectives: string[];
}

interface VideoSearchRequest {
	course_title: string;
	course_topic: string;
	lessons: Lesson[];
	keyword_cloud: KeywordCloud;
	audience: 'beginner' | 'intermediate' | 'advanced';
	preferred_duration?: number; // Preferred video duration in minutes
	quality_preference?: 'educational' | 'engaging' | 'authoritative';
	max_videos_per_lesson?: number;
	search_strategy?: 'comprehensive' | 'targeted' | 'mixed';
}

interface VideoSearchResult {
	lesson_index: number;
	lesson_title: string;
	videos: Array<{
		video_url: string;
		video_title: string;
		video_duration: number; // In seconds
		confidence_score: number; // 0-1 score for relevance
		platform: 'youtube' | 'vimeo' | 'other';
		search_terms_used: string[];
		relevance_reason: string;
	}>;
}

interface VideoSearchResponse {
	success: boolean;
	search_results?: VideoSearchResult[];
	total_videos_found?: number;
	keyword_coverage?: {
		primary_used: number;
		secondary_used: number;
		long_tail_used: number;
		video_terms_used: number;
	};
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

function createVideoSearchPrompt(
	courseTitle: string,
	courseTopic: string,
	lessons: Lesson[],
	keywordCloud: KeywordCloud,
	audience: string,
	preferredDuration: number,
	qualityPreference: string,
	maxVideosPerLesson: number,
	searchStrategy: string
): string {
	const lessonDetails = lessons.map((lesson, index) => 
		`${index + 1}. **${lesson.title}**
   - Topic: ${lesson.topic}
   - Key Concepts: ${lesson.key_concepts.join(', ')}
   - Objectives: ${lesson.objectives.join('; ')}
   - Duration: ${lesson.duration || 15} minutes`
	).join('\n\n');

	const qualityGuidelines = {
		educational: 'prioritize clear, structured educational content from reputable channels',
		engaging: 'prioritize entertaining and engaging content that maintains educational value',
		authoritative: 'prioritize content from recognized experts, institutions, or authoritative sources'
	};

	const strategyDescriptions = {
		comprehensive: 'Use all keyword categories extensively, cast a wide net',
		targeted: 'Focus on primary and secondary keywords, be more selective',
		mixed: 'Balance between comprehensive coverage and targeted relevance'
	};

	return `You are an expert video researcher. Find real YouTube videos for each lesson using the provided keyword cloud strategically.

## Course Information
- **Title**: ${courseTitle}
- **Topic**: ${courseTopic}
- **Number of Lessons**: ${lessons.length}
- **Audience**: ${audience}
- **Quality Preference**: ${qualityGuidelines[qualityPreference as keyof typeof qualityGuidelines]}
- **Preferred Video Duration**: ${preferredDuration} minutes (${preferredDuration * 60} seconds)
- **Max Videos per Lesson**: ${maxVideosPerLesson}
- **Search Strategy**: ${strategyDescriptions[searchStrategy as keyof typeof strategyDescriptions]}

## Lessons to Match
${lessonDetails}

## Strategic Keyword Cloud
### Primary Keywords (Core concepts - HIGH PRIORITY)
${keywordCloud.primary_keywords.map(kw => `- ${kw}`).join('\n')}

### Secondary Keywords (Supporting concepts - MEDIUM PRIORITY)  
${keywordCloud.secondary_keywords.map(kw => `- ${kw}`).join('\n')}

### Long-tail Keywords (Specific phrases - USE FOR PRECISION)
${keywordCloud.long_tail_keywords.map(kw => `- ${kw}`).join('\n')}

### Video Search Terms (Optimized for video platforms - HIGH PRIORITY)
${keywordCloud.video_search_terms.map(kw => `- ${kw}`).join('\n')}

### Excluded Terms (AVOID these in searches)
${keywordCloud.excluded_terms.map(kw => `- ${kw}`).join('\n')}

## Search Strategy Instructions

### Keyword Usage Strategy (${searchStrategy})
${searchStrategy === 'comprehensive' ? `
- Use keywords from ALL categories
- Combine multiple keywords for broader searches
- Include both primary and secondary terms
- Use long-tail keywords for specific matches
` : searchStrategy === 'targeted' ? `
- Focus primarily on PRIMARY and VIDEO_SEARCH_TERMS
- Use secondary keywords sparingly  
- Select most relevant long-tail keywords only
- Be more selective in combinations
` : `
- Balance between comprehensive and targeted approach
- Use primary keywords extensively
- Include relevant secondary and video search terms
- Strategic use of long-tail keywords
`}

### Video Selection Requirements
- **REAL YouTube URLs**: Use actual, existing YouTube video IDs
- **Format**: Use embed URLs: https://www.youtube.com/embed/VIDEO_ID
- **NO PLACEHOLDERS**: Never use VIDEO_ID1, VIDEO_ID2, or similar placeholders
- **Quality**: Choose high-quality educational content
- **Relevance**: Videos must directly relate to lesson concepts
- **Duration**: Prefer videos around ${preferredDuration} minutes
- **Avoid Excluded Terms**: Do not select videos containing excluded keywords

### Per-Lesson Analysis
For each lesson:
1. Identify which keywords from the cloud are most relevant
2. Combine lesson-specific concepts with strategic keywords
3. Find ${maxVideosPerLesson} best video matches
4. Explain why each video was selected and which keywords influenced the choice

### Confidence Scoring (0.0 to 1.0)
- **0.9-1.0**: Perfect match using primary keywords + lesson concepts
- **0.7-0.8**: Good match using secondary keywords + video search terms
- **0.5-0.6**: Acceptable match using long-tail keywords
- **0.3-0.4**: Fallback option, basic relevance
- **Below 0.3**: Avoid if possible

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "search_results": [
    {
      "lesson_index": 0,
      "lesson_title": "Lesson Title",
      "videos": [
        {
          "video_url": "https://www.youtube.com/embed/REAL_VIDEO_ID",
          "video_title": "Actual video title from YouTube",
          "video_duration": 480,
          "confidence_score": 0.9,
          "platform": "youtube",
          "search_terms_used": ["primary keyword", "video search term"],
          "relevance_reason": "Explanation of why this video matches using specific keywords"
        }
      ]
    }
  ]
}

**CRITICAL**: 
- Only use REAL YouTube video IDs
- Strategic use of keyword cloud based on ${searchStrategy} strategy
- Document which keywords influenced each video selection
- Avoid any terms from the excluded list

Find the best matching videos now using the keyword cloud strategically.`;
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
			course_title,
			course_topic,
			lessons,
			keyword_cloud,
			audience,
			preferred_duration = 8,
			quality_preference = 'educational',
			max_videos_per_lesson = 2,
			search_strategy = 'mixed'
		}: VideoSearchRequest = await request.json();

		// Validate required fields
		if (!course_title || !course_topic || !lessons || !keyword_cloud || !audience) {
			return json({
				success: false,
				error: 'Missing required fields: course_title, course_topic, lessons, keyword_cloud, and audience are required'
			}, { status: 400 });
		}

		// Validate lessons structure
		if (!Array.isArray(lessons) || lessons.length === 0) {
			return json({
				success: false,
				error: 'lessons must be a non-empty array'
			}, { status: 400 });
		}

		// Validate keyword cloud structure
		const requiredKeywordFields = ['primary_keywords', 'secondary_keywords', 'long_tail_keywords', 'video_search_terms', 'excluded_terms'];
		for (const field of requiredKeywordFields) {
			if (!Array.isArray(keyword_cloud[field as keyof KeywordCloud])) {
				return json({
					success: false,
					error: `keyword_cloud.${field} must be an array`
				}, { status: 400 });
			}
		}

		// Validate enum values
		if (!['beginner', 'intermediate', 'advanced'].includes(audience)) {
			return json({
				success: false,
				error: 'Invalid audience. Must be: beginner, intermediate, or advanced'
			}, { status: 400 });
		}

		if (!['educational', 'engaging', 'authoritative'].includes(quality_preference)) {
			return json({
				success: false,
				error: 'Invalid quality_preference. Must be: educational, engaging, or authoritative'
			}, { status: 400 });
		}

		if (!['comprehensive', 'targeted', 'mixed'].includes(search_strategy)) {
			return json({
				success: false,
				error: 'Invalid search_strategy. Must be: comprehensive, targeted, or mixed'
			}, { status: 400 });
		}

		console.log(`Searching videos for: ${course_title} using ${search_strategy} strategy with ${keyword_cloud.primary_keywords.length + keyword_cloud.secondary_keywords.length} keywords`);

		// Create the video search prompt
		const prompt = createVideoSearchPrompt(
			course_title,
			course_topic,
			lessons,
			keyword_cloud,
			audience,
			preferred_duration,
			quality_preference,
			max_videos_per_lesson,
			search_strategy
		);

		// Make API call with logging
		const data = await logOpenAIRequest(
			{
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: 'You are an expert video researcher specializing in educational content discovery. Use keyword strategy effectively. Respond with ONLY valid JSON.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 3000,
				temperature: 0.3
			},
			`Video search for course: ${course_title}`,
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
								content: 'You are an expert video researcher. Use keyword strategy effectively. Respond with ONLY valid JSON.'
							},
							{
								role: 'user',
								content: prompt
							}
						],
						max_tokens: 3000,
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
			const searchData = JSON.parse(jsonContent);
			
			if (!searchData.search_results || !Array.isArray(searchData.search_results)) {
				throw new Error('Invalid response structure: search_results array is required');
			}

			// Validate video URLs and filter out invalid ones
			const validatedResults: VideoSearchResult[] = searchData.search_results.map((result: any, index: number) => {
				const validVideos = (result.videos || []).filter((video: any) => 
					video.video_url && 
					video.video_url.includes('youtube.com/embed/') && 
					!video.video_url.includes('VIDEO_ID') &&
					!video.video_url.includes('placeholder') &&
					video.video_url.match(/youtube\.com\/embed\/[a-zA-Z0-9_-]+$/)
				);

				return {
					lesson_index: result.lesson_index || index,
					lesson_title: result.lesson_title || lessons[index]?.title || `Lesson ${index + 1}`,
					videos: validVideos.map((video: any) => ({
						video_url: video.video_url,
						video_title: video.video_title || 'Video Title',
						video_duration: video.video_duration || preferred_duration * 60,
						confidence_score: video.confidence_score || 0.5,
						platform: video.platform || 'youtube',
						search_terms_used: Array.isArray(video.search_terms_used) ? video.search_terms_used : [],
						relevance_reason: video.relevance_reason || 'Matches lesson content'
					}))
				};
			});

			// Calculate keyword coverage analytics
			const allUsedTerms = validatedResults.flatMap(result => 
				result.videos.flatMap(video => video.search_terms_used)
			);

			const keywordCoverage = {
				primary_used: keyword_cloud.primary_keywords.filter(kw => 
					allUsedTerms.some(term => term.toLowerCase().includes(kw.toLowerCase()))
				).length,
				secondary_used: keyword_cloud.secondary_keywords.filter(kw => 
					allUsedTerms.some(term => term.toLowerCase().includes(kw.toLowerCase()))
				).length,
				long_tail_used: keyword_cloud.long_tail_keywords.filter(kw => 
					allUsedTerms.some(term => term.toLowerCase().includes(kw.toLowerCase()))
				).length,
				video_terms_used: keyword_cloud.video_search_terms.filter(kw => 
					allUsedTerms.some(term => term.toLowerCase().includes(kw.toLowerCase()))
				).length
			};

			const totalVideosFound = validatedResults.reduce((total, result) => total + result.videos.length, 0);

			return json({
				success: true,
				search_results: validatedResults,
				total_videos_found: totalVideosFound,
				keyword_coverage: keywordCoverage,
				log_id: 'logged'
			});

		} catch (parseError) {
			console.error('Failed to parse video search data:', parseError);
			console.error('Raw content:', responseContent);
			
			// Return fallback results
			const fallbackResults: VideoSearchResult[] = lessons.map((lesson, index) => ({
				lesson_index: index,
				lesson_title: lesson.title,
				videos: []
			}));

			return json({
				success: true,
				search_results: fallbackResults,
				total_videos_found: 0,
				keyword_coverage: {
					primary_used: 0,
					secondary_used: 0,
					long_tail_used: 0,
					video_terms_used: 0
				},
				log_id: 'fallback'
			});
		}

	} catch (error) {
		console.error('Video search error:', error);
		
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
			error: 'Video search failed. Please try again later.'
		}, { status: 500 });
	}
};