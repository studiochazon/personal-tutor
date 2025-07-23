<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { requireAuth } from '$lib/auth-guard';
	import { getAuthToken } from '$lib/auth';
	import type { Course, Lesson, Enrollment, Progress } from '$lib/types';
	import { LessonCard, LoadingState, EmptyState, EnrollmentStatus, ProgressBar } from '$lib/components/ui';
	
	let course: Course | null = null;
	let lessons: Lesson[] = [];
	let enrollment: Enrollment | null = null;
	let courseProgress: Progress[] = [];
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
				
				// Load enrollment status and course progress
				await Promise.all([
					loadEnrollment(),
					loadCourseProgress()
				]);
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
	
	async function loadCourseProgress() {
		try {
			const token = getAuthToken();
			if (!token) return;
			
			const response = await fetch(`/api/courses/${courseId}/progress`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const data = await response.json();
				courseProgress = data.course_progress.progress || [];
			}
		} catch (err) {
			console.error('Error loading course progress:', err);
		}
	}
	
	function getCourseProgressPercentage(): number {
		if (lessons.length === 0) return 0;
		const completedLessons = courseProgress.filter(p => p.completed).length;
		return Math.round((completedLessons / lessons.length) * 100);
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
	
	function formatDuration(minutes: number | null): string {
		if (!minutes) return 'Self-paced';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}
</script>

<svelte:head>
	<title>{course ? course.title : 'Course'} - Personal Tutor AI</title>
	<meta name="description" content={course ? course.description : 'Course details'} />
</svelte:head>

{#if !isAuthenticated}
	<!-- Loading state while checking authentication -->
	<div class="page-container">
		<LoadingState message="Checking authentication..." />
	</div>
{:else}
	<div class="page-container">
		<!-- Loading State -->
		{#if loading}
			<LoadingState message="Loading course..." />
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
							<span class="difficulty-badge difficulty-{course.difficulty}">
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
							<div class="enrollment-status-wrapper">
								<EnrollmentStatus {enrollment} variant="badge" size="lg" />
								
								<!-- Course Progress -->
								{#if lessons.length > 0}
									<div class="course-progress-section">
										<div class="progress-header">
											<span class="progress-label">Course Progress</span>
											<span class="progress-percentage">{getCourseProgressPercentage()}%</span>
										</div>
										<ProgressBar 
											percentage={getCourseProgressPercentage()} 
											size="lg" 
											showLabel={false}
										/>
									</div>
								{/if}
								
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
						<EmptyState 
							title="No lessons available yet"
							description="Lessons will be generated for this course."
							icon="📝"
						/>
					{:else}
						<div class="lessons-list">
							{#each lessons as lesson, index}
								<LessonCard 
									{lesson}
									lessonIndex={index}
									actionText="Start Lesson"
									actionHref="/courses/{courseId}/lessons/{lesson.id}"
								/>
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

	.enrollment-status-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
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

	/* Lessons List */
	.lessons-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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

	/* Course Progress Section */
	.course-progress-section {
		width: 100%;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #E5E7EB;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.progress-label {
		font-size: 0.875rem;
		color: #6B7280;
	}

	.progress-percentage {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1F2937;
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