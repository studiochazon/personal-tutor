import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';
import { logOpenAIRequest } from '$lib/llm-logger';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

interface Lesson {
	title: string;
	topic: string;
	duration?: number;
	key_concepts: string[];
	objectives: string[];
	has_video: boolean;
	video_quality?: number; // 0-1 score if video exists
}

interface ArtifactGenerationRequest {
	course_title: string;
	course_topic: string;
	lessons: Lesson[];
	course_context: {
		audience: 'beginner' | 'intermediate' | 'advanced';
		depth: 'overview' | 'comprehensive' | 'deep-dive';
		total_duration: number;
	};
	artifact_types: string[]; // ['text', 'exercise', 'quiz', 'reading_list', 'summary', 'checklist']
	lessons_without_videos: number[]; // Lesson indices that need primary artifacts
	generation_strategy?: 'comprehensive' | 'targeted' | 'minimal';
}

interface LearningArtifact {
	type: 'text' | 'exercise' | 'quiz' | 'reading_list' | 'summary' | 'checklist' | 'infographic';
	title: string;
	content: string; // Main content (text, HTML, or structured data as JSON string)
	metadata: {
		estimated_time: number; // Time to complete/read in minutes
		difficulty: 'easy' | 'medium' | 'hard';
		learning_objective: string;
		prerequisites?: string[];
	};
	quality_score: number; // 0-1 confidence in artifact quality
	suitability_score: number; // 0-1 how well it fits the lesson
}

interface LessonWithArtifacts {
	lesson_index: number;
	lesson_title: string;
	artifacts: LearningArtifact[];
	artifact_count: number;
	needs_primary_artifact: boolean;
}

interface ArtifactGenerationResponse {
	success: boolean;
	lessons_with_artifacts?: LessonWithArtifacts[];
	generation_summary?: {
		total_artifacts: number;
		artifacts_by_type: Record<string, number>;
		lessons_enhanced: number;
		average_quality_score: number;
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

function createArtifactGenerationPrompt(
	courseTitle: string,
	courseTopic: string,
	lessons: Lesson[],
	courseContext: any,
	artifactTypes: string[],
	lessonsWithoutVideos: number[],
	strategy: string
): string {
	const lessonDetails = lessons.map((lesson, index) => {
		const hasVideo = lesson.has_video;
		const needsPrimary = lessonsWithoutVideos.includes(index);
		const videoQuality = hasVideo ? lesson.video_quality || 0.5 : 0;
		
		return `${index + 1}. **${lesson.title}** ${needsPrimary ? '🎯 NEEDS PRIMARY ARTIFACT' : ''}
   - Topic: ${lesson.topic}
   - Duration: ${lesson.duration || 15} minutes
   - Key Concepts: ${lesson.key_concepts.join(', ')}
   - Objectives: ${lesson.objectives.join('; ')}
   - Video Status: ${hasVideo ? `✅ Has video (quality: ${(videoQuality * 100).toFixed(0)}%)` : '❌ No video'}`;
	}).join('\n\n');

	const strategyInstructions = {
		comprehensive: 'Generate multiple artifacts per lesson, covering all learning styles',
		targeted: 'Focus on 1-2 high-quality artifacts per lesson based on specific needs',
		minimal: 'Generate only essential artifacts for lessons without videos'
	};

	return `You are an expert educational content creator. Generate learning artifacts to enhance course lessons.

## Course Information
- **Title**: ${courseTitle}
- **Topic**: ${courseTopic}
- **Audience**: ${courseContext.audience}
- **Depth**: ${courseContext.depth}
- **Total Duration**: ${courseContext.total_duration} minutes
- **Lessons**: ${lessons.length}
- **Strategy**: ${strategyInstructions[strategy as keyof typeof strategyInstructions]}

## Lessons Analysis
${lessonDetails}

## Available Artifact Types
${artifactTypes.map(type => `- **${type}**: ${getArtifactDescription(type)}`).join('\n')}

## Generation Strategy (${strategy})
${strategy === 'comprehensive' ? `
- Generate 2-4 artifacts per lesson
- Cover multiple learning styles (visual, auditory, kinesthetic)
- Include both consumable content and interactive elements
- Prioritize lessons without videos for primary artifacts
` : strategy === 'targeted' ? `
- Generate 1-2 high-quality artifacts per lesson
- Focus on complementing existing videos or filling gaps
- Prioritize interactive and practice-based artifacts
- Quality over quantity approach
` : `
- Generate only essential artifacts
- Focus primarily on lessons without videos
- 1 artifact per lesson maximum unless critical need
- Prioritize text summaries and quick references
`}

## Artifact Requirements

### For Lessons WITHOUT Videos (Primary Artifacts Needed):
- Generate substantial learning content that can serve as the main teaching material
- Include detailed explanations, examples, and practice opportunities
- Higher quality score expected (0.8+)
- Prefer: text content, exercises, comprehensive summaries

### For Lessons WITH Videos (Supplementary Artifacts):
- Create complementary materials that enhance video content
- Include practice exercises, quick references, or deep-dive content
- Can be shorter and more focused
- Prefer: exercises, checklists, quizzes, reading lists

### Quality Guidelines:
- **High Quality (0.9-1.0)**: Comprehensive, well-structured, directly supports learning objectives
- **Good Quality (0.7-0.8)**: Solid content, good structure, mostly relevant
- **Acceptable (0.5-0.6)**: Basic content, adequate for purpose
- **Below 0.5**: Avoid if possible

### Artifact Type Guidelines:
- **text**: Detailed explanations, tutorials, guides (1000-3000 words)
- **exercise**: Hands-on practice activities with clear instructions
- **quiz**: 3-5 questions testing key concepts (JSON format)
- **reading_list**: Curated external resources with descriptions
- **summary**: Concise key points and takeaways (300-500 words)
- **checklist**: Step-by-step action items or verification lists
- **infographic**: Structured visual information (described as text/HTML)

## JSON Response Format

Respond with ONLY valid JSON in this exact structure:

{
  "lessons_with_artifacts": [
    {
      "lesson_index": 0,
      "lesson_title": "Lesson Title",
      "artifacts": [
        {
          "type": "text",
          "title": "Comprehensive Guide to Topic",
          "content": "Detailed content here... This should be substantial for primary artifacts (1000+ words) or focused for supplementary ones (300-500 words).",
          "metadata": {
            "estimated_time": 15,
            "difficulty": "medium",
            "learning_objective": "Students will understand and apply key concepts",
            "prerequisites": ["basic knowledge of X"]
          },
          "quality_score": 0.9,
          "suitability_score": 0.95
        },
        {
          "type": "exercise",
          "title": "Hands-on Practice Activity",
          "content": "Step-by-step instructions:\\n1. Do this\\n2. Then this\\n3. Verify results\\n\\nExpected outcomes: [describe what students should achieve]",
          "metadata": {
            "estimated_time": 20,
            "difficulty": "medium",
            "learning_objective": "Apply concepts through practice"
          },
          "quality_score": 0.8,
          "suitability_score": 0.9
        },
        {
          "type": "quiz",
          "title": "Knowledge Check",
          "content": "{\\"questions\\": [{\\"question\\": \\"What is...?\\", \\"options\\": [\\"A\\", \\"B\\", \\"C\\", \\"D\\"], \\"correct\\": 0, \\"explanation\\": \\"Because...\\"}]}",
          "metadata": {
            "estimated_time": 5,
            "difficulty": "easy",
            "learning_objective": "Verify understanding of key concepts"
          },
          "quality_score": 0.7,
          "suitability_score": 0.8
        }
      ],
      "artifact_count": 3,
      "needs_primary_artifact": true
    }
  ]
}

**CRITICAL REQUIREMENTS**:
- Generate substantial content for lessons marked as "NEEDS PRIMARY ARTIFACT"
- Ensure content quality matches the artifact's intended purpose
- Include proper metadata for time estimation and difficulty
- Use appropriate content length based on artifact type and lesson needs
- Focus on ${courseContext.audience}-level content with ${courseContext.depth} coverage

Generate comprehensive learning artifacts now.`;
}

function getArtifactDescription(type: string): string {
	const descriptions = {
		text: 'Detailed written content, guides, explanations',
		exercise: 'Hands-on practice activities and assignments',
		quiz: 'Knowledge assessment questions with answers',
		reading_list: 'Curated external resources and references',
		summary: 'Concise key points and takeaways',
		checklist: 'Step-by-step verification or action lists',
		infographic: 'Visual information presented as structured text/HTML'
	};
	return descriptions[type as keyof typeof descriptions] || 'Learning material';
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
			course_context,
			artifact_types = ['text', 'exercise', 'quiz', 'summary'],
			lessons_without_videos = [],
			generation_strategy = 'targeted'
		}: ArtifactGenerationRequest = await request.json();

		// Validate required fields
		if (!course_title || !course_topic || !lessons || !course_context) {
			return json({
				success: false,
				error: 'Missing required fields: course_title, course_topic, lessons, and course_context are required'
			}, { status: 400 });
		}

		// Validate lessons structure
		if (!Array.isArray(lessons) || lessons.length === 0) {
			return json({
				success: false,
				error: 'lessons must be a non-empty array'
			}, { status: 400 });
		}

		// Validate course context
		if (!['beginner', 'intermediate', 'advanced'].includes(course_context.audience)) {
			return json({
				success: false,
				error: 'Invalid audience in course_context'
			}, { status: 400 });
		}

		if (!['overview', 'comprehensive', 'deep-dive'].includes(course_context.depth)) {
			return json({
				success: false,
				error: 'Invalid depth in course_context'
			}, { status: 400 });
		}

		if (!['comprehensive', 'targeted', 'minimal'].includes(generation_strategy)) {
			return json({
				success: false,
				error: 'Invalid generation_strategy. Must be: comprehensive, targeted, or minimal'
			}, { status: 400 });
		}

		console.log(`Generating artifacts for: ${course_title} using ${generation_strategy} strategy`);
		console.log(`Lessons without videos: ${lessons_without_videos.length}/${lessons.length}`);

		// Create the artifact generation prompt
		const prompt = createArtifactGenerationPrompt(
			course_title,
			course_topic,
			lessons,
			course_context,
			artifact_types,
			lessons_without_videos,
			generation_strategy
		);

		// Make API call with logging
		const data = await logOpenAIRequest(
			{
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: 'You are an expert educational content creator specializing in learning artifact generation. Create high-quality educational materials. Respond with ONLY valid JSON.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 4000,
				temperature: 0.4
			},
			`Artifact generation for course: ${course_title}`,
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
								content: 'You are an expert educational content creator. Generate learning artifacts. Respond with ONLY valid JSON.'
							},
							{
								role: 'user',
								content: prompt
							}
						],
						max_tokens: 4000,
						temperature: 0.4
					})
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error('OpenAI API error:', response.status, errorText);
					throw new Error(`OpenAI API error: ${response.status}`);
				}

				return response;
			},
			'artifact_generation'
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
			const artifactData = JSON.parse(jsonContent);
			
			if (!artifactData.lessons_with_artifacts || !Array.isArray(artifactData.lessons_with_artifacts)) {
				throw new Error('Invalid response structure: lessons_with_artifacts array is required');
			}

			// Validate and enhance artifact data
			const validatedLessons: LessonWithArtifacts[] = artifactData.lessons_with_artifacts.map((lesson: any, index: number) => {
				const validArtifacts = (lesson.artifacts || []).map((artifact: any) => ({
					type: artifact.type || 'text',
					title: artifact.title || `Learning Material ${index + 1}`,
					content: artifact.content || 'Content will be generated.',
					metadata: {
						estimated_time: artifact.metadata?.estimated_time || 10,
						difficulty: artifact.metadata?.difficulty || 'medium',
						learning_objective: artifact.metadata?.learning_objective || 'Support lesson learning',
						prerequisites: artifact.metadata?.prerequisites || []
					},
					quality_score: Math.min(1, Math.max(0, artifact.quality_score || 0.7)),
					suitability_score: Math.min(1, Math.max(0, artifact.suitability_score || 0.8))
				}));

				return {
					lesson_index: lesson.lesson_index !== undefined ? lesson.lesson_index : index,
					lesson_title: lesson.lesson_title || lessons[index]?.title || `Lesson ${index + 1}`,
					artifacts: validArtifacts,
					artifact_count: validArtifacts.length,
					needs_primary_artifact: lessons_without_videos.includes(lesson.lesson_index || index)
				};
			});

			// Calculate generation summary
			const totalArtifacts = validatedLessons.reduce((total, lesson) => total + lesson.artifact_count, 0);
			const artifactsByType: Record<string, number> = {};
			let totalQualityScore = 0;
			
			validatedLessons.forEach(lesson => {
				lesson.artifacts.forEach(artifact => {
					artifactsByType[artifact.type] = (artifactsByType[artifact.type] || 0) + 1;
					totalQualityScore += artifact.quality_score;
				});
			});

			const averageQualityScore = totalArtifacts > 0 ? totalQualityScore / totalArtifacts : 0;

			return json({
				success: true,
				lessons_with_artifacts: validatedLessons,
				generation_summary: {
					total_artifacts: totalArtifacts,
					artifacts_by_type: artifactsByType,
					lessons_enhanced: validatedLessons.length,
					average_quality_score: averageQualityScore
				},
				log_id: 'logged'
			});

		} catch (parseError) {
			console.error('Failed to parse artifact data:', parseError);
			console.error('Raw content:', responseContent);
			
			// Return fallback artifacts for lessons without videos
			const fallbackLessons: LessonWithArtifacts[] = lessons.map((lesson, index) => {
				const needsPrimary = lessons_without_videos.includes(index);
				const artifacts: LearningArtifact[] = needsPrimary ? [
					{
						type: 'text',
						title: `Study Guide: ${lesson.title}`,
						content: `# ${lesson.title}\n\nThis lesson covers: ${lesson.key_concepts.join(', ')}\n\n## Learning Objectives\n${lesson.objectives.map(obj => `- ${obj}`).join('\n')}\n\n## Key Concepts\n${lesson.key_concepts.map(concept => `### ${concept}\n[Content to be developed]\n`).join('\n')}`,
						metadata: {
							estimated_time: lesson.duration || 15,
							difficulty: 'medium',
							learning_objective: lesson.objectives[0] || 'Learn key concepts'
						},
						quality_score: 0.6,
						suitability_score: 0.8
					}
				] : [
					{
						type: 'summary',
						title: `Quick Reference: ${lesson.title}`,
						content: `## Key Points\n${lesson.key_concepts.map(concept => `- ${concept}`).join('\n')}\n\n## Learning Objectives\n${lesson.objectives.map(obj => `- ${obj}`).join('\n')}`,
						metadata: {
							estimated_time: 5,
							difficulty: 'easy',
							learning_objective: 'Quick review of concepts'
						},
						quality_score: 0.5,
						suitability_score: 0.7
					}
				];

				return {
					lesson_index: index,
					lesson_title: lesson.title,
					artifacts,
					artifact_count: artifacts.length,
					needs_primary_artifact: needsPrimary
				};
			});

			return json({
				success: true,
				lessons_with_artifacts: fallbackLessons,
				generation_summary: {
					total_artifacts: fallbackLessons.reduce((total, lesson) => total + lesson.artifact_count, 0),
					artifacts_by_type: { text: lessons_without_videos.length, summary: lessons.length - lessons_without_videos.length },
					lessons_enhanced: lessons.length,
					average_quality_score: 0.6
				},
				log_id: 'fallback'
			});
		}

	} catch (error) {
		console.error('Artifact generation error:', error);
		
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
			error: 'Artifact generation failed. Please try again later.'
		}, { status: 500 });
	}
};