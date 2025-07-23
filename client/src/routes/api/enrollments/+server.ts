import { json } from '@sveltejs/kit';
import { getUserEnrollments, createEnrollment } from '$lib/database';
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

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Verify authentication
		const authData = verifyAuthToken(request);
		if (!authData) {
			return json(
				{ error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const enrollments = await getUserEnrollments(authData.userId);

		return json({
			enrollments
		});
	} catch (error) {
		console.error('Error fetching enrollments:', error);
		return json(
			{ error: 'Failed to fetch enrollments' },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Verify authentication
		const authData = verifyAuthToken(request);
		if (!authData) {
			return json(
				{ error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const { course_id } = await request.json();

		if (!course_id || typeof course_id !== 'number') {
			return json(
				{ error: 'Course ID is required' },
				{ status: 400 }
			);
		}

		const enrollment = await createEnrollment(authData.userId, course_id);

		return json({
			enrollment
		});
	} catch (error) {
		console.error('Error creating enrollment:', error);
		return json(
			{ error: 'Failed to create enrollment' },
			{ status: 500 }
		);
	}
}; 