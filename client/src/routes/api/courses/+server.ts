import { json } from '@sveltejs/kit';
import { getConnection } from '$lib/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const search = url.searchParams.get('search') || '';
		const difficulty = url.searchParams.get('difficulty') || undefined;
		const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20') || 20));
		const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0') || 0);

		const connection = await getConnection();
		
		let query = 'SELECT * FROM courses WHERE is_published = true';
		const params: (string | number)[] = [];
		
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
		console.log('Limit type:', typeof limit, 'Value:', limit);
		console.log('Offset type:', typeof offset, 'Value:', offset);
		
		// Try using query method instead of execute for better compatibility
		const [courseRows] = await connection.query(query, params);
		const courses = courseRows as any[];
		
		// Get total count for pagination
		let countQuery = 'SELECT COUNT(*) as total FROM courses WHERE is_published = true';
		const countParams: (string | number)[] = [];
		
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