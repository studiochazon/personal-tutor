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

// Helper function to get current auth store state
export function getAuthStoreState() {
	let state: any;
	authStore.subscribe(s => state = s)();
	return state;
}

// Initialize authentication from localStorage
export function initAuth() {
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('auth_token');
		const userStr = localStorage.getItem('auth_user');
		
		if (token && userStr) {
			try {
				const user = JSON.parse(userStr);
				// Set the store with the stored data
				authStore.set({ user, token, isLoading: false, error: null });
				return true;
			} catch (error) {
				console.error('Failed to parse stored user:', error);
				logout();
				return false;
			}
		} else {
			// No stored auth data, ensure store is in logged out state
			authStore.set({ user: null, token: null, isLoading: false, error: null });
			return false;
		}
	}
	return false;
}

// Google Identity Services integration
export function initializeGoogleIdentity() {
	if (typeof window !== 'undefined' && (window as any).google) {
		try {
			(window as any).google.accounts.id.initialize({
				client_id: GOOGLE_CLIENT_ID,
				callback: handleGoogleSignIn,
				auto_select: false,
				cancel_on_tap_outside: true
			});

			// Render the sign-in button
			(window as any).google.accounts.id.renderButton(
				document.getElementById('google-signin-button'),
				{ 
					theme: 'outline', 
					size: 'large',
					width: 300,
					text: 'signin_with',
					shape: 'rectangular'
				}
			);

			// Enable One Tap sign-in (optional)
			try {
				(window as any).google.accounts.id.prompt((notification: any) => {
					if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
						// One Tap is not displayed or skipped, this is normal
						console.log('One Tap sign-in not available:', notification.getNotDisplayedReason());
					}
				});
			} catch (error) {
				console.log('One Tap sign-in not available:', error);
			}
		} catch (error) {
			console.error('Failed to initialize Google Identity:', error);
			// Show a fallback message to the user
			const buttonContainer = document.getElementById('google-signin-button');
			if (buttonContainer) {
				buttonContainer.innerHTML = `
					<div style="padding: 12px; border: 1px solid #ccc; border-radius: 4px; text-align: center; color: #666;">
						Google Sign-In is currently unavailable. Please try again later.
					</div>
				`;
			}
		}
	} else {
		console.error('Google Identity Services not loaded');
	}
}

// Handle Google sign-in callback
async function handleGoogleSignIn(response: any) {
	console.log('Google sign-in callback triggered');
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
		console.log('Google sign-in API response:', data);

		if (data.success) {
			// Store in localStorage
			localStorage.setItem('auth_token', data.token);
			localStorage.setItem('auth_user', JSON.stringify(data.user));
			
			console.log('Stored auth data in localStorage, updating store...');
			
			// Update store
			authStore.set({
				user: data.user,
				token: data.token,
				isLoading: false,
				error: null
			});
			
			console.log('Auth store updated successfully');
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

// Server-side JWT verification utility
export function verifyJWTToken(token: string): { userId: number; email: string } | null {
	try {
		const jwt = require('jsonwebtoken');
		const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
		
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		
		if (decoded && decoded.userId && decoded.email) {
			return {
				userId: decoded.userId,
				email: decoded.email
			};
		}
		
		return null;
	} catch (error) {
		console.error('JWT verification error:', error);
		return null;
	}
} 

// Prompt data storage utilities for non-authenticated users
export function savePromptData(data: {prompt: string, audience?: string, depth?: string}): void {
	if (typeof window !== 'undefined') {
		try {
			const promptData = {
				...data,
				timestamp: Date.now()
			};
			localStorage.setItem('pending_course_prompt', JSON.stringify(promptData));
		} catch (error) {
			console.error('Failed to save prompt data:', error);
		}
	}
}

export function getPromptData(): {prompt: string, audience?: string, depth?: string} | null {
	if (typeof window !== 'undefined') {
		try {
			const stored = localStorage.getItem('pending_course_prompt');
			if (stored) {
				const data = JSON.parse(stored);
				// Check if data is not too old (24 hours)
				if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
					return data;
				} else {
					// Data is too old, clear it
					clearPromptData();
				}
			}
		} catch (error) {
			console.error('Failed to get prompt data:', error);
			clearPromptData();
		}
	}
	return null;
}

export function clearPromptData(): void {
	if (typeof window !== 'undefined') {
		try {
			localStorage.removeItem('pending_course_prompt');
		} catch (error) {
			console.error('Failed to clear prompt data:', error);
		}
	}
}

// Course creation state management
export function setCourseCreationInProgress(): void {
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem('course_creation_in_progress', 'true');
		} catch (error) {
			console.error('Failed to set course creation in progress:', error);
		}
	}
}

export function isCourseCreationInProgress(): boolean {
	if (typeof window !== 'undefined') {
		try {
			return localStorage.getItem('course_creation_in_progress') === 'true';
		} catch (error) {
			console.error('Failed to check course creation status:', error);
			return false;
		}
	}
	return false;
}

export function clearCourseCreationInProgress(): void {
	if (typeof window !== 'undefined') {
		try {
			localStorage.removeItem('course_creation_in_progress');
		} catch (error) {
			console.error('Failed to clear course creation status:', error);
		}
	}
} 