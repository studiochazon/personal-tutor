import { json } from '@sveltejs/kit';
import { getConnection } from '$lib/database';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const courseId = parseInt(params.id);
		const lessonId = parseInt(params.lessonId);
		
		if (isNaN(courseId) || isNaN(lessonId)) {
			return json(
				{ error: 'Invalid course or lesson ID' },
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
		
		// Get the specific lesson
		const [lessonRows] = await connection.execute(
			'SELECT * FROM lessons WHERE id = ? AND course_id = ?',
			[lessonId, courseId]
		);
		
		const lessons = lessonRows as any[];
		if (lessons.length === 0) {
			return json(
				{ error: 'Lesson not found' },
				{ status: 404 }
			);
		}
		
		const lesson = lessons[0];
		
		// Get all lessons for this course (for navigation)
		const [allLessonRows] = await connection.execute(
			'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
			[courseId]
		);
		
		const allLessons = allLessonRows as any[];

		return json({
			course,
			lesson,
			allLessons
		});
	} catch (error) {
		console.error('Error fetching lesson:', error);
		return json(
			{ error: 'Failed to fetch lesson' },
			{ status: 500 }
		);
	}
}; 