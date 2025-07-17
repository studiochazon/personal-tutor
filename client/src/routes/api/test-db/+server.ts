import { json } from '@sveltejs/kit';
import { getConnection } from '$lib/database';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { title, description, difficulty, estimated_duration, lessons: lessonData } = body;

		// Test database connection
		const connection = await getConnection();
		
		// Test read operation
		const [userRows] = await connection.execute('SELECT id FROM users LIMIT 1');
		const users = userRows as any[];
		
		if (users.length === 0) {
			return json({ 
				success: false, 
				error: 'No users found in database. Please ensure the database is properly set up.' 
			});
		}

		const userId = users[0].id;

		// Test write operation - create a test course
		const [courseResult] = await connection.execute(
			'INSERT INTO courses (title, description, difficulty, estimated_duration, user_id, is_published) VALUES (?, ?, ?, ?, ?, ?)',
			[title, description, difficulty, estimated_duration, userId, false]
		);

		const courseId = (courseResult as any).insertId;

		// Test write operation - create test lessons
		for (const lesson of lessonData) {
			await connection.execute(
				'INSERT INTO lessons (course_id, title, content, order_index, estimated_duration) VALUES (?, ?, ?, ?, ?)',
				[courseId, lesson.title, lesson.content, lesson.order_index, lesson.estimated_duration]
			);
		}

		// Test read operation - verify the course was created
		const [courseRows] = await connection.execute(
			'SELECT * FROM courses WHERE id = ?',
			[courseId]
		);

		const [lessonRows] = await connection.execute(
			'SELECT * FROM lessons WHERE course_id = ?',
			[courseId]
		);

		const courses = courseRows as any[];
		const lessons = lessonRows as any[];

		return json({
			success: true,
			courseId,
			message: 'Database connection and write operations successful',
			course: courses[0],
			lessonsCount: lessons.length
		});

	} catch (error) {
		console.error('Database test error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown database error'
		});
	}
}; 