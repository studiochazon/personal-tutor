<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, initAuth, logout } from '$lib/auth';
	import type { User } from '$lib/types';

	let user: User | null = null;
	let isLoading = true;

	onMount(() => {
		initAuth();
		
		authStore.subscribe(state => {
			user = state.user;
			isLoading = state.isLoading;
			
			// Redirect if not authenticated
			if (!state.user && !state.isLoading) {
				goto('/auth/login');
			}
		});
	});

	function handleLogout() {
		logout();
		goto('/');
	}
</script>

<svelte:head>
	<title>Profile - Personal Tutor AI</title>
	<meta name="description" content="Your Personal Tutor AI profile" />
</svelte:head>

{#if isLoading}
	<div class="loading-container">
		<div class="spinner"></div>
		<p>Loading profile...</p>
	</div>
{:else if user}
	<div class="profile-container">
		<div class="container">
			<div class="profile-header">
				<h1>Your Profile</h1>
				<p>Manage your account settings and preferences</p>
			</div>

			<div class="profile-content">
				<div class="profile-card">
					<div class="profile-avatar-section">
						{#if user.avatar_url}
							<img src={user.avatar_url} alt={user.name} class="profile-avatar" />
						{:else}
							<div class="profile-avatar-placeholder">
								{user.name.charAt(0).toUpperCase()}
							</div>
						{/if}
						<div class="profile-info">
							<h2>{user.name}</h2>
							<p class="email">{user.email}</p>
							{#if user.email_verified}
								<span class="verified-badge">✓ Email Verified</span>
							{/if}
						</div>
					</div>

					<div class="profile-details">
						<div class="detail-group">
							<label>Full Name</label>
							<p>{user.given_name} {user.family_name}</p>
						</div>

						<div class="detail-group">
							<label>Email Address</label>
							<p>{user.email}</p>
						</div>

						<div class="detail-group">
							<label>Account Type</label>
							<p>Google Account</p>
						</div>

						<div class="detail-group">
							<label>Member Since</label>
							<p>{new Date(user.created_at).toLocaleDateString()}</p>
						</div>

						{#if user.last_login}
							<div class="detail-group">
								<label>Last Login</label>
								<p>{new Date(user.last_login).toLocaleString()}</p>
							</div>
						{/if}
					</div>

					<div class="profile-actions">
						<button class="btn btn-secondary" on:click={handleLogout}>
							Sign Out
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.loading-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid var(--color-gray-200);
		border-top: 3px solid var(--color-primary-600);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.profile-container {
		padding: 2rem 0;
		background: var(--color-gray-50);
		min-height: calc(100vh - 200px);
	}

	.profile-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.profile-header h1 {
		font-size: var(--text-3xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-gray-900);
		margin-bottom: 0.5rem;
	}

	.profile-header p {
		color: var(--color-gray-600);
		font-size: var(--text-lg);
	}

	.profile-content {
		max-width: 600px;
		margin: 0 auto;
	}

	.profile-card {
		background: white;
		border-radius: var(--border-radius-lg);
		box-shadow: var(--shadow-md);
		padding: 2rem;
	}

	.profile-avatar-section {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-gray-200);
	}

	.profile-avatar {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.profile-avatar-placeholder {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: var(--color-primary-600);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--font-weight-bold);
		font-size: var(--text-xl);
	}

	.profile-info h2 {
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-gray-900);
		margin-bottom: 0.25rem;
	}

	.profile-info .email {
		color: var(--color-gray-600);
		font-size: var(--text-sm);
		margin-bottom: 0.5rem;
	}

	.verified-badge {
		display: inline-block;
		background: var(--color-success-50);
		color: var(--color-success-700);
		padding: 0.25rem 0.5rem;
		border-radius: var(--border-radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--font-weight-medium);
	}

	.profile-details {
		margin-bottom: 2rem;
	}

	.detail-group {
		margin-bottom: 1.5rem;
	}

	.detail-group:last-child {
		margin-bottom: 0;
	}

	.detail-group label {
		display: block;
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-gray-700);
		margin-bottom: 0.5rem;
	}

	.detail-group p {
		font-size: var(--text-base);
		color: var(--color-gray-900);
		margin: 0;
		padding: 0.75rem;
		background: var(--color-gray-50);
		border-radius: var(--border-radius-md);
		border: 1px solid var(--color-gray-200);
	}

	.profile-actions {
		text-align: center;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-gray-200);
	}

	@media (max-width: 640px) {
		.profile-container {
			padding: 1rem 0;
		}

		.profile-card {
			padding: 1.5rem;
		}

		.profile-avatar-section {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}
	}
</style> 