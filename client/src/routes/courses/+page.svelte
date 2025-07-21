<script lang="ts">
	import { onMount } from 'svelte';
	import type { Course } from '$lib/types';
	
	let courses: Course[] = [];
	let loading = true;
	let error: string | null = null;
	let searchTerm = '';
	let selectedDifficulty = '';
	let difficulties = ['beginner', 'intermediate', 'advanced'];
	
	async function loadCourses() {
		try {
			loading = true;
			error = null;
			
			const params = new URLSearchParams();
			if (searchTerm) params.append('search', searchTerm);
			if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
			
			const response = await fetch(`/api/courses?${params.toString()}`);
			const data = await response.json();
			
			if (response.ok) {
				courses = data.courses;
			} else {
				error = data.error || 'Failed to load courses';
			}
		} catch (err) {
			error = 'Failed to load courses';
			console.error('Error loading courses:', err);
		} finally {
			loading = false;
		}
	}
	
	function getDifficultyColor(difficulty: string): string {
		switch (difficulty) {
			case 'beginner':
				return 'difficulty-beginner';
			case 'intermediate':
				return 'difficulty-intermediate';
			case 'advanced':
				return 'difficulty-advanced';
			default:
				return 'difficulty-default';
		}
	}
	
	function formatDuration(minutes: number | null): string {
		if (!minutes) return 'Self-paced';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}
	
	function handleSearch() {
		loadCourses();
	}
	
	function handleDifficultyChange() {
		loadCourses();
	}
	
	onMount(() => {
		loadCourses();
	});
</script>

<svelte:head>
	<title>All Courses - Personal Tutor AI</title>
	<meta name="description" content="Browse all available courses on Personal Tutor AI" />
</svelte:head>

<div class="page-container">
	<!-- Header Section -->
	<header class="page-header">
		<div class="header-content">
			<h1 class="page-title">All Courses</h1>
			<p class="page-subtitle">
				Explore our comprehensive collection of courses designed to help you master new skills and advance your career.
			</p>
		</div>
	</header>
	
	<!-- Search and Filter Section -->
	<section class="filters-section">
		<div class="filters-container">
			<div class="search-container">
				<input
					type="text"
					placeholder="Search courses..."
					bind:value={searchTerm}
					on:input={handleSearch}
					class="search-input"
				/>
			</div>
			<select
				bind:value={selectedDifficulty}
				on:change={handleDifficultyChange}
				class="difficulty-select"
			>
				<option value="">All Difficulties</option>
				{#each difficulties as difficulty}
					<option value={difficulty}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</option>
				{/each}
			</select>
		</div>
	</section>
	
	<!-- Content Section -->
	<main class="content-section">
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p class="loading-text">Loading courses...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<div class="error-message">
					<strong>Error:</strong>
					<span>{error}</span>
				</div>
				<button on:click={loadCourses} class="btn-primary">
					Try Again
				</button>
			</div>
		{:else if courses.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📚</div>
				<h3 class="empty-title">No courses found</h3>
				<p class="empty-description">
					Try adjusting your search criteria or check back later for new courses.
				</p>
			</div>
		{:else}
			<div class="courses-grid">
				{#each courses as course}
					<article class="course-card">
						<div class="course-header">
							<h3 class="course-title">{course.title}</h3>
							<span class="difficulty-badge {getDifficultyColor(course.difficulty)}">
								{course.difficulty}
							</span>
						</div>
						<p class="course-description">
							{course.description ? (course.description.length > 120 ? course.description.substring(0, 120) + '...' : course.description) : 'No description available'}
						</p>
						<div class="course-footer">
							<span class="course-duration">
								⏱️ {formatDuration(course.estimated_duration)}
							</span>
							<a href="/courses/{course.id}" class="btn-secondary">
								View Course
							</a>
						</div>
					</article>
				{/each}
			</div>
			
			<div class="results-count">
				Found {courses.length} course{courses.length !== 1 ? 's' : ''}
			</div>
		{/if}
	</main>
</div>

<style>
	/* Page Layout */
	.page-container {
		min-height: 100vh;
		background-color: var(--color-gray-50);
	}

	/* Header Section */
	.page-header {
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
		padding: var(--spacing-16) 0;
		color: white;
		text-align: center;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.page-title {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 1rem;
		line-height: 1.2;
	}

	.page-subtitle {
		font-size: 1.25rem;
		opacity: 0.9;
		max-width: 48rem;
		margin: 0 auto;
		line-height: 1.6;
	}

	/* Filters Section */
	.filters-section {
		background-color: white;
		border-bottom: 1px solid var(--color-gray-200);
		padding: var(--spacing-8) 0;
	}

	.filters-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--spacing-4);
		display: flex;
		gap: var(--spacing-4);
		flex-wrap: wrap;
		align-items: center;
	}

	.search-container {
		flex: 1;
		min-width: 16rem;
	}

	.search-input {
		width: 100%;
		padding: var(--spacing-3) var(--spacing-4);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		transition: all 0.2s ease;
		background-color: white;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.difficulty-select {
		padding: var(--spacing-3) var(--spacing-4);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		background-color: white;
		transition: all 0.2s ease;
		min-width: 12rem;
	}

	.difficulty-select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	/* Content Section */
	.content-section {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 1rem;
	}

	/* Loading State */
	.loading-state {
		text-align: center;
		padding: 4rem 0;
	}

	.loading-spinner {
		display: inline-block;
		width: 2rem;
		height: 2rem;
		border: 2px solid #E5E7EB;
		border-top: 2px solid #0066FF;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.loading-text {
		color: #6B7280;
		font-size: 1rem;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Error State */
	.error-state {
		text-align: center;
		padding: 4rem 0;
	}

	.error-message {
		background-color: #FEF2F2;
		border: 1px solid #FECACA;
		color: #DC2626;
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		display: inline-block;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 0;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1F2937;
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: #6B7280;
		font-size: 1rem;
	}

	/* Courses Grid */
	.courses-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 2rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 768px) {
		.courses-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.courses-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Course Card */
	.course-card {
		background-color: white;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		border: 1px solid #E5E7EB;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
	}

	.course-card:hover {
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		transform: translateY(-2px);
	}

	.course-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
		gap: 1rem;
	}

	.course-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1F2937;
		line-height: 1.3;
		flex: 1;
	}

	.course-description {
		color: #6B7280;
		line-height: 1.5;
		margin-bottom: 1rem;
		flex: 1;
		font-size: 0.875rem;
	}

	.course-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}

	.course-duration {
		font-size: 0.875rem;
		color: #9CA3AF;
	}

	/* Difficulty Badges */
	.difficulty-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
		white-space: nowrap;
	}

	.difficulty-beginner {
		background-color: #D1FAE5;
		color: #065F46;
	}

	.difficulty-intermediate {
		background-color: #FEF3C7;
		color: #92400E;
	}

	.difficulty-advanced {
		background-color: #FEE2E2;
		color: #991B1B;
	}

	.difficulty-default {
		background-color: #F3F4F6;
		color: #374151;
	}

	/* Buttons */
	.btn-primary {
		background-color: #0066FF;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		border: none;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.btn-primary:hover {
		background-color: #0052CC;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
	}

	.btn-secondary {
		background-color: white;
		color: #0066FF;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		border: 2px solid #0066FF;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.btn-secondary:hover {
		background-color: #0066FF;
		color: white;
	}

	/* Results Count */
	.results-count {
		text-align: center;
		color: #6B7280;
		font-size: 0.875rem;
		margin-top: 2rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.page-title {
			font-size: 2.25rem;
		}

		.page-subtitle {
			font-size: 1.125rem;
		}

		.filters-container {
			flex-direction: column;
			align-items: stretch;
		}

		.search-container {
			min-width: auto;
		}

		.difficulty-select {
			min-width: auto;
		}

		.course-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.course-footer {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.btn-secondary {
			text-align: center;
		}
	}
</style> 