<script lang="ts">
	import '../minimal.css';
	import '../styles/design-system.css';
	import '../styles/buttons.scss';
	import { onMount } from 'svelte';
	import { authStore, initAuth, logout } from '$lib/auth';
	import { goto } from '$app/navigation';

	let user: any = null;
	let isLoading = true;
	let isInitialized = false;
	let showLoginButton = false;

	onMount(() => {
		// Initialize auth from localStorage
		const hasAuth = initAuth();
		
		// Subscribe to auth store changes
		const unsubscribe = authStore.subscribe(state => {
			// Update local variables
			user = state.user;
			isLoading = state.isLoading;
			
			// Mark as initialized after first subscription
			if (!isInitialized) {
				isInitialized = true;
			}
			
			// Show login button only when we're sure user is not authenticated
			showLoginButton = !state.user && !state.token && !state.isLoading && isInitialized;
		});

		// Cleanup subscription on component destroy
		return unsubscribe;
	});

	function handleLogout() {
		logout();
		goto('/');
	}
</script>

<header class="header">
	<div class="container">
		<nav class="nav">
			<a href="/" class="nav-brand">
				<!-- <span class="brand-icon">🎓</span> -->
				<span class="brand-text">NovotioAI</span>
			</a>
			<ul class="nav-links">
				<li><a href="/home" class="nav-link">Home</a></li>
				<li><a href="/courses" class="nav-link">Courses</a></li>
				<li><a href="/course-creator" class="nav-link">Course Creator</a></li>
				{#if user}
					<!-- <li><a href="/home" class="nav-link">Create Course</a></li> -->
					<li class="nav-user">
						<div class="user-menu">
							<button class="user-button" aria-label="User menu">
								{#if user.avatar_url}
									<img src={user.avatar_url} alt={user.name} class="user-avatar" />
								{:else}
									<div class="user-avatar-placeholder">
										{user.name.charAt(0).toUpperCase()}
									</div>
								{/if}
								<span class="user-name">{user.name}</span>
								<svg class="chevron-down" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6,9 12,15 18,9"></polyline>
								</svg>
							</button>
							<div class="user-dropdown">
								<a href="/profile" class="dropdown-item">Profile</a>
								<button on:click={handleLogout} class="dropdown-item">Logout</button>
							</div>
						</div>
					</li>
				{:else if showLoginButton}
					<li><a href="/auth/login" class="nav-link">Login</a></li>
					<li><a href="/auth/register" class="nav-link nav-link-primary">Sign Up</a></li>
				{/if}
			</ul>
			<button class="nav-toggle" aria-label="Toggle navigation">
				<span></span>
				<span></span>
				<span></span>
			</button>
		</nav>
	</div>
</header>

<main>
	<slot />
</main>

<footer class="footer">
	<div class="container">
		<div class="footer-content">
			<div class="footer-brand">
				<span class="brand-icon">🎓</span>
				<span class="brand-text">Personal Tutor AI</span>
			</div>
			<div class="footer-links">
				<div class="footer-section">
					<h4>Product</h4>
					<ul>
						<li><a href="/courses">Browse Courses</a></li>
						<li><a href="/home">Create Course</a></li>
						<li><a href="/auth/register">Sign Up</a></li>
					</ul>
				</div>
				<div class="footer-section">
					<h4>Support</h4>
					<ul>
						<li><a href="/help">Help Center</a></li>
						<li><a href="/contact">Contact Us</a></li>
						<li><a href="/docs">Documentation</a></li>
					</ul>
				</div>
				<div class="footer-section">
					<h4>Company</h4>
					<ul>
						<li><a href="/about">About</a></li>
						<li><a href="/privacy">Privacy</a></li>
						<li><a href="/terms">Terms</a></li>
					</ul>
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<p>&copy; 2024 Personal Tutor AI. All rights reserved.</p>
		</div>
	</div>
</footer>

<style>
	.nav-user {
		position: relative;
	}

	.user-menu {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		padding: 0.5rem;
		border-radius: var(--border-radius-md);
		cursor: pointer;
		color: var(--color-gray-700);
		transition: background-color 0.2s;
	}

	.user-button:hover {
		background-color: var(--color-gray-100);
	}

	.user-avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.user-avatar-placeholder {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-primary-600);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--font-weight-medium);
		font-size: var(--text-sm);
	}

	.user-name {
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
	}

	.chevron-down {
		color: var(--color-gray-500);
		transition: transform 0.2s;
	}

	.user-button:hover .chevron-down {
		transform: rotate(180deg);
	}

	.user-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		background: white;
		border: 1px solid var(--color-gray-200);
		border-radius: var(--border-radius-md);
		box-shadow: var(--shadow-lg);
		min-width: 150px;
		z-index: 1000;
		opacity: 0;
		visibility: hidden;
		transform: translateY(-10px);
		transition: all 0.2s;
	}

	.user-menu:hover .user-dropdown {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}

	.dropdown-item {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		text-decoration: none;
		color: var(--color-gray-700);
		font-size: var(--text-sm);
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.dropdown-item:hover {
		background-color: var(--color-gray-50);
	}

	.dropdown-item:first-child {
		border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
	}

	.dropdown-item:last-child {
		border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
	}

	@media (max-width: 768px) {
		.user-name {
			display: none;
		}
		
		.chevron-down {
			display: none;
		}
	}
</style> 