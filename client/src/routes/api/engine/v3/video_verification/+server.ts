import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateAndGetFallbackVideo } from '$lib/video-validator';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface VideoVerificationRequest {
	videos: Array<{
		lesson_index: number;
		lesson_title: string;
		lesson_topic: string;
		video_url: string;
		video_title: string;
		video_duration: number;
		confidence_score: number;
		search_terms_used: string[];
		relevance_reason: string;
	}>;
	course_title: string;
	course_topic: string;
	quality_threshold?: number; // Minimum confidence score to keep (0-1)
	enable_fallbacks?: boolean; // Whether to provide fallbacks for failed videos
	timeout_seconds?: number; // Timeout for verification requests
}

interface VerificationResult {
	lesson_index: number;
	lesson_title: string;
	original_video: {
		url: string;
		title: string;
		duration: number;
		confidence_score: number;
	};
	verification_status: 'available' | 'unavailable' | 'timeout' | 'quality_issue';
	verified_video: {
		url: string;
		title: string;
		duration: number;
		confidence_score: number;
		was_replaced: boolean;
		replacement_reason?: string;
	} | null;
	quality_score: number; // 0-1 overall quality assessment
	accessibility_score: number; // 0-1 accessibility assessment
	verification_notes: string[];
}

interface VideoVerificationResponse {
	success: boolean;
	verification_results?: VerificationResult[];
	summary?: {
		total_videos: number;
		verified_available: number;
		replaced_with_fallbacks: number;
		failed_verification: number;
		average_quality_score: number;
		average_accessibility_score: number;
	};
	recommendations?: string[];
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

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
	const patterns = [
		/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
		/youtu\.be\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/v\/([a-zA-Z0-9_-]+)/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return match[1];
		}
	}
	return null;
}

// Basic video URL validation
function validateVideoUrl(url: string): { isValid: boolean; videoId: string | null; issues: string[] } {
	const issues: string[] = [];
	
	if (!url || typeof url !== 'string') {
		issues.push('Invalid or missing URL');
		return { isValid: false, videoId: null, issues };
	}

	const videoId = extractVideoId(url);
	
	if (!videoId) {
		issues.push('Could not extract video ID from URL');
		return { isValid: false, videoId: null, issues };
	}

	// Check for placeholder or test IDs
	const testPatterns = [
		/VIDEO_ID/i,
		/placeholder/i,
		/test/i,
		/example/i,
		/sample/i
	];

	for (const pattern of testPatterns) {
		if (pattern.test(videoId) || pattern.test(url)) {
			issues.push('URL appears to be a placeholder or test ID');
			return { isValid: false, videoId, issues };
		}
	}

	// Basic video ID format validation
	if (videoId.length < 8 || videoId.length > 20) {
		issues.push('Video ID has unusual length');
	}

	if (!/^[a-zA-Z0-9_-]+$/.test(videoId)) {
		issues.push('Video ID contains invalid characters');
	}

	return { 
		isValid: issues.length === 0, 
		videoId, 
		issues 
	};
}

// Calculate quality score based on various factors
function calculateQualityScore(
	video: any, 
	lesson_topic: string, 
	confidence_score: number,
	search_terms_used: string[]
): { score: number; factors: string[] } {
	let score = confidence_score; // Start with the confidence score
	const factors: string[] = [];

	// Title relevance (simple keyword matching)
	const titleWords = video.video_title.toLowerCase().split(' ');
	const topicWords = lesson_topic.toLowerCase().split(' ');
	const titleRelevance = topicWords.filter(word => 
		titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
	).length / topicWords.length;
	
	if (titleRelevance > 0.6) {
		score += 0.1;
		factors.push('High title relevance');
	} else if (titleRelevance < 0.3) {
		score -= 0.1;
		factors.push('Low title relevance');
	}

	// Duration appropriateness (5-20 minutes is often ideal for lessons)
	const durationMinutes = video.video_duration / 60;
	if (durationMinutes >= 5 && durationMinutes <= 20) {
		score += 0.05;
		factors.push('Appropriate duration');
	} else if (durationMinutes < 2 || durationMinutes > 60) {
		score -= 0.1;
		factors.push('Unusual duration');
	}

	// Search terms usage (more used terms = higher quality match)
	const searchTermsUsed = search_terms_used.length;
	if (searchTermsUsed >= 3) {
		score += 0.05;
		factors.push('Multiple relevant search terms');
	} else if (searchTermsUsed === 0) {
		score -= 0.1;
		factors.push('No documented search terms');
	}

	// Ensure score stays within bounds
	score = Math.max(0, Math.min(1, score));

	return { score, factors };
}

// Calculate accessibility score
function calculateAccessibilityScore(video: any): { score: number; factors: string[] } {
	let score = 0.5; // Base score
	const factors: string[] = [];

	// Title clarity (longer, descriptive titles often indicate better content)
	if (video.video_title.length > 30) {
		score += 0.2;
		factors.push('Descriptive title');
	} else if (video.video_title.length < 15) {
		score -= 0.1;
		factors.push('Very short title');
	}

	// Check for educational indicators in title
	const educationalTerms = ['tutorial', 'guide', 'explained', 'introduction', 'course', 'lesson', 'how to', 'learn'];
	const hasEducationalTerms = educationalTerms.some(term => 
		video.video_title.toLowerCase().includes(term)
	);
	
	if (hasEducationalTerms) {
		score += 0.2;
		factors.push('Educational terminology in title');
	}

	// Platform reliability (YouTube is generally reliable)
	if (video.video_url.includes('youtube.com')) {
		score += 0.1;
		factors.push('Reliable platform');
	}

	// Ensure score stays within bounds
	score = Math.max(0, Math.min(1, score));

	return { score, factors };
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

		const { 
			videos,
			course_title,
			course_topic,
			quality_threshold = 0.4,
			enable_fallbacks = true,
			timeout_seconds = 10
		}: VideoVerificationRequest = await request.json();

		// Validate required fields
		if (!videos || !Array.isArray(videos) || videos.length === 0) {
			return json({
				success: false,
				error: 'videos array is required and must not be empty'
			}, { status: 400 });
		}

		if (!course_title || !course_topic) {
			return json({
				success: false,
				error: 'course_title and course_topic are required'
			}, { status: 400 });
		}

		console.log(`Verifying ${videos.length} videos for course: ${course_title}`);

		const verificationResults: VerificationResult[] = [];
		
		for (const video of videos) {
			try {
				console.log(`Verifying video for lesson ${video.lesson_index}: ${video.video_title}`);

				// Basic URL validation
				const urlValidation = validateVideoUrl(video.video_url);
				const qualityAssessment = calculateQualityScore(video, video.lesson_topic, video.confidence_score, video.search_terms_used);
				const accessibilityAssessment = calculateAccessibilityScore(video);

				let verificationStatus: 'available' | 'unavailable' | 'timeout' | 'quality_issue' = 'available';
				let verifiedVideo = {
					url: video.video_url,
					title: video.video_title,
					duration: video.video_duration,
					confidence_score: video.confidence_score,
					was_replaced: false
				};
				const verificationNotes: string[] = [];

				// Check URL validation issues
				if (!urlValidation.isValid) {
					verificationStatus = 'unavailable';
					verificationNotes.push(`URL validation failed: ${urlValidation.issues.join(', ')}`);
				}

				// Check quality threshold
				if (qualityAssessment.score < quality_threshold) {
					verificationStatus = 'quality_issue';
					verificationNotes.push(`Quality score ${qualityAssessment.score.toFixed(2)} below threshold ${quality_threshold}`);
				}

				// If video fails validation and fallbacks are enabled, try to get a fallback
				if ((verificationStatus !== 'available') && enable_fallbacks) {
					try {
						console.log(`Getting fallback video for lesson: ${video.lesson_title}`);
						const fallback = await validateAndGetFallbackVideo(
							verificationStatus === 'available' ? video.video_url : null,
							video.lesson_topic
						);

						if (fallback && fallback.url) {
							verifiedVideo = {
								url: fallback.url,
								title: fallback.title || 'Fallback Video',
								duration: fallback.duration || video.video_duration,
								confidence_score: 0.5, // Moderate confidence for fallbacks
								was_replaced: true,
								replacement_reason: `Original video ${verificationStatus}: ${verificationNotes.join('; ')}`
							};
							verificationStatus = 'available';
							verificationNotes.push('Replaced with fallback video');
						}
					} catch (fallbackError) {
						console.error(`Failed to get fallback for lesson ${video.lesson_index}:`, fallbackError);
						verificationNotes.push('Fallback video retrieval failed');
					}
				}

				verificationResults.push({
					lesson_index: video.lesson_index,
					lesson_title: video.lesson_title,
					original_video: {
						url: video.video_url,
						title: video.video_title,
						duration: video.video_duration,
						confidence_score: video.confidence_score
					},
					verification_status: verificationStatus,
					verified_video: verificationStatus === 'available' ? verifiedVideo : null,
					quality_score: qualityAssessment.score,
					accessibility_score: accessibilityAssessment.score,
					verification_notes: verificationNotes
				});

			} catch (error) {
				console.error(`Error verifying video for lesson ${video.lesson_index}:`, error);
				
				verificationResults.push({
					lesson_index: video.lesson_index,
					lesson_title: video.lesson_title,
					original_video: {
						url: video.video_url,
						title: video.video_title,
						duration: video.video_duration,
						confidence_score: video.confidence_score
					},
					verification_status: 'timeout',
					verified_video: null,
					quality_score: 0,
					accessibility_score: 0,
					verification_notes: ['Verification process failed']
				});
			}
		}

		// Calculate summary statistics
		const totalVideos = verificationResults.length;
		const verifiedAvailable = verificationResults.filter(r => r.verification_status === 'available').length;
		const replacedWithFallbacks = verificationResults.filter(r => r.verified_video?.was_replaced).length;
		const failedVerification = verificationResults.filter(r => r.verification_status !== 'available').length;
		
		const avgQualityScore = verificationResults.reduce((sum, r) => sum + r.quality_score, 0) / totalVideos;
		const avgAccessibilityScore = verificationResults.reduce((sum, r) => sum + r.accessibility_score, 0) / totalVideos;

		// Generate recommendations
		const recommendations: string[] = [];
		
		if (failedVerification > totalVideos * 0.3) {
			recommendations.push('High failure rate detected. Consider regenerating videos with different search strategy.');
		}
		
		if (avgQualityScore < 0.6) {
			recommendations.push('Average quality score is low. Consider using more specific keywords or stricter quality criteria.');
		}
		
		if (replacedWithFallbacks > totalVideos * 0.2) {
			recommendations.push('Many videos were replaced with fallbacks. Original search may need refinement.');
		}

		if (avgAccessibilityScore < 0.5) {
			recommendations.push('Accessibility scores are low. Consider prioritizing videos with better educational structure.');
		}

		return json({
			success: true,
			verification_results: verificationResults,
			summary: {
				total_videos: totalVideos,
				verified_available: verifiedAvailable,
				replaced_with_fallbacks: replacedWithFallbacks,
				failed_verification: failedVerification,
				average_quality_score: Math.round(avgQualityScore * 100) / 100,
				average_accessibility_score: Math.round(avgAccessibilityScore * 100) / 100
			},
			recommendations,
			log_id: 'verified'
		});

	} catch (error) {
		console.error('Video verification error:', error);
		
		return json({
			success: false,
			error: 'Video verification failed. Please try again later.'
		}, { status: 500 });
	}
};