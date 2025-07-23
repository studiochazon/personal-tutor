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
	<header class="hero-header">
		<div class="hero-header-content">
			<h1 class="hero-title">All Courses</h1>
			<p class="hero-subtitle">
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
						<div class="course-thumbnail">
							<img 
								src={course.thumbnail_url || '/images/default-course-thumbnail.svg'} 
								alt="{course.title} thumbnail"
								class="thumbnail-image"
								on:error={(e) => {
									const target = e.target as HTMLImageElement;
									if (target) {
										target.src = '/images/default-course-thumbnail.svg';
									}
								}}
							/>
							<div class="difficulty-badge {getDifficultyColor(course.difficulty)}">
								{course.difficulty}
							</div>
						</div>
						<div class="course-content">
							<div class="course-header">
								<h3 class="course-title">{course.title}</h3>
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

	/* Using consolidated hero header styles from design-system.css */

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
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-base);
		border: 1px solid var(--color-gray-200);
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
	}

	.course-card:hover {
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	/* Course Thumbnail */
	.course-thumbnail {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: linear-gradient(135deg, var(--color-gray-100) 0%, var(--color-gray-200) 100%);
	}

	.thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.course-card:hover .thumbnail-image {
		transform: scale(1.05);
	}

	.difficulty-badge {
		position: absolute;
		top: var(--spacing-3);
		right: var(--spacing-3);
		padding: var(--spacing-1) var(--spacing-3);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
		white-space: nowrap;
		backdrop-filter: blur(8px);
		background-color: rgba(255, 255, 255, 0.9);
		box-shadow: var(--shadow-sm);
	}

	/* Course Content */
	.course-content {
		padding: var(--spacing-5);
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.course-header {
		margin-bottom: var(--spacing-3);
	}

	.course-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-gray-800);
		line-height: 1.3;
		margin: 0;
	}

	.course-description {
		color: var(--color-gray-500);
		line-height: 1.5;
		margin-bottom: var(--spacing-4);
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
		color: var(--color-gray-400);
	}

	/* Difficulty Badges */
	.difficulty-beginner {
		background-color: var(--color-success-light);
		color: var(--color-success-text);
	}

	.difficulty-intermediate {
		background-color: var(--color-warning-light);
		color: var(--color-warning-text);
	}

	.difficulty-advanced {
		background-color: var(--color-error-light);
		color: var(--color-error-text);
	}

	.difficulty-default {
		background-color: var(--color-gray-100);
		color: var(--color-gray-700);
	}

	/* Buttons */

	.btn-secondary {
		background-color: white;
		color: var(--color-primary);
		padding: var(--spacing-3) var(--spacing-6);
		border-radius: var(--radius-lg);
		font-weight: 600;
		border: 2px solid var(--color-primary);
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.btn-secondary:hover {
		background-color: var(--color-primary);
		color: white;
	}

	/* Results Count */
	.results-count {
		text-align: center;
		color: var(--color-gray-500);
		font-size: 0.875rem;
		margin-top: var(--spacing-8);
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