<script lang="ts">
	import type { Lesson } from '$lib/types';
	
	export let lesson: Lesson;
	export let lessonIndex: number;
	export let isCurrentLesson = false;
	export let isCompleted = false;
	export let showVideoIndicator = true;
	export let variant: 'default' | 'compact' = 'default';
	export let actionText = 'Start Lesson';
	export let actionHref: string;
	
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

<article class="lesson-card lesson-card--{variant} {isCurrentLesson ? 'lesson-card--current' : ''}">
	<div class="lesson-header">
		<div class="lesson-number">
			<span class="lesson-index">{lessonIndex + 1}</span>
		</div>
		<div class="lesson-info">
			<h3 class="lesson-title">{lesson.title}</h3>
			<div class="lesson-meta">
				<span class="lesson-duration">
					⏱️ {formatDuration(lesson.estimated_duration)}
				</span>
				{#if showVideoIndicator && lesson.video_url}
					<span class="video-indicator">🎥</span>
				{/if}
				{#if isCompleted}
					<span class="completion-indicator">✅</span>
				{/if}
			</div>
		</div>
	</div>
	
	{#if variant === 'default'}
		<div class="lesson-content">
			{lesson.content}
		</div>
	{/if}
	
	<div class="lesson-footer">
		<a href={actionHref} class="btn-primary {isCompleted ? 'btn-completed' : ''}">
			{actionText}
		</a>
	</div>
</article>

<style>
	.lesson-card {
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		padding: var(--spacing-5);
		transition: all 0.2s ease;
		background-color: white;
	}

	.lesson-card:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.lesson-card--current {
		border-color: var(--color-primary);
		background-color: var(--color-gray-50);
		box-shadow: var(--shadow-sm);
	}

	.lesson-card--compact {
		padding: var(--spacing-4);
	}

	.lesson-card--compact .lesson-content {
		display: none;
	}

	.lesson-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-4);
		gap: var(--spacing-4);
	}

	.lesson-number {
		flex-shrink: 0;
	}

	.lesson-index {
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
		color: white;
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.lesson-card--current .lesson-index {
		background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
	}

	.lesson-info {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-4);
	}

	.lesson-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-gray-800);
		margin: 0;
		line-height: 1.3;
		flex: 1;
	}

	.lesson-meta {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		flex-shrink: 0;
	}

	.lesson-duration {
		font-size: 0.875rem;
		color: var(--color-gray-500);
		white-space: nowrap;
	}

	.video-indicator {
		font-size: 0.875rem;
		color: var(--color-primary);
	}

	.completion-indicator {
		font-size: 0.875rem;
		color: var(--color-success);
	}

	.lesson-content {
		color: var(--color-gray-600);
		line-height: 1.6;
		margin-bottom: var(--spacing-4);
	}

	.lesson-footer {
		padding-top: var(--spacing-4);
		border-top: 1px solid var(--color-gray-100);
	}

	.btn-completed {
		background-color: var(--color-success) !important;
		border-color: var(--color-success) !important;
		color: white !important;
	}

	.btn-completed:hover {
		background-color: var(--color-success-dark) !important;
		border-color: var(--color-success-dark) !important;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.lesson-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-3);
		}

		.lesson-info {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-2);
		}

		.lesson-meta {
			align-self: flex-start;
		}
	}
</style> 