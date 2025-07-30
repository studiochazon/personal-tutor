import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { originalCourseService } from '$lib/services/original-course-service';
import { simpleCourseService } from '$lib/services/simple-course-service';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

type CreationSystem = 'original' | 'simple';

interface UnifiedCourseRequest {
	userPrompt: string;
	system: CreationSystem;
	audience?: string;
	depth?: string;
}

interface UnifiedCourseResponse {
	success: boolean;
	system: CreationSystem;
	
	// Original system response
	course?: any;
	
	// Simple system response  
	response?: string;
	logId?: string;
	model?: string;
	
	// Common
	error?: string;
	timestamp: string;
}

// Helper function to verify JWT token and get user ID
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

/**
 * Unified Course Creation API
 * 
 * POST /api/course-creation
 * 
 * Body:
 * {
 *   "userPrompt": "Create a course about...",
 *   "system": "original" | "simple",
 *   "audience": "beginners" | "intermediate" | "advanced",
 *   "depth": "overview" | "comprehensive" | "deep-dive"
 * }
 * 
 * Returns different response formats based on the system chosen.
 */
export const POST: RequestHandler = async ({ request }) => {
	const timestamp = new Date().toISOString();
	
	try {
		// Verify authentication
		const authData = verifyAuthToken(request);
		if (!authData) {
			return json(
				{ 
					success: false, 
					error: 'Authentication required',
					system: 'unknown',
					timestamp 
				} as UnifiedCourseResponse,
				{ status: 401 }
			);
		}

		const { userPrompt, system, audience, depth }: UnifiedCourseRequest = await request.json();

		// Validate required fields
		if (!userPrompt || typeof userPrompt !== 'string') {
			return json(
				{ 
					success: false, 
					error: 'Invalid user prompt',
					system: system || 'unknown',
					timestamp 
				} as UnifiedCourseResponse,
				{ status: 400 }
			);
		}

		if (!system || !['original', 'simple'].includes(system)) {
			return json(
				{ 
					success: false, 
					error: 'Invalid system. Must be "original" or "simple"',
					system: system || 'unknown',
					timestamp 
				} as UnifiedCourseResponse,
				{ status: 400 }
			);
		}

		console.log(`🚀 Course creation request using ${system} system:`, { userPrompt, audience, depth });

		// Route to appropriate service based on system
		if (system === 'original') {
			const result = await originalCourseService.createCourse(
				{ userPrompt, audience, depth },
				authData.userId
			);

			return json({
				success: result.success,
				system: 'original',
				course: result.course,
				error: result.error,
				timestamp
			} as UnifiedCourseResponse);

		} else if (system === 'simple') {
			const result = await simpleCourseService.createCourse(
				{ userPrompt, audience, depth }
			);

			return json({
				success: result.success,
				system: 'simple',
				response: result.response,
				logId: result.logId,
				model: result.model,
				error: result.error,
				timestamp
			} as UnifiedCourseResponse);
		}

		// Should never reach here due to validation above
		return json(
			{ 
				success: false, 
				error: 'Unknown system type',
				system,
				timestamp 
			} as UnifiedCourseResponse,
			{ status: 400 }
		);

	} catch (error) {
		console.error('Unified course creation API error:', error);
		return json(
			{ 
				success: false, 
				error: 'Internal server error',
				system: 'unknown',
				timestamp 
			} as UnifiedCourseResponse,
			{ status: 500 }
		);
	}
};

/**
 * Get information about available course creation systems
 */
export const GET: RequestHandler = async () => {
	return json({
		systems: {
			original: {
				name: 'Original Complex System',
				description: 'Creates structured JSON courses stored in database',
				features: [
					'Database storage',
					'Full course/lesson entities',
					'Video validation',
					'Complex prompting',
					'JSON parsing'
				],
				model: 'gpt-4',
				output: 'Database course with lessons',
				redirect: '/courses/[id]'
			},
			simple: {
				name: 'Simple Web Search System',
				description: 'Creates natural language courses with web search',
				features: [
					'Web search integration',
					'Text file logging',
					'Consecutive numbering',
					'Enhanced prompting',
					'Real-time information'
				],
				model: 'gpt-4o-search-preview',
				output: 'Text file in llm-logs/simple-response/',
				redirect: null
			}
		},
		defaultSystem: 'simple',
		timestamp: new Date().toISOString()
	});
};