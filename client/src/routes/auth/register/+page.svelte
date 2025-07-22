<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, initAuth } from '$lib/auth';

	onMount(() => {
		// Initialize auth from localStorage
		initAuth();
		
		// Check if already authenticated
		authStore.subscribe(state => {
			if (state.user && state.token) {
				goto('/home');
			}
		});

		// Redirect to login page since Google handles registration
		goto('/auth/login');
	});
</script>

<svelte:head>
	<title>Sign Up - Personal Tutor AI</title>
	<meta name="description" content="Create your Personal Tutor AI account" />
</svelte:head>

<div class="redirect-container">
	<div class="redirect-card">
		<div class="redirect-content">
			<div class="spinner"></div>
			<h2>Redirecting to Sign In...</h2>
			<p>You'll be redirected to the sign-in page where you can create your account with Google.</p>
		</div>
	</div>
</div>

<style>
	.redirect-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-secondary-50) 100%);
	}

	.redirect-card {
		background: white;
		border-radius: var(--border-radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 2.5rem;
		width: 100%;
		max-width: 400px;
		text-align: center;
	}

	.redirect-content h2 {
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-gray-900);
		margin: 1rem 0 0.5rem 0;
	}

	.redirect-content p {
		color: var(--color-gray-600);
		font-size: var(--text-sm);
		margin: 0;
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid var(--color-gray-200);
		border-top: 3px solid var(--color-primary-600);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem auto;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style> 