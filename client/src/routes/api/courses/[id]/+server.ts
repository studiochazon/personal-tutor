import { json } from '@sveltejs/kit';
import { getConnection } from '$lib/database';
import type { RequestHandler } from './$types';

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