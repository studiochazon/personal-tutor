<script lang="ts">
	import { onMount } from 'svelte';
	import { requireAuth } from '$lib/auth-guard';
	import { getAuthToken } from '$lib/auth';
	import type { Course, Enrollment } from '$lib/types';
	import { CourseCard, LoadingState, EmptyState } from '$lib/components/ui';
	
	let courses: Course[] = [];
	let enrollments: Map<number, Enrollment> = new Map();
	let courseProgress: Map<number, any> = new Map();
	let loading = true;
	let error: string | null = null;
	let searchTerm = '';
	let selectedDifficulty = '';
	let difficulties = ['beginner', 'intermediate', 'advanced'];
	let isAuthenticated = false;
	
	onMount(async () => {
		// Check authentication first
		isAuthenticated = await requireAuth();
		
		if (isAuthenticated) {
			// Only load data if authenticated
			await loadCourses();
		}
	});
	
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
				// Load enrollment data and progress for each course
				await Promise.all([
					loadEnrollments(),
					loadCourseProgress()
				]);
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
	
	async function loadEnrollments() {
		try {
			const token = getAuthToken();
			if (!token) return;
			
			// Load enrollment data for all courses
			const enrollmentPromises = courses.map(async (course) => {
				try {
					const response = await fetch(`/api/courses/${course.id}/enrollment`, {
						headers: {
							'Authorization': `Bearer ${token}`
						}
					});
					
					if (response.ok) {
						const data = await response.json();
						if (data.enrollment) {
							enrollments.set(course.id, data.enrollment);
						}
					}
				} catch (err) {
					console.error(`Error loading enrollment for course ${course.id}:`, err);
				}
			});
			
			await Promise.all(enrollmentPromises);
			enrollments = enrollments; // Trigger reactivity
		} catch (err) {
			console.error('Error loading enrollments:', err);
		}
	}
	
	async function loadCourseProgress() {
		try {
			const token = getAuthToken();
			if (!token) return;
			
			// Load progress data for all courses
			const progressPromises = courses.map(async (course) => {
				try {
					const response = await fetch(`/api/courses/${course.id}/progress`, {
						headers: {
							'Authorization': `Bearer ${token}`
						}
					});
					
					if (response.ok) {
						const data = await response.json();
						courseProgress.set(course.id, data.course_progress);
					}
				} catch (err) {
					console.error(`Error loading progress for course ${course.id}:`, err);
				}
			});
			
			await Promise.all(progressPromises);
			courseProgress = courseProgress; // Trigger reactivity
		} catch (err) {
			console.error('Error loading course progress:', err);
		}
	}
	
	function getEnrollmentStatus(courseId: number): string | null {
		const enrollment = enrollments.get(courseId);
		return enrollment ? enrollment.status : null;
	}
	
	function getCourseProgress(courseId: number): number {
		const progressData = courseProgress.get(courseId);
		if (!progressData || !progressData.lessons || progressData.lessons.length === 0) return 0;
		
		const completedLessons = progressData.progress.filter((p: any) => p.completed).length;
		return Math.round((completedLessons / progressData.lessons.length) * 100);
	}
	
	function handleSearch() {
		loadCourses();
	}
	
	function handleDifficultyChange() {
		loadCourses();
	}
</script>

<svelte:head>
	<title>All Courses - Personal Tutor AI</title>
	<meta name="description" content="Browse all available courses on Personal Tutor AI" />
</svelte:head>

{#if !isAuthenticated}
	<!-- Loading state while checking authentication -->
	<div class="page-container">
		<LoadingState message="Checking authentication..." />
	</div>
{:else}
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
				<LoadingState message="Loading courses..." />
			{:else if error}
				<div class="error-state">
					<div class="error-message">
						<strong>Error:</strong>
						<span>{error}</span>
					</div>
					<button on:click={loadCourses} class="btn btn-primary">
						Try Again
					</button>
				</div>
			{:else if courses.length === 0}
				<EmptyState 
					title="No courses found"
					description="Try adjusting your search criteria or check back later for new courses."
					icon="📚"
				/>
			{:else}
				<div class="courses-grid">
					{#each courses as course}
						<CourseCard 
							{course}
							showEnrollmentStatus={true}
							enrollmentStatus={getEnrollmentStatus(course.id)}
							showProgress={true}
							progressPercentage={getCourseProgress(course.id)}
							actionText="View Course"
							actionHref="/courses/{course.id}"
						/>
					{/each}
				</div>
				
				<div class="results-count">
					Found {courses.length} course{courses.length !== 1 ? 's' : ''}
				</div>
			{/if}
		</main>
	</div>
{/if}

<style>
	/* Page Layout */
	.page-container {
		min-height: 100vh;
		background-color: var(--color-gray-50);
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

	/* Results Count */
	.results-count {
		text-align: center;
		color: var(--color-gray-500);
		font-size: 0.875rem;
		margin-top: var(--spacing-8);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
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
	}
</style> 