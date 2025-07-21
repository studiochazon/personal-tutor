<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Course, Lesson } from '$lib/types';
	
	let course: Course | null = null;
	let lessons: Lesson[] = [];
	let loading = true;
	let error: string | null = null;
	
	$: courseId = $page.params.id;
	
	async function loadCourse() {
		try {
			loading = true;
			error = null;
			
			const response = await fetch(`/api/courses/${courseId}`);
			const data = await response.json();
			
			if (response.ok) {
				course = data.course;
				lessons = data.lessons || [];
			} else {
				error = data.error || 'Failed to load course';
			}
		} catch (err) {
			error = 'Failed to load course';
			console.error('Error loading course:', err);
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
	
	onMount(() => {
		loadCourse();
	});
</script>

<svelte:head>
	<title>{course ? course.title : 'Course'} - Personal Tutor AI</title>
	<meta name="description" content={course ? course.description : 'Course details'} />
</svelte:head>

<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
	<!-- Loading State -->
	{#if loading}
		<div class="text-center py-12" style="text-align: center; padding: 3rem 0;">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" style="display: inline-block; animation: spin 1s linear infinite; border-radius: 50%; height: 2rem; width: 2rem; border-bottom: 2px solid #2563eb;"></div>
			<p class="mt-4 text-gray-600" style="margin-top: 1rem; color: #4b5563;">Loading course...</p>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="text-center py-12" style="text-align: center; padding: 3rem 0;">
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" style="background: #fee2e2; border: 1px solid #f87171; color: #dc2626; padding: 0.75rem 1rem; border-radius: 0.25rem;">
				<strong class="font-bold" style="font-weight: 700;">Error:</strong>
				<span class="block sm:inline" style="display: block;">{error}</span>
			</div>
			<button
				on:click={loadCourse}
				class="mt-4 btn btn-primary"
				style="margin-top: 1rem; display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;"
			>
				Try Again
			</button>
		</div>
	{:else if course}
		<!-- Course Header -->
		<div class="bg-white rounded-lg shadow-lg p-8 mb-8" style="background: white; border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); padding: 2rem; margin-bottom: 2rem;">
			<div class="flex justify-between items-start mb-6" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
				<div class="flex-1">
					<h1 class="text-3xl font-bold text-gray-800 mb-4" style="font-size: 1.875rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">
						{course.title}
					</h1>
					<p class="text-lg text-gray-600 mb-4" style="font-size: 1.125rem; color: #4b5563; margin-bottom: 1rem;">
						{course.description}
					</p>
					<div class="flex gap-4 items-center" style="display: flex; gap: 1rem; align-items: center;">
						<span class="px-3 py-1 rounded-full text-sm font-medium {getDifficultyColor(course.difficulty)}" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">
							{course.difficulty}
						</span>
						<span class="text-gray-500" style="color: #6b7280;">
							⏱️ {formatDuration(course.estimated_duration)}
						</span>
						<span class="text-gray-500" style="color: #6b7280;">
							📚 {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
						</span>
					</div>
				</div>
			</div>
			
			<!-- Success Message for New Courses -->
			<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6" style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
				<strong class="font-bold" style="font-weight: 700;">🎉 Course Created Successfully!</strong>
				<p class="mt-1" style="margin-top: 0.25rem;">
					Your course has been generated and is ready to use. You can now view the lessons below or start customizing the content.
				</p>
			</div>
		</div>

		<!-- Lessons Section -->
		<div class="bg-white rounded-lg shadow-lg p-8" style="background: white; border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); padding: 2rem;">
			<h2 class="text-2xl font-bold text-gray-800 mb-6" style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 1.5rem;">
				Course Lessons
			</h2>
			
			{#if lessons.length === 0}
				<div class="text-center py-8" style="text-align: center; padding: 2rem 0;">
					<div class="text-gray-400 text-4xl mb-4" style="color: #9ca3af; font-size: 2.25rem; margin-bottom: 1rem;">📝</div>
					<p class="text-gray-600" style="color: #4b5563;">No lessons available yet.</p>
				</div>
			{:else}
				<div class="space-y-4" style="display: flex; flex-direction: column; gap: 1rem;">
					{#each lessons as lesson, index}
						<div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow" style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; transition: box-shadow 0.2s;">
							<div class="flex justify-between items-start mb-4" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
								<div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
									<span class="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold" style="background: #dbeafe; color: #1e40af; border-radius: 50%; width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700;">
										{index + 1}
									</span>
									<h3 class="text-xl font-semibold text-gray-800" style="font-size: 1.25rem; font-weight: 600; color: #1f2937;">
										{lesson.title}
									</h3>
								</div>
								<span class="text-sm text-gray-500" style="font-size: 0.875rem; color: #6b7280;">
									⏱️ {formatDuration(lesson.estimated_duration)}
								</span>
							</div>
							
							<div class="prose max-w-none" style="max-width: none;">
								<div class="text-gray-600 leading-relaxed" style="color: #4b5563; line-height: 1.625;">
									{lesson.content}
								</div>
							</div>
							
							<div class="mt-4 pt-4 border-t border-gray-100" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
								<a href="/courses/{courseId}/lessons/{lesson.id}" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
									Start Lesson
								</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Action Buttons -->
		<div class="flex justify-center gap-4 mt-8" style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;">
			<a href="/courses" class="btn btn-secondary" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;">
				← Back to Courses
			</a>
			<a href="/start" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
				Create Another Course
			</a>
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
	
	.prose {
		color: #374151;
	}
	
	.prose p {
		margin-bottom: 1rem;
	}
	
	.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
		color: #111827;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}
	
	.prose ul, .prose ol {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}
	
	.prose li {
		margin-bottom: 0.25rem;
	}
	
	.prose code {
		background: #f3f4f6;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
	
	.prose pre {
		background: #1f2937;
		color: #f9fafb;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1rem;
	}
	
	.prose pre code {
		background: none;
		padding: 0;
		color: inherit;
	}
</style> 