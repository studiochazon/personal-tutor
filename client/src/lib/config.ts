// Database configuration
export const dbConfig = {
	host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '12345678',
	database: process.env.DB_NAME || 'personal_tutor_ai',
	port: parseInt(process.env.DB_PORT || '3306')
}; 