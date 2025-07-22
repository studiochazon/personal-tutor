import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from '$env/static/private';

// Database configuration (server-side only)
export const dbConfig = {
	host: DB_HOST || 'localhost',
	user: DB_USER || 'root',
	password: DB_PASSWORD || '',
	database: DB_NAME || 'personal_tutor_ai',
	port: parseInt(DB_PORT || '3306')
}; 