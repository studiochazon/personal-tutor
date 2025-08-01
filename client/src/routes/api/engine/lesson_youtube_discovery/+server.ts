import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import { validateAndGetFallbackVideo } from '$lib/video-validator';
import jwt from 'jsonwebtoken';
import { 
    OPENAI_CONFIG, 
    YOUTUBE_DISCOVERY_CONFIG, 
    CONFIG_HELPERS 
} from '$lib/engine.config';
import { 
    makeGeminiRequest, 
    convertOpenAIToGemini, 
    convertGeminiToOpenAI 
} from '$lib/gemini-client';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface LessonVideoRequest {
	lessons: Array<{
		title: string;
		topic: string;
		duration?: number; // Lesson duration in minutes
		audience?: string;
	}>;
	courseTitle: string;
	preferred_duration?: number; // Preferred video duration in minutes
	quality_preference?: 'educational' | 'engaging' | 'authoritative';
	max_retries?: number;
	// New: Use keyword extraction for better video discovery
	use_keyword_extraction?: boolean;
	keyword_cloud?: {
		primary_keywords: string[];
		secondary_keywords: string[];
		long_tail_keywords: string[];
		video_search_terms: string[];
		excluded_terms: string[];
	};
}

interface VideoResult {
	lesson_index: number;
	video_url: string | null;
	video_title: string;
	video_duration: number; // In seconds
	confidence_score: number; // 0-1 score for relevance
	platform: 'youtube' | 'vimeo' | 'other';
	was_replaced: boolean; // If original was unavailable and replaced
	fallback_reason?: string;
}

interface YouTubeDiscoveryResponse {
	success: boolean;
	videos?: VideoResult[];
	total_lessons?: number;
	successful_matches?: number;
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

function createVideoDiscoveryPrompt(
	lessons: any[],
	courseTitle: string,
	preferredDuration: number,
	qualityPreference: string,
	keywordCloud?: any
): string {
	const qualityGuidelines = YOUTUBE_DISCOVERY_CONFIG.quality_preferences;

	let keywordSection = '';
	if (keywordCloud) {
		keywordSection = `

## Keyword Cloud for Enhanced Video Discovery
- **Primary Keywords**: ${keywordCloud.primary_keywords?.join(', ') || 'None'}
- **Secondary Keywords**: ${keywordCloud.secondary_keywords?.join(', ') || 'None'}
- **Video Search Terms**: ${keywordCloud.video_search_terms?.join(', ') || 'None'}
- **Long-tail Keywords**: ${keywordCloud.long_tail_keywords?.join(', ') || 'None'}
- **Excluded Terms**: ${keywordCloud.excluded_terms?.join(', ') || 'None'}

Use these keywords to find more relevant and targeted videos. Prioritize videos that match the primary and video search terms.`;
	}

	return `Find real YouTube videos for these lessons. You are helping create an educational course on "${courseTitle}".

## Course Information
- **Course Title**: ${courseTitle}
- **Number of Lessons**: ${lessons.length}
- **Quality Preference**: ${qualityGuidelines[qualityPreference as keyof typeof qualityGuidelines]}
- **Preferred Video Duration**: ${preferredDuration} minutes (${preferredDuration * 60} seconds)${keywordSection}

## Lessons to Match
${lessons.map((lesson, index) => `${index + 1}. **${lesson.title}**
   - Topic: ${lesson.topic}
   - Lesson Duration: ${lesson.duration || 15} minutes
   - Audience: ${lesson.audience || 'general'}`).join('\n\n')}

## Requirements

### Video Selection Criteria
- **REAL YouTube URLs**: Use actual, existing YouTube video IDs
- **Relevance**: Videos must directly relate to the lesson topic
- **Quality**: Choose high-quality educational content
- **Duration**: Prefer videos around ${preferredDuration} minutes (${preferredDuration * 60} seconds)
- **Accessibility**: Publicly available videos with good audio quality
- **Educational Value**: Content that enhances learning objectives

### Technical Requirements
- **Format**: Use embed URLs: https://www.youtube.com/embed/VIDEO_ID
- **NO PLACEHOLDERS**: Never use VIDEO_ID1, VIDEO_ID2, or similar placeholders
- **Real IDs**: Use actual YouTube video IDs (e.g., W6NZfCO5SIk, PkZNo7MFNFg)
- **Validation**: Ensure video IDs are real and functional

### Confidence Scoring (0.0 to 1.0)
- **1.0**: Perfect match for lesson topic and audience
- **0.8-0.9**: Very relevant with good educational value
- **0.6-0.7**: Relevant but may need supplementation
- **0.4-0.5**: Somewhat relevant, acceptable fallback
- **Below 0.4**: Poor match, avoid if possible

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "videos": [
    {
      "lesson_index": 0,
      "video_url": "https://www.youtube.com/embed/REAL_VIDEO_ID",
      "video_title": "Actual video title from YouTube",
      "video_duration": 360,
      "confidence_score": 0.9,
      "platform": "youtube"
    }
  ]
}

**CRITICAL**: Only use REAL YouTube video IDs. Do not use placeholders or made-up IDs.

Find the best matching videos now.`;
}

async function getVideoUrlsForLessons(
	lessons: any[], 
	courseTitle: string, 
	preferredDuration: number,
	qualityPreference: string,
	maxRetries: number,
	keywordCloud?: any
): Promise<Array<{ video_url: string | null; video_title: string | null; video_duration: number | null; confidence_score: number; was_replaced: boolean }>> {
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(`Attempt ${attempt}/${maxRetries}: Getting video URLs for ${lessons.length} lessons`);
			
			const videoPrompt = createVideoDiscoveryPrompt(lessons, courseTitle, preferredDuration, qualityPreference, keywordCloud);

			const videoConfig = CONFIG_HELPERS.getOperationConfig('video_discovery');
			const request = {
				model: videoConfig.model,
				messages: [
					{
						role: 'system',
						content: 'You are a video research assistant. Find real YouTube educational videos. Respond with ONLY valid JSON.'
					},
					{
						role: 'user',
						content: videoPrompt
					}
				],
				max_tokens: videoConfig.max_tokens,
				temperature: videoConfig.temperature
			};

			// Log the request and make the API call based on provider
			const data = await logOpenAIRequest(
				request, 
				`Video discovery for course: ${courseTitle}`, 
				async () => {
					if (videoConfig.provider === 'gemini') {
						// Use Gemini API
						const geminiRequest = convertOpenAIToGemini(request);
						const geminiResponse = await makeGeminiRequest(geminiRequest);
						return convertGeminiToOpenAI(geminiResponse);
					} else {
						// Use OpenAI API
						const response = await fetch('https://api.openai.com/v1/chat/completions', {
							method: 'POST',
							headers: {
								'Authorization': `Bearer ${OPENAI_API_KEY}`,
								'Content-Type': 'application/json'
							},
							body: JSON.stringify(request)
						});

						if (!response.ok) {
							throw new Error(`OpenAI API error: ${response.status}`);
						}

						return response.json();
					}
				},
				'lesson_youtube_discovery'
			);
			
			const videoResponse = data.choices[0]?.message?.content;

			if (!videoResponse) {
				throw new Error(`No response content from ${videoConfig.provider} API`);
			}

			// Parse the video response
			let jsonContent = videoResponse.trim();
			
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

			const videoData = JSON.parse(jsonContent);
			
			if (!videoData.videos || !Array.isArray(videoData.videos)) {
				throw new Error('Invalid video response format: expected videos array');
			}

			// Validate that we got real video URLs
			const validVideos = videoData.videos.filter((video: any) => 
				video.video_url && 
				video.video_url.includes('youtube.com/embed/') && 
				!video.video_url.includes('VIDEO_ID') &&
				!video.video_url.includes('placeholder') &&
				video.video_url.match(/youtube\.com\/embed\/[a-zA-Z0-9_-]+$/)
			);

			if (validVideos.length >= lessons.length * YOUTUBE_DISCOVERY_CONFIG.validation.min_success_rate) {
				console.log(`✅ Successfully got ${validVideos.length}/${lessons.length} real video URLs on attempt ${attempt}`);
				
				// Pad with nulls if we don't have enough videos
				const paddedResults = lessons.map((_, index) => {
					const video = validVideos[index];
					if (video) {
						return {
							video_url: video.video_url,
							video_title: video.video_title || null,
							video_duration: video.video_duration || null,
							confidence_score: video.confidence_score || 0.5,
							was_replaced: false
						};
					}
					return {
						video_url: null,
						video_title: null,
						video_duration: null,
						confidence_score: 0,
						was_replaced: false
					};
				});

				return paddedResults;
			} else {
				console.log(`❌ Attempt ${attempt}: Only got ${validVideos.length}/${lessons.length} valid videos, retrying...`);
				if (attempt === maxRetries) {
					console.log('Max retries reached, returning partial results');
					const paddedResults = lessons.map(() => ({
						video_url: null,
						video_title: null,
						video_duration: null,
						confidence_score: 0,
						was_replaced: false
					}));
					return paddedResults;
				}
			}

		} catch (error) {
			console.error(`Error on attempt ${attempt}:`, error);
			if (attempt === maxRetries) {
				console.log('Max retries reached, returning empty results');
				return lessons.map(() => ({
					video_url: null,
					video_title: null,
					video_duration: null,
					confidence_score: 0,
					was_replaced: false
				}));
			}
		}
	}

	return lessons.map(() => ({
		video_url: null,
		video_title: null,
		video_duration: null,
		confidence_score: 0,
		was_replaced: false
	}));
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
			lessons,
			courseTitle,
			preferred_duration = YOUTUBE_DISCOVERY_CONFIG.default_preferred_duration,
			quality_preference = YOUTUBE_DISCOVERY_CONFIG.default_quality_preference,
			max_retries = YOUTUBE_DISCOVERY_CONFIG.default_max_retries,
			use_keyword_extraction = YOUTUBE_DISCOVERY_CONFIG.keyword_integration.enabled_by_default,
			keyword_cloud
		}: LessonVideoRequest = await request.json();

		// Validate required fields
		if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
			return json({
				success: false,
				error: 'lessons array is required and must not be empty'
			}, { status: 400 });
		}

		if (!courseTitle) {
			return json({
				success: false,
				error: 'courseTitle is required'
			}, { status: 400 });
		}

		// Validate lessons structure
		for (let i = 0; i < lessons.length; i++) {
			const lesson = lessons[i];
			if (!lesson.title || !lesson.topic) {
				return json({
					success: false,
					error: `Lesson at index ${i} must have title and topic`
				}, { status: 400 });
			}
		}

		// Validate quality_preference
		const validQualityPreferences = ['educational', 'engaging', 'authoritative'];
		if (quality_preference && !validQualityPreferences.includes(quality_preference)) {
			return json({
				success: false,
				error: `quality_preference must be one of: ${validQualityPreferences.join(', ')}`
			}, { status: 400 });
		}

		console.log(`Discovering YouTube videos for ${lessons.length} lessons in course: ${courseTitle}`);

		// Get video URLs from OpenAI
		const videoResults = await getVideoUrlsForLessons(
			lessons, 
			courseTitle, 
			preferred_duration,
			quality_preference,
			max_retries,
			keyword_cloud
		);

		// Validate and get fallback videos where needed
		const finalResults: VideoResult[] = [];
		
		for (let i = 0; i < lessons.length; i++) {
			const videoResult = videoResults[i];
			const lesson = lessons[i];
			
			if (videoResult.video_url) {
				try {
					// Validate the video and get fallback if needed
					const validated = await validateAndGetFallbackVideo(
						videoResult.video_url, 
						lesson.topic
					);
					
					finalResults.push({
						lesson_index: i,
						video_url: validated.url,
						video_title: validated.wasReplaced ? validated.title : (videoResult.video_title || validated.title),
						video_duration: validated.wasReplaced ? validated.duration : (videoResult.video_duration || validated.duration),
						confidence_score: validated.wasReplaced ? YOUTUBE_DISCOVERY_CONFIG.validation.fallback_confidence : videoResult.confidence_score,
						platform: 'youtube',
						was_replaced: validated.wasReplaced,
						fallback_reason: validated.wasReplaced ? 'Original video unavailable' : undefined
					});
				} catch (error) {
					console.error(`Error validating video for lesson ${i}:`, error);
					finalResults.push({
						lesson_index: i,
						video_url: videoResult.video_url,
						video_title: videoResult.video_title || 'Video Title',
						video_duration: videoResult.video_duration || 600,
						confidence_score: videoResult.confidence_score,
						platform: 'youtube',
						was_replaced: false
					});
				}
			} else {
				// No video found, provide a fallback
				try {
					const fallback = await validateAndGetFallbackVideo('', lesson.topic);
					finalResults.push({
						lesson_index: i,
						video_url: fallback.url,
						video_title: fallback.title,
						video_duration: fallback.duration,
						confidence_score: YOUTUBE_DISCOVERY_CONFIG.validation.fallback_confidence,
						platform: 'youtube',
						was_replaced: true,
						fallback_reason: 'No suitable video found'
					});
				} catch (error) {
					console.error(`Error getting fallback video for lesson ${i}:`, error);
					finalResults.push({
						lesson_index: i,
						video_url: null,
						video_title: 'No video available',
						video_duration: 0,
						confidence_score: 0,
						platform: 'youtube',
						was_replaced: false,
						fallback_reason: 'Video discovery failed'
					});
				}
			}
		}

		const successfulMatches = finalResults.filter(video => video.video_url !== null).length;

		return json({
			success: true,
			videos: finalResults,
			total_lessons: lessons.length,
			successful_matches: successfulMatches,
			log_id: 'logged'
		});

	} catch (error) {
		console.error('YouTube discovery error:', error);
		
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
			error: 'YouTube discovery failed. Please try again later.'
		}, { status: 500 });
	}
};