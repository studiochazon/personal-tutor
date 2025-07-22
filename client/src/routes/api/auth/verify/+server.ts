import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserById } from '$lib/database';
import jwt from 'jsonwebtoken';
// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ success: false, error: 'No token provided' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		
		// Verify JWT token
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		
		if (!decoded || !decoded.userId) {
			return json({ success: false, error: 'Invalid token' }, { status: 401 });
		}

		// Get user from database
		const user = await getUserById(decoded.userId);
		
		if (!user) {
			return json({ success: false, error: 'User not found' }, { status: 401 });
		}

		return json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				avatar_url: user.avatar_url,
				email_verified: user.email_verified,
				given_name: user.given_name,
				family_name: user.family_name
			}
		});

	} catch (error) {
		console.error('Token verification error:', error);
		return json({ success: false, error: 'Token verification failed' }, { status: 401 });
	}
}; 