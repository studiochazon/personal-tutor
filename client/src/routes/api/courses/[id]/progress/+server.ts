import { json } from '@sveltejs/kit';
import { getCourseProgress } from '$lib/database';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Helper function to verify JWT token and get user ID
function verifyAuthToken(request: Request): { userId: number } | null {
	try {
		const authHeader = request.headers.get('Authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return null;
		}

		const token = authHeader.substring(7);
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		
		if (decoded && decoded.userId) {
			return {
				userId: decoded.userId
			};
		}
		
		return null;
	} catch (error) {
		console.error('JWT verification error:', error);
		return null;
	}
}

export const GET: RequestHandler = async ({ params, request }) => {
	try {
		// Verify authentication
		const authData = verifyAuthToken(request);
		if (!authData) {
			return json(
				{ error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const courseId = parseInt(params.id);
		
		if (isNaN(courseId)) {
			return json(
				{ error: 'Invalid course ID' },
				{ status: 400 }
			);
		}

		const courseProgress = await getCourseProgress(authData.userId, courseId);

		if (!courseProgress) {
			return json(
				{ error: 'Course not found' },
				{ status: 404 }
			);
		}

		return json({
			course_progress: courseProgress
		});
	} catch (error) {
		console.error('Error fetching course progress:', error);
		return json(
			{ error: 'Failed to fetch course progress' },
			{ status: 500 }
		);
	}
}; 