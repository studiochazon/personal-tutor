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

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		const search = url.searchParams.get('search') || '';
		const difficulty = url.searchParams.get('difficulty') || undefined;
		const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20') || 20));
		const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0') || 0);
		const userEnrolled = url.searchParams.get('user_enrolled') === 'true';

		const connection = await getConnection();
		
		let query: string;
		const params: (string | number)[] = [];
		
		if (userEnrolled) {
			// Verify authentication for user-specific queries
			const authData = verifyAuthToken(request);
			if (!authData) {
				return json(
					{ error: 'Authentication required for user-specific queries' },
					{ status: 401 }
				);
			}
			
			// Query for courses the user is enrolled in
			query = `
				SELECT DISTINCT c.*, e.status as enrollment_status, e.enrolled_at
				FROM courses c
				INNER JOIN enrollments e ON c.id = e.course_id
				WHERE e.user_id = ? AND c.is_published = true
			`;
			params.push(authData.userId);
		} else {
			// Query for all published courses
			query = 'SELECT * FROM courses WHERE is_published = true';
		}
		
		if (search) {
			query += ' AND (title LIKE ? OR description LIKE ?)';
			const searchTerm = `%${search}%`;
			params.push(searchTerm, searchTerm);
		}
		
		if (difficulty) {
			query += ' AND difficulty = ?';
			params.push(difficulty);
		}
		
		query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
		params.push(Number(limit), Number(offset));
		
		console.log('Query:', query);
		console.log('Params:', params);
		
		// Try using query method instead of execute for better compatibility
		const [courseRows] = await connection.query(query, params);
		const courses = courseRows as any[];
		
		// Get total count for pagination
		let countQuery: string;
		const countParams: (string | number)[] = [];
		
		if (userEnrolled) {
			const authData = verifyAuthToken(request);
			countQuery = `
				SELECT COUNT(DISTINCT c.id) as total
				FROM courses c
				INNER JOIN enrollments e ON c.id = e.course_id
				WHERE e.user_id = ? AND c.is_published = true
			`;
			countParams.push(authData!.userId);
		} else {
			countQuery = 'SELECT COUNT(*) as total FROM courses WHERE is_published = true';
		}
		
		if (search) {
			countQuery += ' AND (title LIKE ? OR description LIKE ?)';
			const searchTerm = `%${search}%`;
			countParams.push(searchTerm, searchTerm);
		}
		
		if (difficulty) {
			countQuery += ' AND difficulty = ?';
			countParams.push(difficulty);
		}
		
		const [countRows] = await connection.query(countQuery, countParams);
		const total = (countRows as any[])[0].total;

		return json({
			courses,
			total
		});
	} catch (error) {
		console.error('Error fetching courses:', error);
		return json(
			{ error: 'Failed to fetch courses' },
			{ status: 500 }
		);
	}
}; 