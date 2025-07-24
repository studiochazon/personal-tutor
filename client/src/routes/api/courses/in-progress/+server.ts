import { json } from '@sveltejs/kit';
import { getConnection } from '$lib/database';
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

		const connection = await getConnection();
		
		// Query for courses the user is enrolled in with progress information
		const query = `
			SELECT 
				c.*,
				e.status as enrollment_status,
				e.enrolled_at,
				e.completed_at as enrollment_completed_at,
				COUNT(l.id) as total_lessons,
				COUNT(p.id) as completed_lessons,
				CASE 
					WHEN COUNT(l.id) = 0 THEN 0
					ELSE ROUND((COUNT(p.id) / COUNT(l.id)) * 100, 2)
				END as progress_percentage
			FROM courses c
			INNER JOIN enrollments e ON c.id = e.course_id
			LEFT JOIN lessons l ON c.id = l.course_id
			LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = ? AND p.completed = true
			WHERE e.user_id = ? AND c.is_published = true
			GROUP BY c.id, c.title, c.description, c.thumbnail_url, c.difficulty, 
					 c.estimated_duration, c.owned_by, c.is_published, c.created_at, 
					 c.updated_at, e.status, e.enrolled_at, e.completed_at
			ORDER BY e.enrolled_at DESC
		`;
		
		const [courseRows] = await connection.query(query, [authData.userId, authData.userId]);
		const courses = courseRows as any[];
		
		// Filter for active enrollments (not completed, paused, or dropped)
		const inProgressCourses = courses.filter(course => 
			course.enrollment_status === 'active' || course.enrollment_status === null
		);

		return json({
			courses: inProgressCourses,
			total: inProgressCourses.length
		});
	} catch (error) {
		console.error('Error fetching in-progress courses:', error);
		return json(
			{ error: 'Failed to fetch in-progress courses' },
			{ status: 500 }
		);
	}
}; 