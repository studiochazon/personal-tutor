import { goto } from '$app/navigation';
import { initAuth } from './auth';

/**
 * Authentication guard for protecting pages
 * Redirects unauthenticated users to login page
 */
export function requireAuth(): Promise<boolean> {
	return new Promise((resolve) => {
		// Initialize auth from localStorage first
		const hasAuth = initAuth();
		
		// Check if we have auth data in localStorage
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('auth_token');
			const userStr = localStorage.getItem('auth_user');
			
			if (token && userStr) {
				try {
					const user = JSON.parse(userStr);
					if (user && token) {
						// Authenticated, allow access
						resolve(true);
						return;
					}
				} catch (error) {
					console.error('Failed to parse stored user:', error);
				}
			}
		}
		
		// Not authenticated, redirect to login
		goto('/auth/login');
		resolve(false);
	});
}

/**
 * Check if user is authenticated without redirecting
 * Useful for conditional rendering
 */
export function isAuthenticated(): boolean {
	// Initialize auth first
	initAuth();
	
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('auth_token');
		const userStr = localStorage.getItem('auth_user');
		
		if (token && userStr) {
			try {
				const user = JSON.parse(userStr);
				return !!(user && token);
			} catch (error) {
				console.error('Failed to parse stored user:', error);
			}
		}
	}
	
	return false;
}

/**
 * Get current user without redirecting
 * Returns null if not authenticated
 */
export function getCurrentUser(): any {
	// Initialize auth first
	initAuth();
	
	if (typeof window !== 'undefined') {
		const userStr = localStorage.getItem('auth_user');
		
		if (userStr) {
			try {
				return JSON.parse(userStr);
			} catch (error) {
				console.error('Failed to parse stored user:', error);
			}
		}
	}
	
	return null;
} 