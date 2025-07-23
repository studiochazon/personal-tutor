import { json } from '@sveltejs/kit';
import { updateEnrollmentStatus, deleteEnrollment, getUserEnrollments } from '$lib/database';
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

// Helper function to check if user owns an enrollment
async function checkEnrollmentOwnership(enrollmentId: number, userId: number): Promise<boolean> {
	const enrollments = await getUserEnrollments(userId);
	return enrollments.some(enrollment => enrollment.id === enrollmentId);
}

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		// Verify authentication
		const authData = verifyAuthToken(request);
		if (!authData) {
			return json(
				{ error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const enrollmentId = parseInt(params.id);
		
		if (isNaN(enrollmentId)) {
			return json(
				{ error: 'Invalid enrollment ID' },
				{ status: 400 }
			);
		}

		// Check enrollment ownership
		const isOwner = await checkEnrollmentOwnership(enrollmentId, authData.userId);
		if (!isOwner) {
			return json(
				{ error: 'You can only update your own enrollments' },
				{ status: 403 }
			);
		}

		const { status } = await request.json();

		if (!status || !['active', 'completed', 'paused', 'dropped'].includes(status)) {
			return json(
				{ error: 'Valid status is required' },
				{ status: 400 }
			);
		}

		const enrollment = await updateEnrollmentStatus(enrollmentId, status);

		return json({
			enrollment
		});
	} catch (error) {
		console.error('Error updating enrollment:', error);
		return json(
			{ error: 'Failed to update enrollment' },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		// Verify authentication
		const authData = verifyAuthToken(request);
		if (!authData) {
			return json(
				{ error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const enrollmentId = parseInt(params.id);
		
		if (isNaN(enrollmentId)) {
			return json(
				{ error: 'Invalid enrollment ID' },
				{ status: 400 }
			);
		}

		// Check enrollment ownership
		const isOwner = await checkEnrollmentOwnership(enrollmentId, authData.userId);
		if (!isOwner) {
			return json(
				{ error: 'You can only delete your own enrollments' },
				{ status: 403 }
			);
		}

		await deleteEnrollment(enrollmentId);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting enrollment:', error);
		return json(
			{ error: 'Failed to delete enrollment' },
			{ status: 500 }
		);
	}
}; 