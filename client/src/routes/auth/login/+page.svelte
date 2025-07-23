<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, initializeGoogleIdentity, initAuth } from '$lib/auth';
	import type { User } from '$lib/types';

	let isLoading = false;
	let error: string | null = null;

	onMount(() => {
		// Initialize auth from localStorage
		initAuth();
		
		// Check if already authenticated
		authStore.subscribe(state => {
			if (state.user && state.token) {
				goto('/home');
			}
		});

		// Initialize Google Identity Services with timeout
		let attempts = 0;
		const maxAttempts = 50; // 5 seconds max
		
		const timer = setInterval(() => {
			attempts++;
			
			if (typeof window !== 'undefined' && (window as any).google) {
				try {
					initializeGoogleIdentity();
					clearInterval(timer);
				} catch (error) {
					console.error('Failed to initialize Google Identity:', error);
					if (attempts >= maxAttempts) {
						clearInterval(timer);
						showGoogleError();
					}
				}
			} else if (attempts >= maxAttempts) {
				clearInterval(timer);
				showGoogleError();
			}
		}, 100);

		// Cleanup
		return () => clearInterval(timer);
	});

	function showGoogleError() {
		const buttonContainer = document.getElementById('google-signin-button');
		if (buttonContainer) {
			buttonContainer.innerHTML = `
				<div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; background: #f9fafb;">
					<p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
						Google Sign-In is temporarily unavailable
					</p>
					<button 
						onclick="window.location.reload()" 
						style="background: #0066ff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
						Try Again
					</button>
				</div>
			`;
		}
	}

	// Subscribe to auth store for loading and error states
	authStore.subscribe(state => {
		isLoading = state.isLoading;
		error = state.error;
	});
</script>

<svelte:head>
	<title>Login - Personal Tutor AI</title>
	<meta name="description" content="Sign in to your Personal Tutor AI account" />
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<div class="auth-header">
			<h1>Welcome Back</h1>
			<p>Sign in to continue your learning journey</p>
		</div>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		<div class="auth-content">
			<div class="google-signin-section">
				<div id="google-signin-button"></div>
				<p class="signin-note">
					Sign in with your Google account to get started
				</p>
			</div>

			{#if isLoading}
				<div class="loading-overlay">
					<div class="spinner"></div>
					<p>Signing you in...</p>
				</div>
			{/if}
		</div>

		<div class="auth-footer">
			<p>
				Don't have an account? 
				<a href="/auth/register" class="link">Sign up</a>
			</p>
		</div>
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-secondary-50) 100%);
	}

	.auth-card {
		background: white;
		border-radius: var(--border-radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 2.5rem;
		width: 100%;
		max-width: 400px;
		position: relative;
	}

	/* Using consolidated auth header styles from design-system.css */

	.error-message {
		background: var(--color-error-50);
		color: var(--color-error-700);
		padding: 0.75rem 1rem;
		border-radius: var(--border-radius-md);
		margin-bottom: 1.5rem;
		font-size: var(--text-sm);
		border: 1px solid var(--color-error-200);
	}

	.auth-content {
		position: relative;
	}

	.google-signin-section {
		text-align: center;
	}

	#google-signin-button {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.signin-note {
		color: var(--color-gray-500);
		font-size: var(--text-sm);
		margin: 0;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: var(--border-radius-lg);
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--color-gray-200);
		border-top: 2px solid var(--color-primary-600);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 0.5rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.auth-footer {
		text-align: center;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-gray-200);
	}

	.auth-footer p {
		color: var(--color-gray-600);
		font-size: var(--text-sm);
		margin: 0;
	}

	.link {
		color: var(--color-primary-600);
		text-decoration: none;
		font-weight: var(--font-weight-medium);
	}

	.link:hover {
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.auth-card {
			padding: 2rem 1.5rem;
		}
	}
</style> 