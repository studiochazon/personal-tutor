import { json } from '@sveltejs/kit';
import { getAllCourses, searchCourses } from '$lib/mock-data';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const search = url.searchParams.get('search') || '';
		const difficulty = url.searchParams.get('difficulty') || undefined;
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		if (search || difficulty) {
			const result = await searchCourses(search, difficulty, limit, offset);
			return json({
				courses: result.courses,
				total: result.total
			});
		} else {
			const courses = await getAllCourses();
			return json({
				courses,
				total: courses.length
			});
		}
	} catch (error) {
		console.error('Error fetching courses:', error);
		return json(
			{ error: 'Failed to fetch courses' },
			{ status: 500 }
		);
	}
}; 