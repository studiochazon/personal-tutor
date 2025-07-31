import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import { validateAndGetFallbackVideo } from '$lib/video-validator';
import { calculateOpenAICost, type CostInfo } from '$lib/cost-calculator';
import jwt from 'jsonwebtoken';
import { 
    OPENAI_CONFIG, 
    YOUTUBE_DISCOVERY_CONFIG, 
    CONFIG_HELPERS 
} from '$lib/engine.config';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface KeywordVideoRequest {
	keyword_cloud: {
		primary_keywords: string[];
		secondary_keywords: string[];
		long_tail_keywords: string[];
		video_search_terms: string[];
		excluded_terms: string[];
	};
	courseTitle?: string;
	preferred_duration?: number; // Preferred video duration in minutes
	quality_preference?: 'educational' | 'engaging' | 'authoritative';
	max_retries?: number;
	target_video_count?: number; // Number of videos to return (default: 45)
}

interface VideoResult {
	video_url: string | null;
	video_title: string;
	video_duration: number; // In seconds
	confidence_score: number; // 0-1 score for relevance
	platform: 'youtube' | 'vimeo' | 'other';
	was_replaced: boolean; // If original was unavailable and replaced
	fallback_reason?: string;
	keyword_match?: string[]; // Which keywords this video matches
}

interface KeywordVideoDiscoveryResponse {
	success: boolean;
	videos?: VideoResult[];
	total_videos?: number;
	successful_matches?: number;
	log_id?: string;
	error?: string;
	// Cost and usage information
	cost_info?: CostInfo;
	api_usage?: {
		total_requests: number;
		total_tokens: number;
		models_used: string[];
	};
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

function createKeywordVideoDiscoveryPrompt(
	keywordCloud: any,
	courseTitle: string,
	preferredDuration: number,
	qualityPreference: string,
	targetVideoCount: number
): string {
	const qualityGuidelines = YOUTUBE_DISCOVERY_CONFIG.quality_preferences;

	return `Find a broad list of ${targetVideoCount} real YouTube videos related to these keywords. You are helping create an educational course on "${courseTitle}".

## Course Information
- **Course Title**: ${courseTitle}
- **Target Video Count**: ${targetVideoCount} videos
- **Quality Preference**: ${qualityGuidelines[qualityPreference as keyof typeof qualityGuidelines]}
- **Preferred Video Duration**: ${preferredDuration} minutes (${preferredDuration * 60} seconds)

## Keyword Cloud for Video Discovery
- **Primary Keywords**: ${keywordCloud.primary_keywords?.join(', ') || 'None'}
- **Secondary Keywords**: ${keywordCloud.secondary_keywords?.join(', ') || 'None'}
- **Video Search Terms**: ${keywordCloud.video_search_terms?.join(', ') || 'None'}
- **Long-tail Keywords**: ${keywordCloud.long_tail_keywords?.join(', ') || 'None'}
- **Excluded Terms**: ${keywordCloud.excluded_terms?.join(', ') || 'None'}

## Requirements

### Video Selection Criteria
- **REAL YouTube URLs**: Use actual, existing YouTube video IDs
- **Keyword Relevance**: Videos must relate to the provided keywords
- **Diversity**: Include videos covering different aspects and perspectives
- **Quality**: Choose high-quality educational content
- **Duration**: Prefer videos around ${preferredDuration} minutes (${preferredDuration * 60} seconds)
- **Accessibility**: Publicly available videos with good audio quality
- **Educational Value**: Content that enhances learning objectives

### Technical Requirements
- **Format**: Use embed URLs: https://www.youtube.com/embed/VIDEO_ID
- **NO PLACEHOLDERS**: Never use VIDEO_ID1, VIDEO_ID2, or similar placeholders
- **Real IDs**: Use actual YouTube video IDs (e.g., W6NZfCO5SIk, PkZNo7MFNFg)
- **Validation**: Ensure video IDs are real and functional
- **Count**: Return exactly ${targetVideoCount} videos

### Confidence Scoring (0.0 to 1.0)
- **1.0**: Perfect match for keywords and educational value
- **0.8-0.9**: Very relevant with good educational value
- **0.6-0.7**: Relevant but may need supplementation
- **0.4-0.5**: Somewhat relevant, acceptable inclusion
- **Below 0.4**: Poor match, avoid if possible

### Keyword Matching
For each video, identify which keywords it matches:
- Primary keywords (highest priority)
- Secondary keywords (medium priority)
- Video search terms (high priority for discovery)
- Long-tail keywords (specific content)

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "videos": [
    {
      "video_url": "https://www.youtube.com/embed/REAL_VIDEO_ID",
      "video_title": "Actual video title from YouTube",
      "video_duration": 360,
      "confidence_score": 0.9,
      "platform": "youtube",
      "keyword_match": ["creationism", "tutorial", "introduction"]
    }
  ]
}

**CRITICAL**: 
- Only use REAL YouTube video IDs. Do not use placeholders or made-up IDs.
- Return exactly ${targetVideoCount} videos.
- Ensure diversity in content and perspectives.
- Match videos to relevant keywords.

Find ${targetVideoCount} diverse and relevant videos now.`;
}

async function getKeywordVideos(
	keywordCloud: any,
	courseTitle: string,
	preferredDuration: number,
	qualityPreference: string,
	maxRetries: number,
	targetVideoCount: number
): Promise<{
	videos: Array<{ video_url: string | null; video_title: string | null; video_duration: number | null; confidence_score: number; was_replaced: boolean; keyword_match?: string[] }>;
	costInfo: CostInfo;
}> {
	
	let totalCost = 0;
	let totalTokens = 0;
	let modelsUsed: string[] = [];
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(`Attempt ${attempt}/${maxRetries}: Getting ${targetVideoCount} videos for keywords`);
			
			const videoPrompt = createKeywordVideoDiscoveryPrompt(keywordCloud, courseTitle, preferredDuration, qualityPreference, targetVideoCount);

			const videoConfig = CONFIG_HELPERS.getOperationConfig('video_discovery');
			const openAIRequest = {
				model: videoConfig.model,
				messages: [
					{
						role: 'system',
						content: 'You are a video research assistant. Find real YouTube educational videos based on keywords. Respond with ONLY valid JSON.'
					},
					{
						role: 'user',
						content: videoPrompt
					}
				],
				max_tokens: videoConfig.max_tokens,
				temperature: videoConfig.temperature
			};

			// Log the request and make the API call
			const data = await logOpenAIRequest(
				openAIRequest, 
				`Keyword-based video discovery for course: ${courseTitle}`, 
				async () => {
					const response = await fetch('https://api.openai.com/v1/chat/completions', {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${OPENAI_API_KEY}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(openAIRequest)
					});

					if (!response.ok) {
						throw new Error(`OpenAI API error: ${response.status}`);
					}

					return response.json();
				},
				'keyword_video_discovery'
			);
			
			// Track cost and usage
			if (data.usage) {
				const costInfo = calculateOpenAICost(data.usage, data.model);
				totalCost += costInfo.total_cost;
				totalTokens += data.usage.total_tokens;
				if (!modelsUsed.includes(data.model)) {
					modelsUsed.push(data.model);
				}
			}
			
			const videoResponse = data.choices[0]?.message?.content;

			if (!videoResponse) {
				throw new Error('No response content from OpenAI');
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

			// Check if we have enough videos (at least 80% of target)
			const minRequired = Math.floor(targetVideoCount * 0.8);
			if (validVideos.length >= minRequired) {
				console.log(`✅ Successfully got ${validVideos.length}/${targetVideoCount} real video URLs on attempt ${attempt}`);
				
				// Return the valid videos with cost info
				const videos = validVideos.map((video: any) => ({
					video_url: video.video_url,
					video_title: video.video_title || null,
					video_duration: video.video_duration || null,
					confidence_score: video.confidence_score || 0.5,
					was_replaced: false,
					keyword_match: video.keyword_match || []
				}));

				const costInfo: CostInfo = {
					total_cost: totalCost,
					prompt_cost: totalCost * 0.3, // Approximate split
					completion_cost: totalCost * 0.7, // Approximate split
					tokens_used: {
						prompt_tokens: Math.floor(totalTokens * 0.3),
						completion_tokens: Math.floor(totalTokens * 0.7),
						total_tokens: totalTokens
					},
					model: modelsUsed.join(', '),
					currency: 'USD'
				};

				return { videos, costInfo };
			} else {
				console.log(`❌ Attempt ${attempt}: Only got ${validVideos.length}/${targetVideoCount} valid videos, retrying...`);
				if (attempt === maxRetries) {
					console.log('Max retries reached, returning partial results');
					const videos = validVideos.map((video: any) => ({
						video_url: video.video_url,
						video_title: video.video_title || null,
						video_duration: video.video_duration || null,
						confidence_score: video.confidence_score || 0.5,
						was_replaced: false,
						keyword_match: video.keyword_match || []
					}));

					const costInfo: CostInfo = {
						total_cost: totalCost,
						prompt_cost: totalCost * 0.3,
						completion_cost: totalCost * 0.7,
						tokens_used: {
							prompt_tokens: Math.floor(totalTokens * 0.3),
							completion_tokens: Math.floor(totalTokens * 0.7),
							total_tokens: totalTokens
						},
						model: modelsUsed.join(', '),
						currency: 'USD'
					};

					return { videos, costInfo };
				}
			}

		} catch (error) {
			console.error(`Error on attempt ${attempt}:`, error);
			if (attempt === maxRetries) {
				console.log('Max retries reached, returning empty results');
				const costInfo: CostInfo = {
					total_cost: totalCost,
					prompt_cost: totalCost * 0.3,
					completion_cost: totalCost * 0.7,
					tokens_used: {
						prompt_tokens: Math.floor(totalTokens * 0.3),
						completion_tokens: Math.floor(totalTokens * 0.7),
						total_tokens: totalTokens
					},
					model: modelsUsed.join(', '),
					currency: 'USD'
				};

				return { videos: [], costInfo };
			}
		}
	}

	const costInfo: CostInfo = {
		total_cost: totalCost,
		prompt_cost: totalCost * 0.3,
		completion_cost: totalCost * 0.7,
		tokens_used: {
			prompt_tokens: Math.floor(totalTokens * 0.3),
			completion_tokens: Math.floor(totalTokens * 0.7),
			total_tokens: totalTokens
		},
		model: modelsUsed.join(', '),
		currency: 'USD'
	};

	return { videos: [], costInfo };
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
			keyword_cloud,
			courseTitle = 'Educational Course',
			preferred_duration = YOUTUBE_DISCOVERY_CONFIG.default_preferred_duration,
			quality_preference = YOUTUBE_DISCOVERY_CONFIG.default_quality_preference,
			max_retries = YOUTUBE_DISCOVERY_CONFIG.default_max_retries,
			target_video_count = 45
		}: KeywordVideoRequest = await request.json();

		// Validate required fields
		if (!keyword_cloud) {
			return json({
				success: false,
				error: 'keyword_cloud is required'
			}, { status: 400 });
		}

		// Validate keyword cloud structure
		if (!keyword_cloud.primary_keywords || !Array.isArray(keyword_cloud.primary_keywords)) {
			return json({
				success: false,
				error: 'keyword_cloud.primary_keywords is required and must be an array'
			}, { status: 400 });
		}

		// Validate quality_preference
		const validQualityPreferences = ['educational', 'engaging', 'authoritative'];
		if (quality_preference && !validQualityPreferences.includes(quality_preference)) {
			return json({
				success: false,
				error: `quality_preference must be one of: ${validQualityPreferences.join(', ')}`
			}, { status: 400 });
		}

		console.log(`Discovering ${target_video_count} YouTube videos for keywords in course: ${courseTitle}`);

		// Get video URLs from OpenAI
		const { videos: videoResults, costInfo } = await getKeywordVideos(
			keyword_cloud,
			courseTitle,
			preferred_duration,
			quality_preference,
			max_retries,
			target_video_count
		);

		// Validate and get fallback videos where needed
		const finalResults: VideoResult[] = [];
		
		for (let i = 0; i < videoResults.length; i++) {
			const videoResult = videoResults[i];
			
			if (videoResult.video_url) {
				try {
					// Validate the video and get fallback if needed
					const validated = await validateAndGetFallbackVideo(
						videoResult.video_url, 
						'keyword-based video'
					);
					
					finalResults.push({
						video_url: validated.url,
						video_title: validated.wasReplaced ? validated.title : (videoResult.video_title || validated.title),
						video_duration: validated.wasReplaced ? validated.duration : (videoResult.video_duration || validated.duration),
						confidence_score: validated.wasReplaced ? YOUTUBE_DISCOVERY_CONFIG.validation.fallback_confidence : videoResult.confidence_score,
						platform: 'youtube',
						was_replaced: validated.wasReplaced,
						fallback_reason: validated.wasReplaced ? 'Original video unavailable' : undefined,
						keyword_match: videoResult.keyword_match
					});
				} catch (error) {
					console.error(`Error validating video ${i}:`, error);
					finalResults.push({
						video_url: videoResult.video_url,
						video_title: videoResult.video_title || 'Video Title',
						video_duration: videoResult.video_duration || 600,
						confidence_score: videoResult.confidence_score,
						platform: 'youtube',
						was_replaced: false,
						keyword_match: videoResult.keyword_match
					});
				}
			}
		}

		const successfulMatches = finalResults.filter(video => video.video_url !== null).length;

		return json({
			success: true,
			videos: finalResults,
			total_videos: finalResults.length,
			successful_matches: successfulMatches,
			log_id: 'keyword_video_discovery',
			cost_info: costInfo,
			api_usage: {
				total_requests: max_retries,
				total_tokens: costInfo.tokens_used.total_tokens,
				models_used: costInfo.model.split(', ')
			}
		});

	} catch (error) {
		console.error('Keyword video discovery error:', error);
		
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
			error: 'Keyword video discovery failed. Please try again later.'
		}, { status: 500 });
	}
};
