import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface OrchestratorRequest {
	user_prompt: string;
	audience: 'beginner' | 'intermediate' | 'advanced';
	depth: 'overview' | 'comprehensive' | 'deep-dive';
	
	// Algorithm configuration
	lesson_count?: number;
	duration?: number; // Total course duration in minutes
	preferred_video_duration?: number;
	quality_preference?: 'educational' | 'engaging' | 'authoritative';
	
	// Strategy configuration
	keyword_strategy?: 'comprehensive' | 'targeted' | 'mixed';
	search_strategy?: 'comprehensive' | 'targeted' | 'mixed';
	refinement_strategy?: 'optimize_for_videos' | 'maintain_structure' | 'balanced';
	
	// Options
	enable_fallbacks?: boolean;
	quality_threshold?: number;
	max_videos_per_lesson?: number;
	auto_save?: boolean;
	auto_publish?: boolean;
	create_enrollment?: boolean;
	
	// Artifact options
	artifact_types?: string[]; // Types of artifacts to generate
	max_supplementary_artifacts?: number; // Max supplementary artifacts per lesson
	artifact_generation_strategy?: 'comprehensive' | 'targeted' | 'minimal';
	
	// Debug options
	step_by_step?: boolean; // Return intermediate results for each step
	skip_steps?: string[]; // Skip specific steps for testing
}

interface StepResult {
	step_name: string;
	step_number: number;
	success: boolean;
	data?: any;
	error?: string;
	execution_time_ms: number;
	api_endpoint: string;
}

interface OrchestratorResponse {
	success: boolean;
	course_id?: number;
	execution_summary: {
		total_execution_time_ms: number;
		steps_completed: number;
		steps_failed: number;
		final_status: 'completed' | 'partial' | 'failed';
	};
	step_results?: StepResult[];
	final_course?: any;
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

// Helper function to make internal API calls
async function callInternalAPI(
	endpoint: string,
	data: any,
	authHeader: string,
	baseUrl: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const response = await fetch(`${baseUrl}${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': authHeader
			},
			body: JSON.stringify(data)
		});

		const result = await response.json();
		
		if (!response.ok) {
			return {
				success: false,
				error: result.error || `API call failed with status ${response.status}`
			};
		}

		return {
			success: result.success !== false,
			data: result,
			error: result.error
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

// Extract course topic from user prompt using simple parsing
function extractCourseInfo(userPrompt: string): { title: string; topic: string } {
	// Simple extraction - in a real implementation, this could use LLM
	const lowerPrompt = userPrompt.toLowerCase();
	
	// Look for patterns like "create a course about X" or "course on X"
	let topic = userPrompt;
	const patterns = [
		/create\s+(?:a\s+)?course\s+(?:about|on|for)\s+([^.!?]+)/i,
		/course\s+(?:about|on|for)\s+([^.!?]+)/i,
		/learn\s+(?:about\s+)?([^.!?]+)/i,
		/teach\s+(?:me\s+)?(?:about\s+)?([^.!?]+)/i
	];

	for (const pattern of patterns) {
		const match = userPrompt.match(pattern);
		if (match) {
			topic = match[1].trim();
			break;
		}
	}

	// Generate title from topic
	const title = topic.length > 50 
		? `Course: ${topic.substring(0, 47)}...`
		: `Course: ${topic}`;

	return { title, topic };
}

export const POST: RequestHandler = async ({ request }) => {
	const startTime = Date.now();
	let stepResults: StepResult[] = [];
	let authHeader: string;
	let baseUrl: string;

	try {
		// Verify authentication
		const authData = verifyAuthToken(request);
		if (!authData) {
			return json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 }
			);
		}

		// Get auth header for internal API calls
		authHeader = request.headers.get('Authorization') || '';
		
		// Construct base URL for internal API calls
		const url = new URL(request.url);
		baseUrl = `${url.protocol}//${url.host}`;

		const { 
			user_prompt,
			audience,
			depth,
			lesson_count = 6,
			duration = 90,
			preferred_video_duration = 8,
			quality_preference = 'educational',
			keyword_strategy = 'mixed',
			search_strategy = 'mixed',
			refinement_strategy = 'balanced',
			enable_fallbacks = true,
			quality_threshold = 0.4,
			max_videos_per_lesson = 2,
			auto_save = true,
			auto_publish = false,
			create_enrollment = true,
			artifact_types = ['text', 'exercise', 'quiz', 'summary'],
			max_supplementary_artifacts = 3,
			artifact_generation_strategy = 'targeted',
			step_by_step = false,
			skip_steps = []
		}: OrchestratorRequest = await request.json();

		// Validate required fields
		if (!user_prompt || !audience || !depth) {
			return json({
				success: false,
				error: 'Missing required fields: user_prompt, audience, and depth are required'
			}, { status: 400 });
		}

		// Extract course information from prompt
		const { title: courseTitle, topic: courseTopic } = extractCourseInfo(user_prompt);

		console.log(`🚀 Starting v3 Course Creation Engine for: "${courseTitle}"`);
		console.log(`📊 Configuration: ${audience}/${depth}, ${lesson_count} lessons, ${duration}min total`);

		// Step 1: Generate Course Plan
		if (!skip_steps.includes('lesson_planning')) {
			const step1Start = Date.now();
			console.log('📋 Step 1: Generating course plan...');
			
			const planResult = await callInternalAPI(
				'/api/engine/lesson_planning',
				{
					topic: courseTopic,
					audience,
					depth,
					lessonCount: lesson_count,
					duration
				},
				authHeader,
				baseUrl
			);

			stepResults.push({
				step_name: 'Course Plan Generation',
				step_number: 1,
				success: planResult.success,
				data: planResult.data,
				error: planResult.error,
				execution_time_ms: Date.now() - step1Start,
				api_endpoint: '/api/engine/lesson_planning'
			});

			if (!planResult.success) {
				return json({
					success: false,
					execution_summary: {
						total_execution_time_ms: Date.now() - startTime,
						steps_completed: 0,
						steps_failed: 1,
						final_status: 'failed'
					},
					step_results: stepResults,
					error: `Step 1 failed: ${planResult.error}`
				}, { status: 500 });
			}
		}

		const originalLessons = stepResults[0]?.data?.lessons || [];

		// Step 2: Generate Keyword Cloud
		if (!skip_steps.includes('keyword_generation')) {
			const step2Start = Date.now();
			console.log('🏷️ Step 2: Generating keyword cloud...');
			
			const keywordResult = await callInternalAPI(
				'/api/engine/v3/keyword_generation',
				{
					course_title: courseTitle,
					course_topic: courseTopic,
					lessons: originalLessons,
					audience,
					depth
				},
				authHeader,
				baseUrl
			);

			stepResults.push({
				step_name: 'Keyword Cloud Generation',
				step_number: 2,
				success: keywordResult.success,
				data: keywordResult.data,
				error: keywordResult.error,
				execution_time_ms: Date.now() - step2Start,
				api_endpoint: '/api/engine/v3/keyword_generation'
			});

			if (!keywordResult.success) {
				return json({
					success: false,
					execution_summary: {
						total_execution_time_ms: Date.now() - startTime,
						steps_completed: 1,
						steps_failed: 1,
						final_status: 'failed'
					},
					step_results: stepResults,
					error: `Step 2 failed: ${keywordResult.error}`
				}, { status: 500 });
			}
		}

		const keywordCloud = stepResults[1]?.data?.keyword_cloud || {};

		// Step 3: Search Videos Using Keyword Cloud
		if (!skip_steps.includes('video_search')) {
			const step3Start = Date.now();
			console.log('🎥 Step 3: Searching videos with keyword cloud...');
			
			const searchResult = await callInternalAPI(
				'/api/engine/v3/video_search',
				{
					course_title: courseTitle,
					course_topic: courseTopic,
					lessons: originalLessons,
					keyword_cloud: keywordCloud,
					audience,
					preferred_duration: preferred_video_duration,
					quality_preference,
					max_videos_per_lesson,
					search_strategy
				},
				authHeader,
				baseUrl
			);

			stepResults.push({
				step_name: 'Video Search',
				step_number: 3,
				success: searchResult.success,
				data: searchResult.data,
				error: searchResult.error,
				execution_time_ms: Date.now() - step3Start,
				api_endpoint: '/api/engine/v3/video_search'
			});

			if (!searchResult.success) {
				return json({
					success: false,
					execution_summary: {
						total_execution_time_ms: Date.now() - startTime,
						steps_completed: 2,
						steps_failed: 1,
						final_status: 'failed'
					},
					step_results: stepResults,
					error: `Step 3 failed: ${searchResult.error}`
				}, { status: 500 });
			}
		}

		const searchResults = stepResults[2]?.data?.search_results || [];

		// Prepare videos for verification
		const videosForVerification = searchResults.flatMap((result: any) => 
			result.videos.map((video: any) => ({
				lesson_index: result.lesson_index,
				lesson_title: result.lesson_title,
				lesson_topic: originalLessons[result.lesson_index]?.title || 'Unknown',
				video_url: video.video_url,
				video_title: video.video_title,
				video_duration: video.video_duration,
				confidence_score: video.confidence_score,
				search_terms_used: video.search_terms_used || [],
				relevance_reason: video.relevance_reason || 'No reason provided'
			}))
		);

		// Step 4: Verify Videos
		if (!skip_steps.includes('video_verification') && videosForVerification.length > 0) {
			const step4Start = Date.now();
			console.log('✅ Step 4: Verifying videos...');
			
			const verifyResult = await callInternalAPI(
				'/api/engine/v3/video_verification',
				{
					videos: videosForVerification,
					course_title: courseTitle,
					course_topic: courseTopic,
					quality_threshold,
					enable_fallbacks,
					timeout_seconds: 15
				},
				authHeader,
				baseUrl
			);

			stepResults.push({
				step_name: 'Video Verification',
				step_number: 4,
				success: verifyResult.success,
				data: verifyResult.data,
				error: verifyResult.error,
				execution_time_ms: Date.now() - step4Start,
				api_endpoint: '/api/engine/v3/video_verification'
			});

			if (!verifyResult.success) {
				console.warn('Video verification failed, continuing without verified videos');
			}
		}

		const verifiedVideos = stepResults[3]?.data?.verification_results || [];

		// Create lessons with video status for artifact generation
		const lessonsForArtifacts = originalLessons.map((lesson: any, index: number) => {
			const hasVideo = verifiedVideos.some((video: any) => video.lesson_index === index);
			const videoQuality = hasVideo ? 
				verifiedVideos.find((video: any) => video.lesson_index === index)?.quality_score || 0.5 : 0;
			
			return {
				title: lesson.title,
				topic: lesson.topic || lesson.title,
				duration: lesson.duration || 15,
				key_concepts: lesson.key_concepts || [],
				objectives: lesson.objectives || [],
				has_video: hasVideo,
				video_quality: videoQuality
			};
		});

		// Identify lessons without videos
		const lessonsWithoutVideos = lessonsForArtifacts
			.map((lesson, index) => lesson.has_video ? null : index)
			.filter(index => index !== null);

		// Step 5: Generate Learning Artifacts
		if (!skip_steps.includes('artifact_generation')) {
			const step5Start = Date.now();
			console.log('📚 Step 5: Generating learning artifacts...');
			
			const artifactResult = await callInternalAPI(
				'/api/engine/v3/artifact_generation',
				{
					course_title: courseTitle,
					course_topic: courseTopic,
					lessons: lessonsForArtifacts,
					course_context: {
						audience,
						depth,
						total_duration: duration
					},
					artifact_types,
					lessons_without_videos: lessonsWithoutVideos,
					generation_strategy: artifact_generation_strategy
				},
				authHeader,
				baseUrl
			);

			stepResults.push({
				step_name: 'Artifact Generation',
				step_number: 5,
				success: artifactResult.success,
				data: artifactResult.data,
				error: artifactResult.error,
				execution_time_ms: Date.now() - step5Start,
				api_endpoint: '/api/engine/v3/artifact_generation'
			});

			if (!artifactResult.success) {
				console.warn('Artifact generation failed, continuing with video-only content');
			}
		}

		const generatedArtifacts = stepResults[4]?.data?.lessons_with_artifacts || [];

		// Step 6: Prioritize Artifacts
		if (!skip_steps.includes('artifact_prioritization') && generatedArtifacts.length > 0) {
			const step6Start = Date.now();
			console.log('🎯 Step 6: Prioritizing artifacts...');
			
			// Convert verified videos to artifacts format for prioritization
			const lessonsWithAllArtifacts = generatedArtifacts.map((lesson: any) => {
				const lessonVideos = verifiedVideos
					.filter((video: any) => video.lesson_index === lesson.lesson_index)
					.map((video: any) => ({
						type: 'video',
						title: video.video_title || 'Video Lesson',
						content: '',
						content_url: video.video_url,
						metadata: {
							estimated_time: Math.round((video.video_duration || 600) / 60),
							difficulty: 'medium',
							learning_objective: 'Video-based learning',
							video_duration: video.video_duration,
							platform: video.platform || 'youtube'
						},
						quality_score: video.quality_score || 0.7,
						suitability_score: video.confidence_score || 0.8,
						video_url: video.video_url,
						video_duration: video.video_duration,
						confidence_score: video.confidence_score
					}));

				return {
					...lesson,
					artifacts: [...lesson.artifacts, ...lessonVideos],
					has_video: lessonVideos.length > 0
				};
			});

			const prioritizeResult = await callInternalAPI(
				'/api/engine/v3/artifact_prioritization',
				{
					lessons_with_artifacts: lessonsWithAllArtifacts,
					prioritization_strategy: refinement_strategy === 'optimize_for_videos' ? 'video_first' : 
											 refinement_strategy === 'maintain_structure' ? 'content_first' : 'balanced',
					max_supplementary: max_supplementary_artifacts,
					course_context: {
						audience,
						depth,
						total_duration: duration
					},
					quality_threshold
				},
				authHeader,
				baseUrl
			);

			stepResults.push({
				step_name: 'Artifact Prioritization',
				step_number: 6,
				success: prioritizeResult.success,
				data: prioritizeResult.data,
				error: prioritizeResult.error,
				execution_time_ms: Date.now() - step6Start,
				api_endpoint: '/api/engine/v3/artifact_prioritization'
			});

			if (!prioritizeResult.success) {
				console.warn('Artifact prioritization failed, using all artifacts');
			}
		}

		const prioritizedLessons = stepResults[5]?.data?.prioritized_lessons || [];

		// Step 7: Refine Course Plan with Artifact Data
		if (!skip_steps.includes('course_refinement')) {
			const step7Start = Date.now();
			console.log('🔧 Step 7: Refining course plan with artifact data...');
			
			const refineResult = await callInternalAPI(
				'/api/engine/v3/course_plan_refinement',
				{
					course_title: courseTitle,
					course_topic: courseTopic,
					audience,
					depth,
					original_lessons: originalLessons,
					verified_videos: verifiedVideos,
					prioritized_artifacts: prioritizedLessons,
					refinement_strategy,
					min_quality_threshold: quality_threshold
				},
				authHeader,
				baseUrl
			);

			stepResults.push({
				step_name: 'Course Plan Refinement',
				step_number: 7,
				success: refineResult.success,
				data: refineResult.data,
				error: refineResult.error,
				execution_time_ms: Date.now() - step7Start,
				api_endpoint: '/api/engine/v3/course_plan_refinement'
			});

			if (!refineResult.success) {
				return json({
					success: false,
					execution_summary: {
						total_execution_time_ms: Date.now() - startTime,
						steps_completed: stepResults.filter(s => s.success).length,
						steps_failed: 1,
						final_status: 'failed'
					},
					step_results: stepResults,
					error: `Step 7 failed: ${refineResult.error}`
				}, { status: 500 });
			}
		}

		const refinedCourse = stepResults[6]?.data?.refined_course || null;
		const refinementSummary = stepResults[6]?.data?.refinement_summary || {};
		const artifactSummary = stepResults[4]?.data?.generation_summary || {};
		const prioritizationSummary = stepResults[5]?.data?.prioritization_summary || {};

		// Step 8: Save Course (if auto_save is enabled)
		let courseId = null;
		if (auto_save && !skip_steps.includes('course_save')) {
			const step8Start = Date.now();
			console.log('💾 Step 8: Saving course to database...');
			
			// Use prioritized lessons if available, otherwise fall back to refined course
			const finalCourseData = prioritizedLessons.length > 0 ? {
				title: courseTitle,
				topic: courseTopic,
				lessons: prioritizedLessons,
				total_duration: duration,
				video_coverage: prioritizationSummary.artifacts_by_role?.primary || 0,
				quality_score: prioritizationSummary.quality_distribution ? 
					(prioritizationSummary.quality_distribution.high_quality * 1.0 + 
					 prioritizationSummary.quality_distribution.medium_quality * 0.7) / 
					(prioritizationSummary.quality_distribution.high_quality + 
					 prioritizationSummary.quality_distribution.medium_quality + 
					 prioritizationSummary.quality_distribution.low_quality) : 0.7
			} : refinedCourse;

			if (finalCourseData) {
				const saveResult = await callInternalAPI(
					'/api/engine/v3/course_save',
					{
						course_data: finalCourseData,
						metadata: {
							audience,
							depth,
							creation_method: 'v3_engine',
							engine_version: '3.1',
							keyword_strategy,
							refinement_strategy,
							artifact_generation_strategy
						},
						creation_context: {
							user_prompt,
							generation_timestamp: new Date().toISOString(),
							total_videos_found: stepResults[2]?.data?.total_videos_found || 0,
							videos_integrated: refinementSummary.videos_integrated || 0,
							average_video_quality: refinementSummary.average_video_quality || 0,
							total_artifacts_generated: artifactSummary.total_artifacts || 0,
							artifacts_by_type: artifactSummary.artifacts_by_type || {},
							lessons_with_primary_artifacts: prioritizationSummary.lessons_with_primary || 0,
							processing_steps: stepResults.map(s => s.step_name)
						},
						save_options: {
							auto_publish,
							generate_thumbnail: true,
							create_enrollment
						}
					},
					authHeader,
					baseUrl
				);

				stepResults.push({
					step_name: 'Course Save',
					step_number: 8,
					success: saveResult.success,
					data: saveResult.data,
					error: saveResult.error,
					execution_time_ms: Date.now() - step8Start,
					api_endpoint: '/api/engine/v3/course_save'
				});

				if (saveResult.success) {
					courseId = saveResult.data?.course_id;
				}
			} else {
				stepResults.push({
					step_name: 'Course Save',
					step_number: 8,
					success: false,
					error: 'No course data available to save',
					execution_time_ms: Date.now() - step8Start,
					api_endpoint: '/api/engine/v3/course_save'
				});
			}
		}

		const totalTime = Date.now() - startTime;
		const completedSteps = stepResults.filter(s => s.success).length;
		const failedSteps = stepResults.filter(s => !s.success).length;

		console.log(`🎉 Course creation completed in ${totalTime}ms`);
		console.log(`📊 Steps: ${completedSteps} completed, ${failedSteps} failed`);
		if (courseId) {
			console.log(`💾 Course saved with ID: ${courseId}`);
		}

		// Use prioritized course if available, otherwise refined course
		const finalCourseForResponse = prioritizedLessons.length > 0 ? {
			title: courseTitle,
			topic: courseTopic,
			lessons: prioritizedLessons,
			total_duration: duration,
			video_coverage: prioritizationSummary.artifacts_by_role?.primary || 0,
			quality_score: prioritizationSummary.quality_distribution ? 
				(prioritizationSummary.quality_distribution.high_quality * 1.0 + 
				 prioritizationSummary.quality_distribution.medium_quality * 0.7) / 
				(prioritizationSummary.quality_distribution.high_quality + 
				 prioritizationSummary.quality_distribution.medium_quality + 
				 prioritizationSummary.quality_distribution.low_quality) : 0.7
		} : refinedCourse;

		return json({
			success: true,
			course_id: courseId,
			execution_summary: {
				total_execution_time_ms: totalTime,
				steps_completed: completedSteps,
				steps_failed: failedSteps,
				final_status: failedSteps === 0 ? 'completed' : (completedSteps > 0 ? 'partial' : 'failed'),
				// Enhanced summary with artifact information
				artifacts_generated: artifactSummary.total_artifacts || 0,
				lessons_with_primary_artifacts: prioritizationSummary.lessons_with_primary || 0,
				total_supplementary_artifacts: prioritizationSummary.total_supplementary || 0,
				average_artifact_quality: artifactSummary.average_quality_score || 0
			},
			step_results: step_by_step ? stepResults : undefined,
			final_course: finalCourseForResponse,
			artifact_summary: step_by_step ? {
				generation: artifactSummary,
				prioritization: prioritizationSummary
			} : undefined
		});

	} catch (error) {
		console.error('Orchestrator error:', error);
		
		return json({
			success: false,
			execution_summary: {
				total_execution_time_ms: Date.now() - startTime,
				steps_completed: stepResults.filter(s => s.success).length,
				steps_failed: stepResults.filter(s => !s.success).length + 1,
				final_status: 'failed'
			},
			step_results: stepResults,
			error: error instanceof Error ? error.message : 'Unknown orchestrator error'
		}, { status: 500 });
	}
};