import { json } from '@sveltejs/kit';
import { getUserProgress, updateLessonProgress } from '$lib/database';
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

		const progress = await getUserProgress(authData.userId);

		return json({
			progress
		});
	} catch (error) {
		console.error('Error fetching progress:', error);
		return json(
			{ error: 'Failed to fetch progress' },
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

		const { lesson_id, completed, time_spent } = await request.json();

		if (!lesson_id || typeof lesson_id !== 'number') {
			return json(
				{ error: 'Lesson ID is required' },
				{ status: 400 }
			);
		}

		if (typeof completed !== 'boolean') {
			return json(
				{ error: 'Completed status is required' },
				{ status: 400 }
			);
		}

		const progress = await updateLessonProgress(authData.userId, lesson_id, completed, time_spent);

		return json({
			progress
		});
	} catch (error) {
		console.error('Error updating progress:', error);
		return json(
			{ error: 'Failed to update progress' },
			{ status: 500 }
		);
	}
}; 