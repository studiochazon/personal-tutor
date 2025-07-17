import { json } from '@sveltejs/kit';
import { getCourseWithLessons } from '$lib/mock-data';
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

		const result = await getCourseWithLessons(courseId);
		
		if (!result) {
			return json(
				{ error: 'Course not found' },
				{ status: 404 }
			);
		}

		return json({
			course: result.course,
			lessons: result.lessons
		});
	} catch (error) {
		console.error('Error fetching course:', error);
		return json(
			{ error: 'Failed to fetch course' },
			{ status: 500 }
		);
	}
}; 