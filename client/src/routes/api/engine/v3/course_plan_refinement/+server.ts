import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface OriginalLesson {
	title: string;
	objectives: string[];
	duration: number;
	order: number;
	key_concepts: string[];
	prerequisites?: string[];
}

interface VerifiedVideo {
	url: string;
	title: string;
	duration: number;
	confidence_score: number;
	was_replaced: boolean;
	replacement_reason?: string;
}

interface VideoData {
	lesson_index: number;
	lesson_title: string;
	verification_status: 'available' | 'unavailable' | 'timeout' | 'quality_issue';
	verified_video: VerifiedVideo | null;
	quality_score: number;
	accessibility_score: number;
	verification_notes: string[];
}

interface CoursePlanRefinementRequest {
	course_title: string;
	course_topic: string;
	audience: 'beginner' | 'intermediate' | 'advanced';
	depth: 'overview' | 'comprehensive' | 'deep-dive';
	original_lessons: OriginalLesson[];
	verified_videos: VideoData[];
	prioritized_artifacts?: any[]; // Optional prioritized artifacts from new engine flow
	refinement_strategy?: 'optimize_for_videos' | 'maintain_structure' | 'balanced';
	min_quality_threshold?: number;
}

interface RefinedLesson {
	title: string;
	objectives: string[];
	duration: number;
	order: number;
	key_concepts: string[];
	prerequisites?: string[];
	video_integration: {
		primary_video: {
			url: string;
			title: string;
			duration: number;
			confidence_score: number;
			integration_notes: string;
		} | null;
		video_timing: 'start' | 'middle' | 'end' | 'throughout' | 'none';
		video_role: 'primary' | 'supplementary' | 'example' | 'none';
	};
	content_adjustments: string[];
	quality_indicators: {
		video_alignment: number; // 0-1 how well video aligns with lesson
		content_completeness: number; // 0-1 how complete the lesson content will be
		learning_effectiveness: number; // 0-1 predicted learning effectiveness
	};
}

interface CoursePlanRefinementResponse {
	success: boolean;
	refined_course?: {
		title: string;
		topic: string;
		lessons: RefinedLesson[];
		total_duration: number;
		video_coverage: number; // 0-1 percentage of lessons with quality videos
		quality_score: number; // 0-1 overall course quality score
	};
	refinement_summary?: {
		lessons_optimized: number;
		lessons_restructured: number;
		lessons_removed: number;
		videos_integrated: number;
		average_video_quality: number;
		recommendations: string[];
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

function createCoursePlanRefinementPrompt(
	courseTitle: string,
	courseTopic: string,
	audience: string,
	depth: string,
	originalLessons: OriginalLesson[],
	verifiedVideos: VideoData[],
	refinementStrategy: string,
	minQualityThreshold: number
): string {
	const strategyDescriptions = {
		optimize_for_videos: 'Restructure lessons to maximize video integration and effectiveness',
		maintain_structure: 'Keep original lesson structure but optimize video integration',
		balanced: 'Balance between maintaining structure and optimizing for available videos'
	};

	const originalLessonsText = originalLessons.map((lesson, index) => 
		`${index + 1}. **${lesson.title}** (${lesson.duration} min)
   - Objectives: ${lesson.objectives.join('; ')}
   - Key Concepts: ${lesson.key_concepts.join(', ')}
   - Prerequisites: ${lesson.prerequisites?.join(', ') || 'None'}`
	).join('\n\n');

	const videoAnalysis = verifiedVideos.map((video, index) => {
		const status = video.verification_status;
		const quality = video.quality_score;
		const accessibility = video.accessibility_score;
		
		return `${index + 1}. **${video.lesson_title}**
   - Video Status: ${status}
   - Quality Score: ${quality.toFixed(2)} | Accessibility: ${accessibility.toFixed(2)}
   ${video.verified_video ? `- Available Video: "${video.verified_video.title}" (${Math.round(video.verified_video.duration/60)}min, confidence: ${video.verified_video.confidence_score.toFixed(2)})` : '- No suitable video available'}
   ${video.verified_video?.was_replaced ? `- Replacement: ${video.verified_video.replacement_reason}` : ''}
   - Notes: ${video.verification_notes.join('; ')}`;
	}).join('\n\n');

	return `You are an expert curriculum designer specializing in video-enhanced learning. Refine this course plan to optimally integrate the available verified videos.

## Course Information
- **Title**: ${courseTitle}
- **Topic**: ${courseTopic}
- **Audience**: ${audience}
- **Depth**: ${depth}
- **Refinement Strategy**: ${strategyDescriptions[refinementStrategy as keyof typeof strategyDescriptions]}
- **Minimum Quality Threshold**: ${minQualityThreshold}

## Original Course Plan
${originalLessonsText}

## Video Verification Analysis
${videoAnalysis}

## Refinement Task

### Strategy: ${refinementStrategy}
${refinementStrategy === 'optimize_for_videos' ? `
**Optimization Focus:**
- Restructure lessons around high-quality available videos
- Combine or split lessons based on video availability and quality
- Adjust learning objectives to match video content strengths
- Remove or modify lessons with poor video support
` : refinementStrategy === 'maintain_structure' ? `
**Structure Preservation Focus:**
- Keep original lesson sequence and objectives
- Integrate videos as supplementary materials where available
- Adjust content timing to accommodate video lengths
- Maintain learning progression even with limited video support
` : `
**Balanced Approach:**
- Moderate restructuring to improve video integration
- Maintain core learning objectives while optimizing for available videos
- Strategic lesson adjustments where video quality is high
- Preserve essential content flow while enhancing with multimedia
`}

### Quality Integration Rules
1. **High Quality Videos (>= 0.7)**: Use as primary learning content
2. **Medium Quality Videos (0.4-0.7)**: Use as supplementary material
3. **Low Quality Videos (< ${minQualityThreshold})**: Consider exclusion or find alternatives
4. **No Videos**: Maintain lesson but note the need for alternative content

### Lesson Refinement Guidelines
For each lesson:
1. **Analyze Video-Content Alignment**: How well does the available video match the lesson objectives?
2. **Determine Video Role**: Primary content, supplementary material, example, or not used
3. **Adjust Learning Objectives**: Optimize based on video content and quality
4. **Timing Integration**: When in the lesson should the video be used?
5. **Content Modifications**: What adjustments are needed to the lesson content?

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "refined_course": {
    "title": "${courseTitle}",
    "topic": "${courseTopic}",
    "lessons": [
      {
        "title": "Refined lesson title",
        "objectives": [
          "Updated learning objective 1",
          "Updated learning objective 2"
        ],
        "duration": 20,
        "order": 1,
        "key_concepts": [
          "Key concept 1",
          "Key concept 2"
        ],
        "prerequisites": ["Previous knowledge if needed"],
        "video_integration": {
          "primary_video": {
            "url": "video_url_if_available",
            "title": "Video title",
            "duration": 600,
            "confidence_score": 0.8,
            "integration_notes": "How the video enhances the lesson"
          },
          "video_timing": "start|middle|end|throughout|none",
          "video_role": "primary|supplementary|example|none"
        },
        "content_adjustments": [
          "Adjustment 1: Detailed description",
          "Adjustment 2: Detailed description"
        ],
        "quality_indicators": {
          "video_alignment": 0.8,
          "content_completeness": 0.9,
          "learning_effectiveness": 0.85
        }
      }
    ],
    "total_duration": 120,
    "video_coverage": 0.75,
    "quality_score": 0.8
  },
  "refinement_summary": {
    "lessons_optimized": 3,
    "lessons_restructured": 1,
    "lessons_removed": 0,
    "videos_integrated": 4,
    "average_video_quality": 0.72,
    "recommendations": [
      "Recommendation 1",
      "Recommendation 2"
    ]
  }
}

**Important Considerations:**
- Ensure refined lessons maintain educational coherence
- Balance video integration with comprehensive learning coverage
- Consider ${audience} audience needs and ${depth} requirements
- Provide detailed integration strategies for each video
- Include realistic quality assessments and learning effectiveness predictions

Refine the course plan now.`;
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
			audience,
			depth,
			original_lessons,
			verified_videos,
			refinement_strategy = 'balanced',
			min_quality_threshold = 0.4
		}: CoursePlanRefinementRequest = await request.json();

		// Validate required fields
		if (!course_title || !course_topic || !audience || !depth || !original_lessons || !verified_videos) {
			return json({
				success: false,
				error: 'Missing required fields: course_title, course_topic, audience, depth, original_lessons, and verified_videos are required'
			}, { status: 400 });
		}

		// Validate arrays
		if (!Array.isArray(original_lessons) || original_lessons.length === 0) {
			return json({
				success: false,
				error: 'original_lessons must be a non-empty array'
			}, { status: 400 });
		}

		if (!Array.isArray(verified_videos) || verified_videos.length === 0) {
			return json({
				success: false,
				error: 'verified_videos must be a non-empty array'
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

		if (!['optimize_for_videos', 'maintain_structure', 'balanced'].includes(refinement_strategy)) {
			return json({
				success: false,
				error: 'Invalid refinement_strategy. Must be: optimize_for_videos, maintain_structure, or balanced'
			}, { status: 400 });
		}

		console.log(`Refining course plan for: ${course_title} using ${refinement_strategy} strategy`);

		// Create the course plan refinement prompt
		const prompt = createCoursePlanRefinementPrompt(
			course_title,
			course_topic,
			audience,
			depth,
			original_lessons,
			verified_videos,
			refinement_strategy,
			min_quality_threshold
		);

		// Make API call with logging
		const data = await logOpenAIRequest(
			{
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: 'You are an expert curriculum designer specializing in video-enhanced learning. Create optimized course plans that integrate multimedia effectively. Respond with ONLY valid JSON.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 4000,
				temperature: 0.3
			},
			`Course plan refinement: ${course_title}`,
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
								content: 'You are an expert curriculum designer. Create optimized course plans with video integration. Respond with ONLY valid JSON.'
							},
							{
								role: 'user',
								content: prompt
							}
						],
						max_tokens: 4000,
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
			const refinementData = JSON.parse(jsonContent);
			
			// Validate response structure
			if (!refinementData.refined_course || !refinementData.refinement_summary) {
				throw new Error('Invalid response structure: refined_course and refinement_summary are required');
			}

			// Ensure all lessons have required fields with defaults
			const validatedLessons: RefinedLesson[] = (refinementData.refined_course.lessons || []).map((lesson: any, index: number) => ({
				title: lesson.title || `Lesson ${index + 1}`,
				objectives: Array.isArray(lesson.objectives) ? lesson.objectives : [`Learn about ${course_topic}`],
				duration: lesson.duration || 15,
				order: lesson.order || index + 1,
				key_concepts: Array.isArray(lesson.key_concepts) ? lesson.key_concepts : [],
				prerequisites: Array.isArray(lesson.prerequisites) ? lesson.prerequisites : undefined,
				video_integration: {
					primary_video: lesson.video_integration?.primary_video || null,
					video_timing: lesson.video_integration?.video_timing || 'none',
					video_role: lesson.video_integration?.video_role || 'none'
				},
				content_adjustments: Array.isArray(lesson.content_adjustments) ? lesson.content_adjustments : [],
				quality_indicators: {
					video_alignment: lesson.quality_indicators?.video_alignment || 0.5,
					content_completeness: lesson.quality_indicators?.content_completeness || 0.7,
					learning_effectiveness: lesson.quality_indicators?.learning_effectiveness || 0.6
				}
			}));

			const totalDuration = validatedLessons.reduce((sum, lesson) => sum + lesson.duration, 0);
			const lessonsWithVideos = validatedLessons.filter(lesson => lesson.video_integration.primary_video).length;
			const videoCoverage = lessonsWithVideos / validatedLessons.length;
			
			const avgVideoAlignment = validatedLessons.reduce((sum, lesson) => sum + lesson.quality_indicators.video_alignment, 0) / validatedLessons.length;
			const avgContentCompleteness = validatedLessons.reduce((sum, lesson) => sum + lesson.quality_indicators.content_completeness, 0) / validatedLessons.length;
			const avgLearningEffectiveness = validatedLessons.reduce((sum, lesson) => sum + lesson.quality_indicators.learning_effectiveness, 0) / validatedLessons.length;
			
			const qualityScore = (avgVideoAlignment + avgContentCompleteness + avgLearningEffectiveness) / 3;

			return json({
				success: true,
				refined_course: {
					title: course_title,
					topic: course_topic,
					lessons: validatedLessons,
					total_duration: totalDuration,
					video_coverage: Math.round(videoCoverage * 100) / 100,
					quality_score: Math.round(qualityScore * 100) / 100
				},
				refinement_summary: {
					lessons_optimized: refinementData.refinement_summary.lessons_optimized || 0,
					lessons_restructured: refinementData.refinement_summary.lessons_restructured || 0,
					lessons_removed: refinementData.refinement_summary.lessons_removed || 0,
					videos_integrated: lessonsWithVideos,
					average_video_quality: Math.round((verified_videos.reduce((sum, v) => sum + v.quality_score, 0) / verified_videos.length) * 100) / 100,
					recommendations: Array.isArray(refinementData.refinement_summary.recommendations) ? refinementData.refinement_summary.recommendations : []
				},
				log_id: 'logged'
			});

		} catch (parseError) {
			console.error('Failed to parse refinement data:', parseError);
			console.error('Raw content:', responseContent);
			
			// Return fallback refined course
			const fallbackLessons: RefinedLesson[] = original_lessons.map((lesson, index) => {
				const videoData = verified_videos[index];
				const hasQualityVideo = videoData?.verified_video && videoData.quality_score >= min_quality_threshold;
				
				return {
					title: lesson.title,
					objectives: lesson.objectives,
					duration: lesson.duration,
					order: lesson.order,
					key_concepts: lesson.key_concepts,
					prerequisites: lesson.prerequisites,
					video_integration: {
						primary_video: hasQualityVideo ? {
							url: videoData.verified_video!.url,
							title: videoData.verified_video!.title,
							duration: videoData.verified_video!.duration,
							confidence_score: videoData.verified_video!.confidence_score,
							integration_notes: 'Basic integration fallback'
						} : null,
						video_timing: hasQualityVideo ? 'middle' : 'none',
						video_role: hasQualityVideo ? 'supplementary' : 'none'
					},
					content_adjustments: [],
					quality_indicators: {
						video_alignment: hasQualityVideo ? videoData.quality_score : 0,
						content_completeness: 0.7,
						learning_effectiveness: hasQualityVideo ? 0.7 : 0.6
					}
				};
			});

			return json({
				success: true,
				refined_course: {
					title: course_title,
					topic: course_topic,
					lessons: fallbackLessons,
					total_duration: fallbackLessons.reduce((sum, lesson) => sum + lesson.duration, 0),
					video_coverage: fallbackLessons.filter(l => l.video_integration.primary_video).length / fallbackLessons.length,
					quality_score: 0.6
				},
				refinement_summary: {
					lessons_optimized: 0,
					lessons_restructured: 0,
					lessons_removed: 0,
					videos_integrated: fallbackLessons.filter(l => l.video_integration.primary_video).length,
					average_video_quality: verified_videos.reduce((sum, v) => sum + v.quality_score, 0) / verified_videos.length,
					recommendations: ['Refinement parsing failed - using fallback structure', 'Consider regenerating with different parameters']
				},
				log_id: 'fallback'
			});
		}

	} catch (error) {
		console.error('Course plan refinement error:', error);
		
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
			error: 'Course plan refinement failed. Please try again later.'
		}, { status: 500 });
	}
};