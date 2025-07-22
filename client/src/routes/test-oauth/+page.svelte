<script lang="ts">
	import { onMount } from 'svelte';
	import { GOOGLE_CLIENT_ID } from '$lib/config';

	let googleLoaded = false;
	let error = '';

	onMount(() => {
		// Check if Google Identity Services is loaded
		const checkGoogle = setInterval(() => {
			if (typeof window !== 'undefined' && (window as any).google) {
				googleLoaded = true;
				clearInterval(checkGoogle);
				
				// Initialize Google Identity Services
				try {
					(window as any).google.accounts.id.initialize({
						client_id: GOOGLE_CLIENT_ID,
						callback: handleCredentialResponse
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
				} catch (err) {
					error = `Google initialization error: ${err}`;
				}
			}
		}, 100);

		return () => clearInterval(checkGoogle);
	});

	function handleCredentialResponse(response: any) {
		console.log('Google response:', response);
		
		// Test the API endpoint
		fetch('/api/auth/google', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ credential: response.credential })
		})
		.then(res => res.json())
		.then(data => {
			console.log('API response:', data);
			if (data.success) {
				alert('Authentication successful!');
			} else {
				alert(`Authentication failed: ${data.error}`);
			}
		})
		.catch(err => {
			console.error('API error:', err);
			alert(`API error: ${err.message}`);
		});
	}
</script>

<svelte:head>
	<title>Google OAuth Test - Personal Tutor AI</title>
</svelte:head>

<div class="test-container">
	<h1>Google OAuth Test Page</h1>
	
	<div class="status-section">
		<h2>Status</h2>
		<p><strong>Google Client ID:</strong> {GOOGLE_CLIENT_ID}</p>
		<p><strong>Google Loaded:</strong> {googleLoaded ? '✅ Yes' : '❌ No'}</p>
		<p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Unknown'}</p>
	</div>

	{#if error}
		<div class="error-section">
			<h2>Error</h2>
			<p class="error">{error}</p>
		</div>
	{/if}

	<div class="test-section">
		<h2>Test Google Sign-In</h2>
		<div id="google-signin-button"></div>
		<p class="note">Click the button above to test Google authentication</p>
	</div>

	<div class="debug-section">
		<h2>Debug Information</h2>
		<p>Check the browser console for detailed logs</p>
		<button on:click={() => console.log('Test button clicked')}>
			Test Console Log
		</button>
	</div>
</div>

<style>
	.test-container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		background: white;
		border-radius: var(--border-radius-lg);
		box-shadow: var(--shadow-md);
	}

	h1 {
		text-align: center;
		color: var(--color-gray-900);
		margin-bottom: 2rem;
	}

	h2 {
		color: var(--color-gray-800);
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-gray-200);
		padding-bottom: 0.5rem;
	}

	.status-section, .error-section, .test-section, .debug-section {
		margin-bottom: 2rem;
		padding: 1rem;
		background: var(--color-gray-50);
		border-radius: var(--border-radius-md);
	}

	.error {
		color: var(--color-error-700);
		background: var(--color-error-50);
		padding: 0.75rem;
		border-radius: var(--border-radius-sm);
		border: 1px solid var(--color-error-200);
	}

	.note {
		color: var(--color-gray-600);
		font-size: var(--text-sm);
		margin-top: 1rem;
	}

	#google-signin-button {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
	}

	button {
		background: var(--color-primary-600);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: var(--border-radius-md);
		cursor: pointer;
		font-size: var(--text-sm);
	}

	button:hover {
		background: var(--color-primary-700);
	}
</style> 