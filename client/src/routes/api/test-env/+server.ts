import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		DB_HOST: process.env.DB_HOST,
		DB_USER: process.env.DB_USER,
		DB_PASSWORD: process.env.DB_PASSWORD ? '***SET***' : '***NOT SET***',
		DB_NAME: process.env.DB_NAME,
		DB_PORT: process.env.DB_PORT,
		allEnv: Object.keys(process.env).filter(key => key.startsWith('DB_'))
	});
}; 