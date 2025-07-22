import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrUpdateGoogleUser } from '$lib/database';
import jwt from 'jsonwebtoken';
// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { credential } = await request.json();

		if (!credential) {
			return json({ success: false, error: 'No credential provided' }, { status: 400 });
		}

		// Verify the Google ID token
		const googleUser = await verifyGoogleToken(credential);
		
		if (!googleUser) {
			return json({ success: false, error: 'Invalid Google token' }, { status: 401 });
		}

		// Create or update user in database
		const user = await createOrUpdateGoogleUser(googleUser);

		// Generate JWT token
		const token = jwt.sign(
			{ 
				userId: user.id, 
				email: user.email,
				googleId: user.google_id 
			},
			JWT_SECRET,
			{ expiresIn: '7d' }
		);

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
			},
			token
		});

	} catch (error) {
		console.error('Google auth error:', error);
		return json({ 
			success: false, 
			error: 'Authentication failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

async function verifyGoogleToken(credential: string) {
	try {
		// For now, we'll decode the JWT token to get user info
		// In production, you should verify the token with Google's servers
		const decoded = jwt.decode(credential) as any;
		
		if (!decoded || !decoded.sub || !decoded.email) {
			return null;
		}

		return {
			sub: decoded.sub,
			name: decoded.name,
			given_name: decoded.given_name,
			family_name: decoded.family_name,
			picture: decoded.picture,
			email: decoded.email,
			email_verified: decoded.email_verified
		};
	} catch (error) {
		console.error('Token verification error:', error);
		return null;
	}
} 