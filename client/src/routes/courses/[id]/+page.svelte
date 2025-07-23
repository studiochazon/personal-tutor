<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { requireAuth } from '$lib/auth-guard';
	import { getAuthToken } from '$lib/auth';
	import type { Course, Lesson, Enrollment } from '$lib/types';
	
	let course: Course | null = null;
	let lessons: Lesson[] = [];
	let enrollment: Enrollment | null = null;
	let loading = true;
	let error: string | null = null;
	let isAuthenticated = false;
	let enrolling = false;
	
	$: courseId = $page.params.id;
	
	onMount(async () => {
		// Check authentication first
		isAuthenticated = await requireAuth();
		
		if (isAuthenticated) {
			// Only load data if authenticated
			await loadCourse();
		}
	});
	
	async function loadCourse() {
		try {
			loading = true;
			error = null;
			
			const response = await fetch(`/api/courses/${courseId}`);
			const data = await response.json();
			
			if (response.ok) {
				course = data.course;
				lessons = data.lessons || [];
				
				// Load enrollment status
				await loadEnrollment();
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
	
	async function loadEnrollment() {
		try {
			const token = getAuthToken();
			if (!token) return;
			
			const response = await fetch(`/api/courses/${courseId}/enrollment`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				enrollment = data.enrollment;
			}
		} catch (err) {
			console.error('Error loading enrollment:', err);
		}
	}
	
	async function enrollInCourse() {
		try {
			enrolling = true;
			const token = getAuthToken();
			if (!token) {
				error = 'Please log in to enroll in courses';
				return;
			}
			
			const response = await fetch('/api/enrollments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ course_id: parseInt(courseId) })
			});
			
			if (response.ok) {
				const data = await response.json();
				enrollment = data.enrollment;
				error = null; // Clear any previous errors
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to enroll in course';
			}
		} catch (err) {
			error = 'Failed to enroll in course';
			console.error('Error enrolling in course:', err);
		} finally {
			enrolling = false;
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
	
	// Removed old onMount - now handled in the new onMount with auth check
</script>

<svelte:head>
	<title>{course ? course.title : 'Course'} - Personal Tutor AI</title>
	<meta name="description" content={course ? course.description : 'Course details'} />
</svelte:head>

{#if !isAuthenticated}
	<!-- Loading state while checking authentication -->
	<div class="page-container">
		<div class="flex justify-center items-center min-h-[400px]">
			<div class="text-center">
				<div class="loading-spinner mx-auto mb-4"></div>
				<p class="loading-text">Checking authentication...</p>
			</div>
		</div>
	</div>
{:else}
	<div class="page-container">
		<!-- Loading State -->
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p class="loading-text">Loading course...</p>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="error-state">
				<div class="error-message">
					<strong>Error:</strong>
					<span>{error}</span>
				</div>
				<button on:click={loadCourse} class="btn-primary">
					Try Again
				</button>
			</div>
		{:else if course}
			<div class="container">
				<!-- Course Header -->
				<header class="course-header">
					<div class="course-info">
						<h1 class="course-title">{course.title}</h1>
						<p class="course-description">{course.description}</p>
						<div class="course-meta">
							<span class="difficulty-badge {getDifficultyColor(course.difficulty)}">
								{course.difficulty}
							</span>
							<span class="meta-item">
								⏱️ {formatDuration(course.estimated_duration)}
							</span>
							<span class="meta-item">
								📚 {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
							</span>
						</div>
					</div>
					
					<!-- Enrollment Section -->
					<div class="enrollment-section">
						{#if enrollment}
							<div class="enrollment-status">
								<span class="status-badge status-{enrollment.status}">
									{enrollment.status === 'active' ? '📚 Enrolled' : 
									 enrollment.status === 'completed' ? '✅ Completed' :
									 enrollment.status === 'paused' ? '⏸️ Paused' : '❌ Dropped'}
								</span>
								{#if enrollment.status === 'active'}
									<a href="/courses/{courseId}/lessons/{lessons[0]?.id}" class="btn-primary">
										Continue Learning
									</a>
								{/if}
							</div>
						{:else}
							<button 
								on:click={enrollInCourse} 
								disabled={enrolling}
								class="btn-primary"
							>
								{enrolling ? 'Enrolling...' : 'Enroll in Course'}
							</button>
						{/if}
					</div>
				</header>

				<!-- Success Message for New Courses -->
				<div class="success-message">
					<strong>🎉 Course Created Successfully!</strong>
					<p>
						Your course has been generated and is ready to use. You can now view the lessons below or start customizing the content.
					</p>
				</div>

				<!-- Lessons Section -->
				<main class="lessons-section">
					<h2 class="section-title">Course Lessons</h2>
					
					{#if lessons.length === 0}
						<div class="empty-state">
							<div class="empty-icon">📝</div>
							<p class="empty-text">No lessons available yet.</p>
						</div>
					{:else}
						<div class="lessons-list">
							{#each lessons as lesson, index}
								<article class="lesson-card">
									<div class="lesson-header">
										<div class="lesson-number">
											<span class="lesson-index">{index + 1}</span>
										</div>
										<div class="lesson-info">
											<h3 class="lesson-title">{lesson.title}</h3>
											<span class="lesson-duration">
												⏱️ {formatDuration(lesson.estimated_duration)}
											</span>
										</div>
									</div>
									
									<div class="lesson-content">
										{lesson.content}
									</div>
									
									<div class="lesson-footer">
										<a href="/courses/{courseId}/lessons/{lesson.id}" class="btn-primary">
											Start Lesson
										</a>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</main>
				
				<!-- Action Buttons -->
				<footer class="action-buttons">
					<a href="/courses" class="btn-secondary">
						← Back to Courses
					</a>
					<a href="/start" class="btn-primary">
						Create Another Course
					</a>
				</footer>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Page Layout */
	.page-container {
		min-height: 100vh;
		background-color: #F9FAFB;
		padding: 2rem 0;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
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

	/* Course Header */
	.course-header {
		background-color: white;
		border-radius: 0.75rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		border: 1px solid #E5E7EB;
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
	}
	
	.course-info {
		flex: 1;
	}
	
	.enrollment-section {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-end;
	}
	
	.enrollment-status {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}
	
	.status-badge {
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: capitalize;
	}
	
	.status-active {
		background-color: #dbeafe;
		color: #1e40af;
	}
	
	.status-completed {
		background-color: #dcfce7;
		color: #166534;
	}
	
	.status-paused {
		background-color: #fef3c7;
		color: #92400e;
	}
	
	.status-dropped {
		background-color: #fee2e2;
		color: #991b1b;
	}

	.course-title {
		font-size: 2.25rem;
		font-weight: 700;
		color: #1F2937;
		margin-bottom: 1rem;
		line-height: 1.2;
	}

	.course-description {
		font-size: 1.125rem;
		color: #6B7280;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.course-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.meta-item {
		color: #6B7280;
		font-size: 0.875rem;
	}

	/* Success Message */
	.success-message {
		background-color: #F0FDF4;
		border: 1px solid #BBF7D0;
		color: #166534;
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 2rem;
	}

	.success-message strong {
		font-weight: 700;
		display: block;
		margin-bottom: 0.25rem;
	}

	.success-message p {
		margin: 0;
		line-height: 1.5;
	}

	/* Lessons Section */
	.lessons-section {
		background-color: white;
		border-radius: 0.75rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		border: 1px solid #E5E7EB;
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1F2937;
		margin-bottom: 1.5rem;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem 0;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-text {
		color: #6B7280;
		font-size: 1rem;
	}

	/* Lessons List */
	.lessons-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.lesson-card {
		border: 1px solid #E5E7EB;
		border-radius: 0.5rem;
		padding: 1.5rem;
		transition: all 0.2s ease;
	}

	.lesson-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	.lesson-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.lesson-number {
		flex-shrink: 0;
	}

	.lesson-index {
		background-color: #DBEAFE;
		color: #1E40AF;
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.lesson-info {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.lesson-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1F2937;
		margin: 0;
		line-height: 1.3;
	}

	.lesson-duration {
		font-size: 0.875rem;
		color: #6B7280;
		white-space: nowrap;
	}

	.lesson-content {
		color: #6B7280;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.lesson-footer {
		padding-top: 1rem;
		border-top: 1px solid #F3F4F6;
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 2rem;
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

	/* Responsive Design */
	@media (max-width: 768px) {
		.course-title {
			font-size: 1.875rem;
		}

		.course-description {
			font-size: 1rem;
		}

		.course-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.lesson-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.lesson-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.action-buttons {
			flex-direction: column;
			align-items: center;
		}

		.btn-secondary {
			width: 100%;
			max-width: 300px;
			text-align: center;
		}
	}
</style> 