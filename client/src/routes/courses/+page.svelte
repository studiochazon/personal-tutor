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
				return 'bg-green-100 text-green-800';
			case 'intermediate':
				return 'bg-yellow-100 text-yellow-800';
			case 'advanced':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
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

<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
	<!-- Header -->
	<div class="text-center py-12" style="text-align: center; padding: 3rem 0;">
		<h1 class="text-4xl font-bold text-gray-800 mb-4" style="font-size: 2.25rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">
			All Courses
		</h1>
		<p class="text-xl text-gray-600 max-w-3xl mx-auto" style="font-size: 1.25rem; color: #4b5563; max-width: 48rem; margin-left: auto; margin-right: auto;">
			Explore our comprehensive collection of courses designed to help you master new skills and advance your career.
		</p>
	</div>
	
	<!-- Search and Filter -->
	<div class="mb-8" style="margin-bottom: 2rem;">
		<div class="flex gap-4 flex-wrap" style="display: flex; gap: 1rem; flex-wrap: wrap;">
			<div class="flex-1 min-w-64" style="flex: 1; min-width: 16rem;">
				<input
					type="text"
					placeholder="Search courses..."
					bind:value={searchTerm}
					on:input={handleSearch}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					style="width: 100%; padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; outline: none;"
				/>
			</div>
			<select
				bind:value={selectedDifficulty}
				on:change={handleDifficultyChange}
				class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; outline: none;"
			>
				<option value="">All Difficulties</option>
				{#each difficulties as difficulty}
					<option value={difficulty}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</option>
				{/each}
			</select>
		</div>
	</div>
	
	<!-- Loading State -->
	{#if loading}
		<div class="text-center py-12" style="text-align: center; padding: 3rem 0;">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" style="display: inline-block; animation: spin 1s linear infinite; border-radius: 50%; height: 2rem; width: 2rem; border-bottom: 2px solid #2563eb;"></div>
			<p class="mt-4 text-gray-600" style="margin-top: 1rem; color: #4b5563;">Loading courses...</p>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="text-center py-12" style="text-align: center; padding: 3rem 0;">
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" style="background: #fee2e2; border: 1px solid #f87171; color: #dc2626; padding: 0.75rem 1rem; border-radius: 0.25rem;">
				<strong class="font-bold" style="font-weight: 700;">Error:</strong>
				<span class="block sm:inline" style="display: block;">{error}</span>
			</div>
			<button
				on:click={loadCourses}
				class="mt-4 btn btn-primary"
				style="margin-top: 1rem; display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;"
			>
				Try Again
			</button>
		</div>
	{:else if courses.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12" style="text-align: center; padding: 3rem 0;">
			<div class="text-gray-400 text-6xl mb-4" style="color: #9ca3af; font-size: 3.75rem; margin-bottom: 1rem;">📚</div>
			<h3 class="text-xl font-semibold text-gray-800 mb-2" style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">
				No courses found
			</h3>
			<p class="text-gray-600" style="color: #4b5563;">
				Try adjusting your search criteria or check back later for new courses.
			</p>
		</div>
	{:else}
		<!-- Courses Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style="display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 2rem;">
			{#each courses as course}
				<div class="card hover:shadow-xl transition-shadow" style="background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
					<div class="flex justify-between items-start mb-4" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
						<h3 class="text-xl font-semibold text-gray-800" style="font-size: 1.25rem; font-weight: 600; color: #1f2937;">
							{course.title}
						</h3>
						<span class="px-2 py-1 rounded-full text-xs font-medium {getDifficultyColor(course.difficulty)}" style="padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;">
							{course.difficulty}
						</span>
					</div>
					<p class="text-gray-600 mb-4" style="color: #4b5563; margin-bottom: 1rem;">
						{course.description}
					</p>
					<div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
						<span class="text-sm text-gray-500" style="font-size: 0.875rem; color: #6b7280;">
							⏱️ {formatDuration(course.estimated_duration)}
						</span>
						<a href="/courses/{course.id}" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
							View Course
						</a>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Results Count -->
		<div class="text-center mt-8 text-gray-600" style="text-align: center; margin-top: 2rem; color: #4b5563;">
			Found {courses.length} course{courses.length !== 1 ? 's' : ''}
		</div>
	{/if}
</div>

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	@media (min-width: 768px) {
		.md\:grid-cols-2 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	
	@media (min-width: 1024px) {
		.lg\:grid-cols-3 {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style> 