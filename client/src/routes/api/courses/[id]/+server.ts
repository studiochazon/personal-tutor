import { json } from '@sveltejs/kit';
import { getConnection } from '$lib/database';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

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

// Helper function to check if user owns a course
async function checkCourseOwnership(courseId: number, userId: number): Promise<boolean> {
	const connection = await getConnection();
	const [rows] = await connection.execute(
		'SELECT owned_by FROM courses WHERE id = ?',
		[courseId]
	);
	const courses = rows as any[];
	return courses.length > 0 && courses[0].owned_by === userId;
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		const courseId = parseInt(params.id);
		
		if (isNaN(courseId)) {
			return json(
				{ error: 'Invalid course ID' },
				{ status: 400 }
			);
		}

		const connection = await getConnection();
		
		// Get course
		const [courseRows] = await connection.execute(
			'SELECT * FROM courses WHERE id = ?',
			[courseId]
		);
		
		const courses = courseRows as any[];
		if (courses.length === 0) {
			return json(
				{ error: 'Course not found' },
				{ status: 404 }
			);
		}
		
		const course = courses[0];
		
		// Get lessons for this course
		const [lessonRows] = await connection.execute(
			'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
			[courseId]
		);
		
		const lessons = lessonRows as any[];

		return json({
			course,
			lessons
		});
	} catch (error) {
		console.error('Error fetching course:', error);
		return json(
			{ error: 'Failed to fetch course' },
			{ status: 500 }
		);
	}
};

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

		const courseId = parseInt(params.id);
		
		if (isNaN(courseId)) {
			return json(
				{ error: 'Invalid course ID' },
				{ status: 400 }
			);
		}

		// Check course ownership
		const isOwner = await checkCourseOwnership(courseId, authData.userId);
		if (!isOwner) {
			return json(
				{ error: 'You can only edit your own courses' },
				{ status: 403 }
			);
		}

		const updateData = await request.json();
		const connection = await getConnection();

		// Build update query dynamically
		const updateFields: string[] = [];
		const updateValues: any[] = [];

		if (updateData.title !== undefined) {
			updateFields.push('title = ?');
			updateValues.push(updateData.title);
		}
		if (updateData.description !== undefined) {
			updateFields.push('description = ?');
			updateValues.push(updateData.description);
		}
		if (updateData.difficulty !== undefined) {
			updateFields.push('difficulty = ?');
			updateValues.push(updateData.difficulty);
		}
		if (updateData.estimated_duration !== undefined) {
			updateFields.push('estimated_duration = ?');
			updateValues.push(updateData.estimated_duration);
		}
		if (updateData.is_published !== undefined) {
			updateFields.push('is_published = ?');
			updateValues.push(updateData.is_published);
		}
		if (updateData.thumbnail_url !== undefined) {
			updateFields.push('thumbnail_url = ?');
			updateValues.push(updateData.thumbnail_url);
		}

		if (updateFields.length === 0) {
			return json(
				{ error: 'No valid fields to update' },
				{ status: 400 }
			);
		}

		updateFields.push('updated_at = NOW()');
		updateValues.push(courseId);

		const query = `UPDATE courses SET ${updateFields.join(', ')} WHERE id = ?`;
		await connection.execute(query, updateValues);

		// Get updated course
		const [courseRows] = await connection.execute(
			'SELECT * FROM courses WHERE id = ?',
			[courseId]
		);
		const course = (courseRows as any[])[0];

		return json({ course });
	} catch (error) {
		console.error('Error updating course:', error);
		return json(
			{ error: 'Failed to update course' },
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

		const courseId = parseInt(params.id);
		
		if (isNaN(courseId)) {
			return json(
				{ error: 'Invalid course ID' },
				{ status: 400 }
			);
		}

		// Check course ownership
		const isOwner = await checkCourseOwnership(courseId, authData.userId);
		if (!isOwner) {
			return json(
				{ error: 'You can only delete your own courses' },
				{ status: 403 }
			);
		}

		const connection = await getConnection();
		
		// Delete course (lessons will be deleted automatically due to CASCADE)
		await connection.execute(
			'DELETE FROM courses WHERE id = ?',
			[courseId]
		);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting course:', error);
		return json(
			{ error: 'Failed to delete course' },
			{ status: 500 }
		);
	}
}; 