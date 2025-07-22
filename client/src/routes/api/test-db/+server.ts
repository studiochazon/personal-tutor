import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConnection } from '$lib/database';

export const GET: RequestHandler = async () => {
	try {
		const connection = await getConnection();
		
		// Test database connection
		const [rows] = await connection.execute('SELECT COUNT(*) as user_count FROM users');
		const userCount = (rows as any)[0].user_count;
		
		// Test table structure
		const [columns] = await connection.execute(`
			SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE 
			FROM INFORMATION_SCHEMA.COLUMNS 
			WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = 'personal_tutor_ai'
		`);
		
		return json({
			success: true,
			message: 'Database connection successful',
			userCount,
			tableStructure: columns
		});
	} catch (error) {
		console.error('Database test error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			details: error
		}, { status: 500 });
	}
}; 