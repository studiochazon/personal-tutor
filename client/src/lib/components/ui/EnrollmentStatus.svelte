<script lang="ts">
	import type { Enrollment } from '$lib/types';
	
	export let enrollment: Enrollment | null = null;
	export let showIcon = true;
	export let showText = true;
	export let variant: 'badge' | 'card' = 'badge';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	
	function getStatusIcon(status: string): string {
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
	
	function getStatusText(status: string): string {
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
	
	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'status-active';
			case 'completed':
				return 'status-completed';
			case 'paused':
				return 'status-paused';
			case 'dropped':
				return 'status-dropped';
			default:
				return 'status-default';
		}
	}
	
	function getStatusDescription(status: string): string {
		switch (status) {
			case 'active':
				return 'You are currently enrolled in this course';
			case 'completed':
				return 'You have successfully completed this course';
			case 'paused':
				return 'Your enrollment is currently paused';
			case 'dropped':
				return 'You have dropped this course';
			default:
				return '';
		}
	}
</script>

{#if enrollment}
	<div class="enrollment-status enrollment-status--{variant} enrollment-status--{size} {getStatusColor(enrollment.status)}">
		{#if showIcon}
			<span class="status-icon">{getStatusIcon(enrollment.status)}</span>
		{/if}
		
		{#if showText}
			<span class="status-text">{getStatusText(enrollment.status)}</span>
		{/if}
		
		{#if variant === 'card'}
			<p class="status-description">{getStatusDescription(enrollment.status)}</p>
			{#if enrollment.completed_at}
				<p class="completion-date">
					Completed on {new Date(enrollment.completed_at).toLocaleDateString()}
				</p>
			{/if}
		{/if}
	</div>
{:else}
	<div class="enrollment-status enrollment-status--{variant} enrollment-status--{size} enrollment-status--not-enrolled">
		{#if showIcon}
			<span class="status-icon">📖</span>
		{/if}
		
		{#if showText}
			<span class="status-text">Not Enrolled</span>
		{/if}
		
		{#if variant === 'card'}
			<p class="status-description">You are not enrolled in this course yet</p>
		{/if}
	</div>
{/if}

<style>
	.enrollment-status {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.enrollment-status--badge {
		padding: var(--spacing-1) var(--spacing-3);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.enrollment-status--card {
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-2);
		padding: var(--spacing-4);
		border-radius: var(--radius-lg);
		border: 1px solid;
		background-color: white;
		box-shadow: var(--shadow-sm);
	}

	.enrollment-status--sm {
		font-size: 0.75rem;
	}

	.enrollment-status--sm .status-icon {
		font-size: 0.75rem;
	}

	.enrollment-status--md {
		font-size: 0.875rem;
	}

	.enrollment-status--md .status-icon {
		font-size: 0.875rem;
	}

	.enrollment-status--lg {
		font-size: 1rem;
	}

	.enrollment-status--lg .status-icon {
		font-size: 1rem;
	}

	.status-icon {
		flex-shrink: 0;
	}

	.status-text {
		font-weight: 600;
		text-transform: capitalize;
	}

	.status-description {
		font-size: 0.875rem;
		color: var(--color-gray-600);
		margin: 0;
		line-height: 1.4;
	}

	.completion-date {
		font-size: 0.75rem;
		color: var(--color-gray-500);
		margin: 0;
	}

	/* Status Colors */
	.status-active {
		background-color: var(--color-primary-light);
		color: var(--color-primary-dark);
		border-color: var(--color-primary);
	}

	.status-completed {
		background-color: var(--color-success-light);
		color: var(--color-success-text);
		border-color: var(--color-success);
	}

	.status-paused {
		background-color: var(--color-warning-light);
		color: var(--color-warning-text);
		border-color: var(--color-warning);
	}

	.status-dropped {
		background-color: var(--color-error-light);
		color: var(--color-error-text);
		border-color: var(--color-error);
	}

	.status-default {
		background-color: var(--color-gray-100);
		color: var(--color-gray-700);
		border-color: var(--color-gray-300);
	}

	.enrollment-status--not-enrolled {
		background-color: var(--color-gray-50);
		color: var(--color-gray-600);
		border-color: var(--color-gray-200);
	}

	/* Card variant specific styles */
	.enrollment-status--card.status-active {
		background-color: white;
		border-color: var(--color-primary);
		color: var(--color-primary-dark);
	}

	.enrollment-status--card.status-completed {
		background-color: white;
		border-color: var(--color-success);
		color: var(--color-success-text);
	}

	.enrollment-status--card.status-paused {
		background-color: white;
		border-color: var(--color-warning);
		color: var(--color-warning-text);
	}

	.enrollment-status--card.status-dropped {
		background-color: white;
		border-color: var(--color-error);
		color: var(--color-error-text);
	}

	.enrollment-status--card.enrollment-status--not-enrolled {
		background-color: white;
		border-color: var(--color-gray-200);
		color: var(--color-gray-600);
	}
</style> 