<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { requireAuth } from '$lib/auth-guard';
	import { getAuthToken } from '$lib/auth';
	import type { Course, Lesson, Progress } from '$lib/types';
	import { LoadingState, ProgressBar, LessonCard } from '$lib/components/ui';
	
	let course: Course | null = null;
	let lesson: Lesson | null = null;
	let allLessons: Lesson[] = [];
	let currentLessonIndex = 0;
	let loading = true;
	let error: string | null = null;
	let isAuthenticated = false;
	let lessonProgress: Progress | null = null;
	let markingComplete = false;
	
	$: courseId = $page.params.id;
	$: lessonId = $page.params.lessonId;
	
	onMount(async () => {
		// Check authentication first
		isAuthenticated = await requireAuth();
		
		if (isAuthenticated) {
			// Only load data if authenticated
			await loadLesson();
		}
	});
	
	async function loadLesson() {
		try {
			loading = true;
			error = null;
			
			// Load lesson data from the lessons API
			const lessonResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
			const lessonData = await lessonResponse.json();
			
			if (!lessonResponse.ok) {
				throw new Error(lessonData.error || 'Failed to load lesson');
			}
			
			course = lessonData.course;
			lesson = lessonData.lesson;
			allLessons = lessonData.allLessons || [];
			if (lesson) {
				currentLessonIndex = allLessons.findIndex(l => l.id === lesson!.id);
			} else {
				currentLessonIndex = 0;
			}
			
			// Load progress for this lesson
			await loadLessonProgress();
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load lesson';
			console.error('Error loading lesson:', err);
		} finally {
			loading = false;
		}
	}
	
	async function loadLessonProgress() {
		try {
			const token = getAuthToken();
			if (!token || !lesson) return;
			
			const response = await fetch('/api/progress', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				lessonProgress = data.progress.find((p: Progress) => p.lesson_id === lesson!.id) || null;
			}
		} catch (err) {
			console.error('Error loading lesson progress:', err);
		}
	}
	
	async function markLessonComplete() {
		try {
			markingComplete = true;
			const token = getAuthToken();
			if (!token || !lesson) {
				error = 'Please log in to track progress';
				return;
			}
			
			const response = await fetch('/api/progress', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ 
					lesson_id: lesson.id, 
					completed: true,
					time_spent: 300 // 5 minutes default, could be calculated from actual time spent
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				lessonProgress = data.progress;
				error = null; // Clear any previous errors
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to mark lesson complete';
			}
		} catch (err) {
			error = 'Failed to mark lesson complete';
			console.error('Error marking lesson complete:', err);
		} finally {
			markingComplete = false;
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
	
	function formatVideoDuration(seconds: number | null): string {
		if (!seconds) return '';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		
		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}
	
	function getEmbedUrl(url: string): string {
		if (!url) return '';
		
		// YouTube URL transformations
		if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
			let videoId = '';
			
			// Handle youtu.be URLs
			if (url.includes('youtu.be/')) {
				videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
			}
			// Handle youtube.com/watch URLs
			else if (url.includes('youtube.com/watch')) {
				const urlParams = new URLSearchParams(url.split('?')[1] || '');
				videoId = urlParams.get('v') || '';
			}
			
			if (videoId) {
				return `https://www.youtube.com/embed/${videoId}`;
			}
		}
		
		// Vimeo URL transformations
		if (url.includes('vimeo.com/')) {
			const videoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
			if (videoId) {
				return `https://player.vimeo.com/video/${videoId}`;
			}
		}
		
		// If it's already an embed URL, return as is
		if (url.includes('/embed/') || url.includes('player.')) {
			return url;
		}
		
		// For other URLs, return as is (they might be direct video files)
		return url;
	}
	
	function getPreviousLesson() {
		if (currentLessonIndex > 0) {
			return allLessons[currentLessonIndex - 1];
		}
		return null;
	}
	
	function getNextLesson() {
		if (currentLessonIndex < allLessons.length - 1) {
			return allLessons[currentLessonIndex + 1];
		}
		return null;
	}
	
	function getProgressPercentage(): number {
		return ((currentLessonIndex + 1) / allLessons.length) * 100;
	}
</script>

<svelte:head>
	<title>{lesson ? lesson.title : 'Lesson'} - {course ? course.title : 'Course'} - Personal Tutor AI</title>
	<meta name="description" content={lesson ? (lesson.content || '').substring(0, 160) : 'Lesson content'} />
</svelte:head>

{#if !isAuthenticated}
	<!-- Loading state while checking authentication -->
	<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
		<LoadingState message="Checking authentication..." />
	</div>
{:else}
	<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
		<!-- Loading State -->
		{#if loading}
			<LoadingState message="Loading lesson..." />
		{:else if error}
			<!-- Error State -->
			<div class="text-center py-12" style="text-align: center; padding: 3rem 0;">
				<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" style="background: #fee2e2; border: 1px solid #f87171; color: #dc2626; padding: 0.75rem 1rem; border-radius: 0.25rem;">
					<strong class="font-bold" style="font-weight: 700;">Error:</strong>
					<span class="block sm:inline" style="display: block;">{error}</span>
				</div>
				<button
					on:click={loadLesson}
					class="btn btn-primary"
					style="margin-top: 1rem;"
				>
					Try Again
				</button>
			</div>
		{:else if course && lesson}
			<!-- Course Header -->
			<div class="bg-white rounded-lg shadow-lg p-6 mb-6" style="background: white; border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); padding: 1.5rem; margin-bottom: 1.5rem;">
				<div class="flex justify-between items-start mb-4" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
					<div class="flex-1">
						<nav class="text-sm text-gray-500 mb-2" style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">
							<a href="/courses" class="hover:text-blue-600" style="color: inherit; text-decoration: none;">Courses</a>
							<span class="mx-2">→</span>
							<a href="/courses/{course.id}" class="hover:text-blue-600" style="color: inherit; text-decoration: none;">{course.title}</a>
							<span class="mx-2">→</span>
							<span class="text-gray-700">{lesson.title}</span>
						</nav>
						
						<h1 class="text-2xl font-bold text-gray-800 mb-2" style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem;">
							{lesson.title}
						</h1>
						
						<div class="flex gap-4 items-center" style="display: flex; gap: 1rem; align-items: center;">
							<span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800" style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; background: #d1fae5; color: #065f46;">
								{course.difficulty}
							</span>
							<span class="text-gray-500" style="color: #6b7280;">
								⏱️ {formatDuration(lesson.estimated_duration)}
							</span>
							<span class="text-gray-500" style="color: #6b7280;">
								📚 Lesson {currentLessonIndex + 1} of {allLessons.length}
							</span>
							{#if lesson.video_url}
								<span class="text-blue-600" style="color: #2563eb;">
									🎥 Video Available
								</span>
							{/if}
						</div>
					</div>
				</div>
				
				<!-- Progress Bar -->
				<ProgressBar 
					percentage={getProgressPercentage()}
					label="Course Progress"
					size="md"
					animated={true}
				/>
			</div>

			<!-- Lesson Content -->
			<div class="bg-white rounded-lg shadow-lg p-8 mb-6" style="background: white; border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); padding: 2rem; margin-bottom: 1.5rem;">
				<!-- Video Section -->
				{#if lesson && lesson.video_url}
					<div class="mb-8" style="margin-bottom: 2rem;">
						<div class="bg-gray-900 rounded-lg overflow-hidden" style="background: #111827; border-radius: 0.5rem; overflow: hidden;">
							<div class="relative" style="position: relative;">
								<iframe
									src="{getEmbedUrl(lesson.video_url)}"
									title="{lesson.video_title || lesson.title}"
									class="w-full aspect-video"
									style="width: 100%; aspect-ratio: 16 / 9;"
									frameborder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowfullscreen
								></iframe>
							</div>
						</div>
						
						<!-- Video Info -->
						<div class="mt-4 flex items-center justify-between" style="margin-top: 1rem; display: flex; align-items: center; justify-content: space-between;">
							<div>
								{#if lesson.video_title}
									<h3 class="text-lg font-semibold text-gray-800" style="font-size: 1.125rem; font-weight: 600; color: #1f2937;">
										{lesson.video_title}
									</h3>
								{/if}
								{#if lesson.video_duration}
									<p class="text-sm text-gray-600 mt-1" style="font-size: 0.875rem; color: #4b5563; margin-top: 0.25rem;">
										⏱️ Duration: {formatVideoDuration(lesson.video_duration)}
									</p>
								{/if}
							</div>
							<div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 0.5rem;">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" style="display: inline-flex; align-items: center; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: #dbeafe; color: #1e40af;">
									🎥 Video Lesson
								</span>
							</div>
						</div>
					</div>
				{/if}
				
				<!-- Lesson Content -->
				<div class="prose max-w-none" style="max-width: none;">
					{@html lesson.content.replace(/\n/g, '<br>').replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>')}
				</div>
				
				<!-- Progress Section -->
				<div class="mt-8 p-4 bg-gray-50 rounded-lg" style="margin-top: 2rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-lg font-semibold text-gray-800" style="font-size: 1.125rem; font-weight: 600; color: #1f2937;">
								Lesson Progress
							</h4>
							{#if lessonProgress?.completed}
								<p class="text-green-600 text-sm mt-1" style="color: #059669; font-size: 0.875rem; margin-top: 0.25rem;">
									✅ Completed on {new Date(lessonProgress.completed_at!).toLocaleDateString()}
								</p>
							{:else}
								<p class="text-gray-600 text-sm mt-1" style="color: #4b5563; font-size: 0.875rem; margin-top: 0.25rem;">
									📖 Not completed yet
								</p>
							{/if}
						</div>
						{#if !lessonProgress?.completed}
							<button 
								on:click={markLessonComplete}
								disabled={markingComplete}
								class="btn btn-success {markingComplete ? 'btn-loading' : ''}"
							>
								{markingComplete ? 'Marking...' : '✅ Mark Complete'}
							</button>
						{:else}
							<span class="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800" style="display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; background: #dcfce7; color: #166534;">
								✅ Completed
							</span>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- Navigation -->
			<div class="flex justify-between items-center mb-8" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
				{#if getPreviousLesson()}
					<a 
						href="/courses/{course.id}/lessons/{getPreviousLesson()!.id}" 
						class="btn btn-secondary"
					>
						← Previous Lesson
					</a>
				{:else}
					<div></div>
				{/if}
				
				{#if getNextLesson()}
					<a 
						href="/courses/{course.id}/lessons/{getNextLesson()!.id}" 
						class="btn btn-primary"
					>
						Next Lesson →
					</a>
				{:else}
					<button 
						class="btn btn-success"
					>
						🎉 Complete Course
					</button>
				{/if}
			</div>
			
			<!-- Lesson List -->
			<div class="bg-white rounded-lg shadow-lg p-6" style="background: white; border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); padding: 1.5rem;">
				<h3 class="text-lg font-semibold text-gray-800 mb-4" style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">
					Course Lessons
				</h3>
				<div class="space-y-2" style="display: flex; flex-direction: column; gap: 0.5rem;">
					{#each allLessons as lessonItem, index}
						<a 
							href="/courses/{course.id}/lessons/{lessonItem.id}"
							class="flex items-center gap-3 p-3 rounded-lg transition-colors {lessonItem.id === lesson.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}"
							style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; transition: background-color 0.2s; text-decoration: none; color: inherit; {lessonItem.id === lesson.id ? 'background: #eff6ff; border: 1px solid #bfdbfe;' : ''}"
						>
							<span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold" style="background: #dbeafe; color: #1e40af; border-radius: 50%; width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
								{index + 1}
							</span>
							<span class="flex-1 text-sm {lessonItem.id === lesson.id ? 'font-semibold text-blue-800' : 'text-gray-700'}" style="flex: 1; font-size: 0.875rem; {lessonItem.id === lesson.id ? 'font-weight: 600; color: #1e40af;' : 'color: #374151;'}">
								{lessonItem.title}
							</span>
							<div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 0.5rem;">
								{#if lessonItem.video_url}
									<span class="text-blue-600 text-xs" style="color: #2563eb; font-size: 0.75rem;">🎥</span>
								{/if}
								{#if lessonItem.id === lesson.id}
									<span class="text-blue-600 text-xs" style="color: #2563eb; font-size: 0.75rem;">Current</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</div>
			
			<!-- Action Buttons -->
			<div class="flex justify-center gap-4 mt-8" style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;">
				<a href="/courses/{course.id}" class="btn btn-secondary">
					← Back to Course
				</a>
				<a href="/courses" class="btn btn-secondary">
					All Courses
				</a>
			</div>
		{/if}
	</div>
{/if}

<style>
	.prose {
		color: #374151;
		line-height: 1.7;
	}
	

</style> 