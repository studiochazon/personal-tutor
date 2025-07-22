import { writable } from 'svelte/store';
import type { User } from './types';
import { GOOGLE_CLIENT_ID } from './config';

// Authentication store
export const authStore = writable<{
	user: User | null;
	token: string | null;
	isLoading: boolean;
	error: string | null;
}>({
	user: null,
	token: null,
	isLoading: false,
	error: null
});

// Initialize authentication from localStorage
export function initAuth() {
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('auth_token');
		const userStr = localStorage.getItem('auth_user');
		
		if (token && userStr) {
			try {
				const user = JSON.parse(userStr);
				authStore.set({ user, token, isLoading: false, error: null });
			} catch (error) {
				console.error('Failed to parse stored user:', error);
				logout();
			}
		}
	}
}

// Google Identity Services integration
export function initializeGoogleIdentity() {
	if (typeof window !== 'undefined' && (window as any).google) {
		(window as any).google.accounts.id.initialize({
			client_id: GOOGLE_CLIENT_ID,
			callback: handleGoogleSignIn
		});

		// Render the sign-in button
		(window as any).google.accounts.id.renderButton(
			document.getElementById('google-signin-button'),
			{ 
				theme: 'outline', 
				size: 'large',
				width: 300,
				text: 'signin_with'
			}
		);

		// Enable One Tap sign-in
		(window as any).google.accounts.id.prompt();
	}
}

// Handle Google sign-in callback
async function handleGoogleSignIn(response: any) {
	authStore.update(state => ({ ...state, isLoading: true, error: null }));

	try {
		const result = await fetch('/api/auth/google', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ credential: response.credential })
		});

		const data = await result.json();

		if (data.success) {
			// Store in localStorage
			localStorage.setItem('auth_token', data.token);
			localStorage.setItem('auth_user', JSON.stringify(data.user));
			
			// Update store
			authStore.set({
				user: data.user,
				token: data.token,
				isLoading: false,
				error: null
			});
		} else {
			throw new Error(data.error || 'Authentication failed');
		}
	} catch (error) {
		console.error('Google sign-in error:', error);
		authStore.update(state => ({
			...state,
			isLoading: false,
			error: error instanceof Error ? error.message : 'Authentication failed'
		}));
	}
}

// Logout function
export function logout() {
	localStorage.removeItem('auth_token');
	localStorage.removeItem('auth_user');
	authStore.set({ user: null, token: null, isLoading: false, error: null });
	
	// Sign out from Google
	if (typeof window !== 'undefined' && (window as any).google) {
		(window as any).google.accounts.id.disableAutoSelect();
	}
}

// Get auth token for API requests
export function getAuthToken(): string | null {
	let token: string | null = null;
	authStore.subscribe(state => {
		token = state.token;
	})();
	return token;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
	let authenticated = false;
	authStore.subscribe(state => {
		authenticated = !!state.user && !!state.token;
	})();
	return authenticated;
}

// Verify token with server
export async function verifyToken(): Promise<boolean> {
	const token = getAuthToken();
	if (!token) return false;

	try {
		const result = await fetch('/api/auth/verify', {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		const data = await result.json();
		
		if (data.success) {
			authStore.update(state => ({ ...state, user: data.user }));
			return true;
		} else {
			logout();
			return false;
		}
	} catch (error) {
		console.error('Token verification error:', error);
		logout();
		return false;
	}
} 