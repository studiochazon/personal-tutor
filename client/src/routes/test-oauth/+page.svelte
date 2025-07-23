<script lang="ts">
	import { onMount } from 'svelte';
	import { GOOGLE_CLIENT_ID } from '$lib/config';

	let currentDomain = '';
	let googleLoaded = false;
	let googleError = '';

	onMount(() => {
		// Get current domain
		currentDomain = window.location.origin;
		
		// Check if Google is loaded
		const checkGoogle = () => {
			if (typeof window !== 'undefined' && (window as any).google) {
				googleLoaded = true;
			} else {
				setTimeout(checkGoogle, 100);
			}
		};
		checkGoogle();
	});

	function testGoogleOAuth() {
		if (typeof window !== 'undefined' && (window as any).google) {
			try {
				(window as any).google.accounts.id.initialize({
					client_id: GOOGLE_CLIENT_ID,
					callback: (response: any) => {
						console.log('Google OAuth test successful:', response);
						alert('Google OAuth is working! Check console for details.');
					}
				});
				alert('Google OAuth initialized successfully');
			} catch (error) {
				console.error('Google OAuth test failed:', error);
				googleError = error instanceof Error ? error.message : 'Unknown error';
			}
		} else {
			alert('Google Identity Services not loaded');
		}
	}
</script>

<svelte:head>
	<title>OAuth Test - Personal Tutor AI</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold mb-4">Google OAuth Test Page</h1>
	
	<div class="space-y-4">
		<div class="card p-4">
			<h2 class="text-lg font-semibold mb-2">Current Configuration</h2>
			<p><strong>Domain:</strong> {currentDomain}</p>
			<p><strong>Google Client ID:</strong> {GOOGLE_CLIENT_ID}</p>
			<p><strong>Google Loaded:</strong> {googleLoaded ? 'Yes' : 'No'}</p>
		</div>
		
		<div class="card p-4">
			<h2 class="text-lg font-semibold mb-2">Test Actions</h2>
			<button on:click={testGoogleOAuth} class="btn btn-primary mb-2">
				Test Google OAuth
			</button>
			<button on:click={() => window.location.reload()} class="btn btn-secondary">
				Reload Page
			</button>
		</div>
		
		{#if googleError}
			<div class="card p-4 bg-red-50 border border-red-200">
				<h2 class="text-lg font-semibold mb-2 text-red-800">Error</h2>
				<p class="text-red-700">{googleError}</p>
			</div>
		{/if}
		
		<div class="card p-4">
			<h2 class="text-lg font-semibold mb-2">Troubleshooting</h2>
			<ul class="list-disc list-inside space-y-1 text-sm">
				<li>Make sure the domain is added to Google OAuth console</li>
				<li>Check that the client ID is correct</li>
				<li>Ensure Google Identity Services script is loaded</li>
				<li>Check browser console for detailed errors</li>
			</ul>
		</div>
		
		<div class="card p-4">
			<h2 class="text-lg font-semibold mb-2">Navigation</h2>
			<a href="/auth/login" class="btn btn-secondary mr-2">Go to Login</a>
			<a href="/test-auth" class="btn btn-secondary">Go to Auth Test</a>
		</div>
	</div>
</div>

<style>
	.card {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		text-decoration: none;
		font-weight: 500;
		border: none;
		cursor: pointer;
	}
	
	.btn-primary {
		background: #0066ff;
		color: white;
	}
	
	.btn-secondary {
		background: #6b7280;
		color: white;
	}
</style> 