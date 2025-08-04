import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConnection } from '$lib/database';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface VideoIntegration {
	primary_video: {
		url: string;
		title: string;
		duration: number;
		confidence_score: number;
		integration_notes: string;
	} | null;
	video_timing: 'start' | 'middle' | 'end' | 'throughout' | 'none';
	video_role: 'primary' | 'supplementary' | 'example' | 'none';
}

interface QualityIndicators {
	video_alignment: number;
	content_completeness: number;
	learning_effectiveness: number;
}

// Support both old and new lesson structures for backward compatibility
interface RefinedLesson {
	title: string;
	objectives: string[];
	duration: number;
	order: number;
	key_concepts: string[];
	prerequisites?: string[];
	video_integration?: VideoIntegration; // Old structure - optional for backward compatibility
	content_adjustments?: string[];
	quality_indicators?: QualityIndicators;
}

// New lesson structure with artifacts
interface PrioritizedLesson {
	lesson_index: number;
	lesson_title: string;
	lesson_topic: string;
	lesson_duration: number;
	primary_artifact: any | null;
	supplementary_artifacts: any[];
	total_artifacts: number;
	prioritization_notes: string;
}

interface CourseSaveRequest {
	course_data: {
		title: string;
		topic: string;
		lessons: RefinedLesson[] | PrioritizedLesson[]; // Support both structures
		total_duration: number;
		video_coverage: number;
		quality_score: number;
	};
	metadata: {
		audience: 'beginner' | 'intermediate' | 'advanced';
		depth: 'overview' | 'comprehensive' | 'deep-dive';
		creation_method: 'v3_engine';
		engine_version: string;
		keyword_strategy?: string;
		refinement_strategy?: string;
	};
	creation_context: {
		user_prompt?: string;
		generation_timestamp: string;
		total_videos_found: number;
		videos_integrated: number;
		average_video_quality: number;
		processing_steps: string[];
	};
	save_options?: {
		auto_publish?: boolean;
		generate_thumbnail?: boolean;
		create_enrollment?: boolean;
	};
}

interface CourseSaveResponse {
	success: boolean;
	course_id?: number;
	course_details?: {
		id: number;
		title: string;
		topic: string;
		lesson_count: number;
		total_duration: number;
		video_coverage: number;
		created_at: string;
		status: 'draft' | 'published';
	};
	database_operations?: {
		course_created: boolean;
		lessons_created: number;
		artifacts_linked: number;
		metadata_saved: boolean;
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

// Generate course description from lessons and metadata
function generateCourseDescription(
	courseData: any,
	metadata: any,
	creationContext: any
): string {
	const lessonTitles = courseData.lessons.map((lesson: any) => lesson.title).join(', ');
	const videoInfo = creationContext.videos_integrated > 0 
		? `This course includes ${creationContext.videos_integrated} integrated videos with an average quality score of ${(creationContext.average_video_quality * 100).toFixed(0)}%.`
		: 'This course focuses on text-based learning materials.';

	return `A ${metadata.depth} ${metadata.audience}-level course on ${courseData.topic}. 

Course includes: ${lessonTitles}

${videoInfo}

Generated using the v3 course creation engine with ${metadata.keyword_strategy || 'balanced'} keyword strategy and ${metadata.refinement_strategy || 'balanced'} refinement approach.

Total duration: ${courseData.total_duration} minutes across ${courseData.lessons.length} lessons.
Video coverage: ${(courseData.video_coverage * 100).toFixed(0)}%
Overall quality score: ${(courseData.quality_score * 100).toFixed(0)}%`;
}

// Create default course thumbnail based on topic
function generateThumbnailUrl(topic: string): string {
	// For now, return the default thumbnail
	// In a real implementation, this could generate topic-specific thumbnails
	return '/images/default-course-thumbnail.svg';
}

export const POST: RequestHandler = async ({ request }) => {
	let connection;
	
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
			course_data,
			metadata,
			creation_context,
			save_options = {}
		}: CourseSaveRequest = await request.json();

		// Validate required fields
		if (!course_data || !metadata || !creation_context) {
			return json({
				success: false,
				error: 'Missing required fields: course_data, metadata, and creation_context are required'
			}, { status: 400 });
		}

		// Validate course data structure
		if (!course_data.title || !course_data.topic || !Array.isArray(course_data.lessons)) {
			return json({
				success: false,
				error: 'Invalid course_data: title, topic, and lessons array are required'
			}, { status: 400 });
		}

		if (course_data.lessons.length === 0) {
			return json({
				success: false,
				error: 'Course must have at least one lesson'
			}, { status: 400 });
		}

		// Validate metadata
		if (!['beginner', 'intermediate', 'advanced'].includes(metadata.audience)) {
			return json({
				success: false,
				error: 'Invalid audience in metadata'
			}, { status: 400 });
		}

		if (!['overview', 'comprehensive', 'deep-dive'].includes(metadata.depth)) {
			return json({
				success: false,
				error: 'Invalid depth in metadata'
			}, { status: 400 });
		}

		console.log(`Saving course: ${course_data.title} (${course_data.lessons.length} lessons, ${creation_context.videos_integrated} videos)`);

		// Get database connection
		connection = await getConnection();

		// Generate course description and thumbnail
		const description = generateCourseDescription(course_data, metadata, creation_context);
		const thumbnailUrl = save_options.generate_thumbnail !== false 
			? generateThumbnailUrl(course_data.topic) 
			: '/images/default-course-thumbnail.svg';

		// Start transaction
		await connection.beginTransaction();

		try {
			// Insert course
			const [courseResult] = await connection.execute(
				`INSERT INTO courses (
					title, description, thumbnail_url, owned_by, created_at, updated_at
				) VALUES (?, ?, ?, ?, NOW(), NOW())`,
				[
					course_data.title,
					description,
					thumbnailUrl,
					authData.userId
				]
			) as any;

			const courseId = courseResult.insertId;

			// Insert course metadata
			await connection.execute(
				`INSERT INTO course_metadata (
					course_id, audience, depth, creation_method, engine_version,
					total_duration, video_coverage, quality_score, keyword_strategy,
					refinement_strategy, user_prompt, generation_timestamp,
					total_videos_found, videos_integrated, average_video_quality,
					processing_steps, created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
				[
					courseId,
					metadata.audience,
					metadata.depth,
					metadata.creation_method,
					metadata.engine_version || 'v3.0',
					course_data.total_duration,
					course_data.video_coverage,
					course_data.quality_score,
					metadata.keyword_strategy || null,
					metadata.refinement_strategy || null,
					creation_context.user_prompt || null,
					creation_context.generation_timestamp,
					creation_context.total_videos_found,
					creation_context.videos_integrated,
					creation_context.average_video_quality,
					JSON.stringify(creation_context.processing_steps),
				]
			);

			// Insert lessons
			let lessonsCreated = 0;
			let artifactsLinked = 0;

			for (let i = 0; i < course_data.lessons.length; i++) {
				const lesson = course_data.lessons[i];
				
				// Check if this is a prioritized lesson or refined lesson
				const isPrioritizedLesson = 'lesson_index' in lesson && 'primary_artifact' in lesson;
				
				// Extract lesson data based on structure
				const lessonData = isPrioritizedLesson ? {
					title: (lesson as PrioritizedLesson).lesson_title,
					duration: (lesson as PrioritizedLesson).lesson_duration,
					order: (lesson as PrioritizedLesson).lesson_index + 1,
					topic: (lesson as PrioritizedLesson).lesson_topic,
					objectives: [],
					key_concepts: [],
					prerequisites: [],
					prioritization_notes: (lesson as PrioritizedLesson).prioritization_notes
				} : {
					title: (lesson as RefinedLesson).title,
					duration: (lesson as RefinedLesson).duration,
					order: (lesson as RefinedLesson).order,
					topic: '',
					objectives: (lesson as RefinedLesson).objectives || [],
					key_concepts: (lesson as RefinedLesson).key_concepts || [],
					prerequisites: (lesson as RefinedLesson).prerequisites || [],
					content_adjustments: (lesson as RefinedLesson).content_adjustments || [],
					quality_indicators: (lesson as RefinedLesson).quality_indicators || {}
				};

				// Insert lesson
				const [lessonResult] = await connection.execute(
					`INSERT INTO lessons (
						course_id, title, content, duration, lesson_order, lesson_topic, created_at, updated_at
					) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
					[
						courseId,
						lessonData.title,
						JSON.stringify({
							objectives: lessonData.objectives,
							key_concepts: lessonData.key_concepts,
							prerequisites: lessonData.prerequisites,
							content_adjustments: lessonData.content_adjustments || [],
							quality_indicators: lessonData.quality_indicators || {},
							prioritization_notes: lessonData.prioritization_notes || ''
						}),
						lessonData.duration,
						lessonData.order,
						lessonData.topic || null
					]
				) as any;

				const lessonId = lessonResult.insertId;
				lessonsCreated++;

				if (isPrioritizedLesson) {
					// Handle new artifact structure
					const prioritizedLesson = lesson as PrioritizedLesson;
					
					// Insert primary artifact
					if (prioritizedLesson.primary_artifact) {
						const artifact = prioritizedLesson.primary_artifact;
						
						// Insert into artifacts table
						const [artifactResult] = await connection.execute(
							`INSERT INTO artifacts (
								type, title, content, content_url, metadata, created_at, updated_at
							) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
							[
								artifact.type,
								artifact.title,
								artifact.content || '',
								artifact.content_url || artifact.video_url || null,
								JSON.stringify(artifact.metadata || {})
							]
						) as any;

						const artifactId = artifactResult.insertId;

						// Link artifact to lesson
						await connection.execute(
							`INSERT INTO lesson_artifacts (
								lesson_id, artifact_id, priority_role, display_order, priority_score,
								selection_reason, integration_notes, created_at, updated_at
							) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
							[
								lessonId,
								artifactId,
								'primary',
								1,
								artifact.priority_score || 0.8,
								artifact.selection_reason || 'Primary learning content',
								artifact.integration_notes || ''
							]
						);
						
						artifactsLinked++;
					}

					// Insert supplementary artifacts
					for (let j = 0; j < prioritizedLesson.supplementary_artifacts.length; j++) {
						const artifact = prioritizedLesson.supplementary_artifacts[j];
						
						// Insert into artifacts table
						const [artifactResult] = await connection.execute(
							`INSERT INTO artifacts (
								type, title, content, content_url, metadata, created_at, updated_at
							) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
							[
								artifact.type,
								artifact.title,
								artifact.content || '',
								artifact.content_url || artifact.video_url || null,
								JSON.stringify(artifact.metadata || {})
							]
						) as any;

						const artifactId = artifactResult.insertId;

						// Link artifact to lesson
						await connection.execute(
							`INSERT INTO lesson_artifacts (
								lesson_id, artifact_id, priority_role, display_order, priority_score,
								selection_reason, integration_notes, created_at, updated_at
							) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
							[
								lessonId,
								artifactId,
								'supplementary',
								j + 2, // Start after primary (which is 1)
								artifact.priority_score || 0.6,
								artifact.selection_reason || 'Supplementary learning content',
								artifact.integration_notes || ''
							]
						);
						
						artifactsLinked++;
					}
				} else {
					// Handle old video integration structure for backward compatibility
					const refinedLesson = lesson as RefinedLesson;
					if (refinedLesson.video_integration?.primary_video) {
						// Convert old video structure to artifact
						const video = refinedLesson.video_integration.primary_video;
						
						// Insert as video artifact
						const [artifactResult] = await connection.execute(
							`INSERT INTO artifacts (
								type, title, content, content_url, metadata, created_at, updated_at
							) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
							[
								'video',
								video.title,
								'',
								video.url,
								JSON.stringify({
									estimated_time: Math.round(video.duration / 60),
									difficulty: 'medium',
									learning_objective: 'Video-based learning',
									video_duration: video.duration,
									platform: video.url.includes('youtube') ? 'youtube' : 'other',
									confidence_score: video.confidence_score
								})
							]
						) as any;

						const artifactId = artifactResult.insertId;

						// Link to lesson as primary
						await connection.execute(
							`INSERT INTO lesson_artifacts (
								lesson_id, artifact_id, priority_role, display_order, priority_score,
								selection_reason, integration_notes, created_at, updated_at
							) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
							[
								lessonId,
								artifactId,
								'primary',
								1,
								video.confidence_score || 0.7,
								'Migrated from video integration',
								video.integration_notes || ''
							]
						);
						
						artifactsLinked++;
					}
				}
			}

			// Auto-publish if requested
			let courseStatus = 'draft';
			if (save_options.auto_publish) {
				await connection.execute(
					`UPDATE courses SET status = 'published', published_at = NOW() WHERE id = ?`,
					[courseId]
				);
				courseStatus = 'published';
			}

			// Create enrollment if requested
			if (save_options.create_enrollment) {
				await connection.execute(
					`INSERT INTO enrollments (user_id, course_id, enrolled_at, status) 
					 VALUES (?, ?, NOW(), 'active')
					 ON DUPLICATE KEY UPDATE status = 'active', enrolled_at = NOW()`,
					[authData.userId, courseId]
				);
			}

			// Commit transaction
			await connection.commit();

			// Get created course details
			const [courseDetails] = await connection.execute(
				`SELECT id, title, description, thumbnail_url, created_at, 
						COALESCE(status, 'draft') as status
				 FROM courses WHERE id = ?`,
				[courseId]
			) as any;

			const course = courseDetails[0];

			return json({
				success: true,
				course_id: courseId,
				course_details: {
					id: course.id,
					title: course.title,
					topic: course_data.topic,
					lesson_count: lessonsCreated,
					total_duration: course_data.total_duration,
					video_coverage: course_data.video_coverage,
					created_at: course.created_at,
					status: course.status
				},
				database_operations: {
					course_created: true,
					lessons_created: lessonsCreated,
					artifacts_linked: artifactsLinked,
					metadata_saved: true
				},
				log_id: 'saved'
			});

		} catch (dbError) {
			// Rollback transaction on error
			await connection.rollback();
			throw dbError;
		}

	} catch (error) {
		console.error('Course save error:', error);
		
		if (error instanceof Error) {
			if (error.message.includes('ER_DUP_ENTRY')) {
				return json({
					success: false,
					error: 'A course with this title already exists for this user'
				}, { status: 409 });
			}
			
			if (error.message.includes('ER_NO_REFERENCED_ROW')) {
				return json({
					success: false,
					error: 'Invalid user reference - authentication may have expired'
				}, { status: 401 });
			}
		}
		
		return json({
			success: false,
			error: 'Course save failed. Please try again later.'
		}, { status: 500 });
	} finally {
		if (connection) {
			connection.release();
		}
	}
};