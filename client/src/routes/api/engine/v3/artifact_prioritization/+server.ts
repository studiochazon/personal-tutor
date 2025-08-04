import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface LearningArtifact {
	type: 'video' | 'text' | 'exercise' | 'quiz' | 'reading_list' | 'summary' | 'checklist' | 'infographic';
	title: string;
	content: string;
	metadata: {
		estimated_time: number;
		difficulty: 'easy' | 'medium' | 'hard';
		learning_objective: string;
		prerequisites?: string[];
	};
	quality_score: number; // 0-1
	suitability_score: number; // 0-1
	// Video-specific fields (if type is 'video')
	video_url?: string;
	video_duration?: number;
	confidence_score?: number;
}

interface LessonWithArtifacts {
	lesson_index: number;
	lesson_title: string;
	lesson_topic: string;
	lesson_duration: number;
	artifacts: LearningArtifact[];
	has_video: boolean;
	needs_primary_artifact: boolean;
}

interface ArtifactPrioritizationRequest {
	lessons_with_artifacts: LessonWithArtifacts[];
	prioritization_strategy: 'video_first' | 'content_first' | 'balanced';
	max_supplementary: number; // 2-3 as per requirement
	course_context: {
		audience: 'beginner' | 'intermediate' | 'advanced';
		depth: 'overview' | 'comprehensive' | 'deep-dive';
		total_duration: number;
	};
	quality_threshold?: number; // Minimum quality score for artifacts (default 0.5)
}

interface PrioritizedArtifact extends LearningArtifact {
	priority_role: 'primary' | 'supplementary';
	priority_score: number; // 0-1 calculated priority
	selection_reason: string;
	display_order: number; // 1-based order for display
}

interface PrioritizedLesson {
	lesson_index: number;
	lesson_title: string;
	lesson_topic: string;
	lesson_duration: number;
	primary_artifact: PrioritizedArtifact | null;
	supplementary_artifacts: PrioritizedArtifact[];
	total_artifacts: number;
	prioritization_notes: string;
}

interface ArtifactPrioritizationResponse {
	success: boolean;
	prioritized_lessons?: PrioritizedLesson[];
	prioritization_summary?: {
		lessons_processed: number;
		lessons_with_primary: number;
		total_supplementary: number;
		artifacts_by_role: {
			primary: number;
			supplementary: number;
		};
		artifacts_by_type: Record<string, number>;
		average_artifacts_per_lesson: number;
		quality_distribution: {
			high_quality: number; // 0.8+
			medium_quality: number; // 0.5-0.8
			low_quality: number; // <0.5
		};
	};
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

// Calculate priority score for an artifact
function calculatePriorityScore(
	artifact: LearningArtifact,
	lesson: LessonWithArtifacts,
	strategy: string,
	courseContext: any
): number {
	let score = 0;

	// Base score from artifact quality and suitability
	const baseScore = (artifact.quality_score + artifact.suitability_score) / 2;
	score += baseScore * 0.4;

	// Strategy-specific scoring
	switch (strategy) {
		case 'video_first':
			if (artifact.type === 'video') {
				score += 0.4; // Strong preference for videos
			} else if (!lesson.has_video) {
				score += 0.3; // High priority for non-video if no video exists
			} else {
				score += 0.1; // Lower priority if video already exists
			}
			break;

		case 'content_first':
			if (artifact.type === 'text' || artifact.type === 'exercise') {
				score += 0.4; // Prefer substantial content
			} else if (artifact.type === 'video') {
				score += 0.2; // Videos are supplementary
			} else {
				score += 0.3; // Other artifacts moderate priority
			}
			break;

		case 'balanced':
			// Balanced approach - consider lesson needs
			if (lesson.needs_primary_artifact && ['video', 'text', 'exercise'].includes(artifact.type)) {
				score += 0.3; // Good primary candidates
			} else if (['quiz', 'summary', 'checklist'].includes(artifact.type)) {
				score += 0.2; // Good supplementary candidates
			} else {
				score += 0.25; // Neutral
			}
			break;
	}

	// Adjust for audience and depth
	const difficultyMultiplier = {
		beginner: { easy: 1.2, medium: 1.0, hard: 0.8 },
		intermediate: { easy: 0.9, medium: 1.2, hard: 1.0 },
		advanced: { easy: 0.8, medium: 1.0, hard: 1.2 }
	};

	const audienceKey = courseContext.audience as keyof typeof difficultyMultiplier;
	const diffKey = artifact.metadata.difficulty as keyof typeof difficultyMultiplier[typeof audienceKey];
	score *= difficultyMultiplier[audienceKey][diffKey];

	// Depth adjustment
	if (courseContext.depth === 'deep-dive' && ['text', 'exercise', 'reading_list'].includes(artifact.type)) {
		score += 0.1; // Favor detailed content for deep-dive
	} else if (courseContext.depth === 'overview' && ['summary', 'checklist', 'quiz'].includes(artifact.type)) {
		score += 0.1; // Favor concise content for overview
	}

	// Time consideration - prefer artifacts that fit lesson duration
	const timeRatio = artifact.metadata.estimated_time / lesson.lesson_duration;
	if (timeRatio > 0.3 && timeRatio < 0.8) {
		score += 0.05; // Good time fit
	} else if (timeRatio > 1.2) {
		score -= 0.1; // Too long for lesson
	}

	return Math.min(1, Math.max(0, score));
}

// Select primary artifact for a lesson
function selectPrimaryArtifact(
	lesson: LessonWithArtifacts,
	strategy: string,
	courseContext: any,
	qualityThreshold: number
): PrioritizedArtifact | null {
	// Filter artifacts above quality threshold
	const qualifiedArtifacts = lesson.artifacts.filter(artifact => 
		artifact.quality_score >= qualityThreshold
	);

	if (qualifiedArtifacts.length === 0) {
		return null;
	}

	// Calculate priority scores
	const scoredArtifacts = qualifiedArtifacts.map(artifact => ({
		artifact,
		priority_score: calculatePriorityScore(artifact, lesson, strategy, courseContext)
	}));

	// Sort by priority score
	scoredArtifacts.sort((a, b) => b.priority_score - a.priority_score);

	const selectedArtifact = scoredArtifacts[0].artifact;
	const priorityScore = scoredArtifacts[0].priority_score;

	// Generate selection reason
	let selectionReason = '';
	if (selectedArtifact.type === 'video' && strategy === 'video_first') {
		selectionReason = 'Selected as primary due to video-first strategy and high quality';
	} else if (['text', 'exercise'].includes(selectedArtifact.type) && !lesson.has_video) {
		selectionReason = 'Selected as primary to provide substantial learning content in absence of video';
	} else if (selectedArtifact.quality_score > 0.8) {
		selectionReason = 'Selected as primary due to high quality score and content suitability';
	} else {
		selectionReason = 'Selected as primary based on prioritization algorithm and lesson needs';
	}

	return {
		...selectedArtifact,
		priority_role: 'primary',
		priority_score: priorityScore,
		selection_reason: selectionReason,
		display_order: 1
	};
}

// Select supplementary artifacts for a lesson
function selectSupplementaryArtifacts(
	lesson: LessonWithArtifacts,
	primaryArtifact: PrioritizedArtifact | null,
	maxSupplementary: number,
	strategy: string,
	courseContext: any,
	qualityThreshold: number
): PrioritizedArtifact[] {
	// Filter out the primary artifact and low quality artifacts
	const availableArtifacts = lesson.artifacts.filter(artifact => 
		artifact !== primaryArtifact &&
		artifact.quality_score >= Math.max(0.4, qualityThreshold - 0.1) // Slightly lower threshold for supplementary
	);

	if (availableArtifacts.length === 0) {
		return [];
	}

	// Calculate priority scores
	const scoredArtifacts = availableArtifacts.map(artifact => ({
		artifact,
		priority_score: calculatePriorityScore(artifact, lesson, strategy, courseContext)
	}));

	// Sort by priority score
	scoredArtifacts.sort((a, b) => b.priority_score - a.priority_score);

	// Select top artifacts up to maxSupplementary
	const selectedArtifacts = scoredArtifacts
		.slice(0, maxSupplementary)
		.map((item, index) => ({
			...item.artifact,
			priority_role: 'supplementary' as const,
			priority_score: item.priority_score,
			selection_reason: `Selected as supplementary #${index + 1} to complement primary content`,
			display_order: index + 2 // Start after primary (which is 1)
		}));

	return selectedArtifacts;
}

// Generate prioritization notes for a lesson
function generatePrioritizationNotes(
	lesson: LessonWithArtifacts,
	primaryArtifact: PrioritizedArtifact | null,
	supplementaryArtifacts: PrioritizedArtifact[],
	strategy: string
): string {
	const notes = [];

	if (primaryArtifact) {
		notes.push(`Primary: ${primaryArtifact.type} (${primaryArtifact.title}) - quality: ${(primaryArtifact.quality_score * 100).toFixed(0)}%`);
	} else {
		notes.push('No primary artifact selected - all artifacts below quality threshold');
	}

	if (supplementaryArtifacts.length > 0) {
		notes.push(`Supplementary: ${supplementaryArtifacts.length} artifacts selected`);
		supplementaryArtifacts.forEach((artifact, index) => {
			notes.push(`  ${index + 1}. ${artifact.type} (${artifact.title})`);
		});
	} else {
		notes.push('No supplementary artifacts selected');
	}

	notes.push(`Strategy: ${strategy}, Total artifacts: ${lesson.artifacts.length}`);

	return notes.join('\n');
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
			lessons_with_artifacts,
			prioritization_strategy,
			max_supplementary = 3,
			course_context,
			quality_threshold = 0.5
		}: ArtifactPrioritizationRequest = await request.json();

		// Validate required fields
		if (!lessons_with_artifacts || !prioritization_strategy || !course_context) {
			return json({
				success: false,
				error: 'Missing required fields: lessons_with_artifacts, prioritization_strategy, and course_context are required'
			}, { status: 400 });
		}

		// Validate lessons structure
		if (!Array.isArray(lessons_with_artifacts) || lessons_with_artifacts.length === 0) {
			return json({
				success: false,
				error: 'lessons_with_artifacts must be a non-empty array'
			}, { status: 400 });
		}

		// Validate strategy
		if (!['video_first', 'content_first', 'balanced'].includes(prioritization_strategy)) {
			return json({
				success: false,
				error: 'Invalid prioritization_strategy. Must be: video_first, content_first, or balanced'
			}, { status: 400 });
		}

		// Validate course context
		if (!['beginner', 'intermediate', 'advanced'].includes(course_context.audience)) {
			return json({
				success: false,
				error: 'Invalid audience in course_context'
			}, { status: 400 });
		}

		// Validate max_supplementary
		if (max_supplementary < 1 || max_supplementary > 5) {
			return json({
				success: false,
				error: 'max_supplementary must be between 1 and 5'
			}, { status: 400 });
		}

		console.log(`Prioritizing artifacts for ${lessons_with_artifacts.length} lessons using ${prioritization_strategy} strategy`);
		console.log(`Max supplementary: ${max_supplementary}, Quality threshold: ${quality_threshold}`);

		// Process each lesson
		const prioritizedLessons: PrioritizedLesson[] = [];
		let lessonsWithPrimary = 0;
		let totalSupplementary = 0;
		const artifactsByRole = { primary: 0, supplementary: 0 };
		const artifactsByType: Record<string, number> = {};
		const qualityDistribution = { high_quality: 0, medium_quality: 0, low_quality: 0 };

		for (const lesson of lessons_with_artifacts) {
			// Select primary artifact
			const primaryArtifact = selectPrimaryArtifact(
				lesson,
				prioritization_strategy,
				course_context,
				quality_threshold
			);

			// Select supplementary artifacts
			const supplementaryArtifacts = selectSupplementaryArtifacts(
				lesson,
				primaryArtifact,
				max_supplementary,
				prioritization_strategy,
				course_context,
				quality_threshold
			);

			// Generate prioritization notes
			const prioritizationNotes = generatePrioritizationNotes(
				lesson,
				primaryArtifact,
				supplementaryArtifacts,
				prioritization_strategy
			);

			// Create prioritized lesson
			const prioritizedLesson: PrioritizedLesson = {
				lesson_index: lesson.lesson_index,
				lesson_title: lesson.lesson_title,
				lesson_topic: lesson.lesson_topic,
				lesson_duration: lesson.lesson_duration,
				primary_artifact: primaryArtifact,
				supplementary_artifacts: supplementaryArtifacts,
				total_artifacts: (primaryArtifact ? 1 : 0) + supplementaryArtifacts.length,
				prioritization_notes: prioritizationNotes
			};

			prioritizedLessons.push(prioritizedLesson);

			// Update statistics
			if (primaryArtifact) {
				lessonsWithPrimary++;
				artifactsByRole.primary++;
				artifactsByType[primaryArtifact.type] = (artifactsByType[primaryArtifact.type] || 0) + 1;
				
				// Quality distribution
				if (primaryArtifact.quality_score >= 0.8) {
					qualityDistribution.high_quality++;
				} else if (primaryArtifact.quality_score >= 0.5) {
					qualityDistribution.medium_quality++;
				} else {
					qualityDistribution.low_quality++;
				}
			}

			totalSupplementary += supplementaryArtifacts.length;
			artifactsByRole.supplementary += supplementaryArtifacts.length;

			supplementaryArtifacts.forEach(artifact => {
				artifactsByType[artifact.type] = (artifactsByType[artifact.type] || 0) + 1;
				
				// Quality distribution
				if (artifact.quality_score >= 0.8) {
					qualityDistribution.high_quality++;
				} else if (artifact.quality_score >= 0.5) {
					qualityDistribution.medium_quality++;
				} else {
					qualityDistribution.low_quality++;
				}
			});
		}

		// Calculate summary statistics
		const totalArtifacts = artifactsByRole.primary + artifactsByRole.supplementary;
		const averageArtifactsPerLesson = lessons_with_artifacts.length > 0 
			? totalArtifacts / lessons_with_artifacts.length 
			: 0;

		return json({
			success: true,
			prioritized_lessons: prioritizedLessons,
			prioritization_summary: {
				lessons_processed: lessons_with_artifacts.length,
				lessons_with_primary: lessonsWithPrimary,
				total_supplementary: totalSupplementary,
				artifacts_by_role: artifactsByRole,
				artifacts_by_type: artifactsByType,
				average_artifacts_per_lesson: Math.round(averageArtifactsPerLesson * 100) / 100,
				quality_distribution: qualityDistribution
			}
		});

	} catch (error) {
		console.error('Artifact prioritization error:', error);
		
		return json({
			success: false,
			error: 'Artifact prioritization failed. Please try again later.'
		}, { status: 500 });
	}
};