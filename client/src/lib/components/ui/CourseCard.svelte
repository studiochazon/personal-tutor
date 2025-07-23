<script lang="ts">
	import type { Course } from '$lib/types';
	
	export let course: Course;
	export let showProgress = false;
	export let progressPercentage = 0;
	export let showEnrollmentStatus = false;
	export let enrollmentStatus: string | null = null;
	export let variant: 'default' | 'compact' | 'featured' = 'default';
	export let actionText = 'View Course';
	export let actionHref: string;
	
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
	
	function getEnrollmentStatusIcon(status: string): string {
		switch (status) {
			case 'active':
				return '📚';
			case 'completed':
				return '✅';
			case 'paused':
				return '⏸️';
			case 'dropped':
				return '❌';
			default:
				return '';
		}
	}
	
	function getEnrollmentStatusText(status: string): string {
		switch (status) {
			case 'active':
				return 'Enrolled';
			case 'completed':
				return 'Completed';
			case 'paused':
				return 'Paused';
			case 'dropped':
				return 'Dropped';
			default:
				return '';
		}
	}
</script>

<article class="course-card course-card--{variant}">
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
		
		{#if showEnrollmentStatus && enrollmentStatus}
			<div class="enrollment-status-badge enrollment-status--{enrollmentStatus}">
				{getEnrollmentStatusIcon(enrollmentStatus)} {getEnrollmentStatusText(enrollmentStatus)}
			</div>
		{/if}
	</div>
	
	<div class="course-content">
		<div class="course-header">
			<h3 class="course-title">{course.title}</h3>
		</div>
		
		{#if variant !== 'compact'}
			<p class="course-description">
				{course.description ? (course.description.length > 120 ? course.description.substring(0, 120) + '...' : course.description) : 'No description available'}
			</p>
		{/if}
		
		{#if showProgress}
			<div class="course-progress">
				<div class="progress-info">
					<span class="progress-label">Progress</span>
					<span class="progress-percentage">{progressPercentage}%</span>
				</div>
				<div class="progress-bar">
					<div 
						class="progress-fill"
						style="width: {progressPercentage}%"
					></div>
				</div>
			</div>
		{/if}
		
		<div class="course-footer">
			<span class="course-duration">
				⏱️ {formatDuration(course.estimated_duration)}
			</span>
			<a href={actionHref} class="btn-secondary">
				{actionText}
			</a>
		</div>
	</div>
</article>

<style>
	.course-card {
		background-color: white;
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-base);
		border: 1px solid var(--color-gray-200);
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.course-card:hover {
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	.course-card--compact {
		flex-direction: row;
		align-items: center;
		padding: var(--spacing-4);
	}

	.course-card--compact .course-thumbnail {
		width: 80px;
		height: 80px;
		flex-shrink: 0;
		margin-right: var(--spacing-4);
	}

	.course-card--compact .course-content {
		flex: 1;
		padding: 0;
	}

	.course-card--compact .course-description {
		display: none;
	}

	.course-card--featured {
		box-shadow: var(--shadow-xl);
		border: 2px solid var(--color-primary);
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

	.enrollment-status-badge {
		position: absolute;
		bottom: var(--spacing-3);
		left: var(--spacing-3);
		padding: var(--spacing-1) var(--spacing-3);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		backdrop-filter: blur(8px);
		background-color: rgba(255, 255, 255, 0.9);
		box-shadow: var(--shadow-sm);
	}

	.enrollment-status--active {
		color: var(--color-primary);
		background-color: rgba(0, 102, 255, 0.1);
	}

	.enrollment-status--completed {
		color: var(--color-success);
		background-color: rgba(16, 185, 129, 0.1);
	}

	.enrollment-status--paused {
		color: var(--color-warning);
		background-color: rgba(245, 158, 11, 0.1);
	}

	.enrollment-status--dropped {
		color: var(--color-error);
		background-color: rgba(239, 68, 68, 0.1);
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

	/* Progress Section */
	.course-progress {
		margin-bottom: var(--spacing-4);
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-1);
	}

	.progress-label {
		font-size: 0.875rem;
		color: var(--color-gray-600);
	}

	.progress-percentage {
		font-size: 0.875rem;
		color: var(--color-gray-600);
		font-weight: 500;
	}

	.progress-bar {
		width: 100%;
		height: 0.5rem;
		background-color: var(--color-gray-200);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
		border-radius: var(--radius-full);
		transition: width 0.3s ease;
	}

	/* Course Footer */
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

	/* Responsive Design */
	@media (max-width: 768px) {
		.course-card--compact {
			flex-direction: column;
			align-items: stretch;
		}

		.course-card--compact .course-thumbnail {
			width: 100%;
			height: 150px;
			margin-right: 0;
			margin-bottom: var(--spacing-4);
		}

		.course-footer {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-3);
		}

		.btn-secondary {
			text-align: center;
		}
	}
</style> 