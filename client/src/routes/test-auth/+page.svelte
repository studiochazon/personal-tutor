<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, initAuth, isAuthenticated } from '$lib/auth';

	let authState: any = null;
	let isAuth = false;
	let currentUser: any = null;

	onMount(() => {
		// Initialize auth
		const hasAuth = initAuth();
		console.log('Test page: initAuth returned:', hasAuth);
		
		// Subscribe to auth store
		const unsubscribe = authStore.subscribe(state => {
			authState = state;
			isAuth = isAuthenticated();
			currentUser = state.user;
			console.log('Test page: Auth state updated:', {
				storeState: state,
				isAuthenticated: isAuth,
				currentUser: currentUser
			});
		});

		return unsubscribe;
	});

	function checkLocalStorage() {
		const token = localStorage.getItem('auth_token');
		const userStr = localStorage.getItem('auth_user');
		console.log('LocalStorage check:', { token: !!token, userStr: !!userStr });
		if (userStr) {
			try {
				const user = JSON.parse(userStr);
				console.log('Parsed user from localStorage:', user);
			} catch (e) {
				console.error('Failed to parse user from localStorage:', e);
			}
		}
	}
</script>

<svelte:head>
	<title>Auth Test - Personal Tutor AI</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold mb-4">Authentication Test Page</h1>
	
	<div class="space-y-4">
		<div class="card p-4">
			<h2 class="text-lg font-semibold mb-2">Auth Store State</h2>
			<pre class="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(authState, null, 2)}</pre>
		</div>
		
		<div class="card p-4">
			<h2 class="text-lg font-semibold mb-2">Authentication Status</h2>
			<p><strong>isAuthenticated():</strong> {isAuth ? 'true' : 'false'}</p>
			<p><strong>Current User:</strong> {currentUser ? currentUser.name : 'null'}</p>
		</div>
		
		<div class="card p-4">
			<h2 class="text-lg font-semibold mb-2">Actions</h2>
			<button on:click={checkLocalStorage} class="btn btn-primary">
				Check localStorage
			</button>
		</div>
		
		<div class="card p-4">
			<h2 class="text-lg font-semibold mb-2">Navigation</h2>
			<a href="/home" class="btn btn-secondary mr-2">Go to Home</a>
			<a href="/courses" class="btn btn-secondary mr-2">Go to Courses</a>
			<a href="/auth/login" class="btn btn-secondary">Go to Login</a>
		</div>
	</div>
</div>

<style>
	.card {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	/* Button styles are now imported from the consolidated buttons.css */
</style> 