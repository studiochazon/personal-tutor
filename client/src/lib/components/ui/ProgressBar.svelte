<script lang="ts">
	export let percentage: number;
	export let showLabel = true;
	export let label = 'Progress';
	export let showPercentage = true;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'default' | 'success' | 'warning' | 'error' = 'default';
	export let animated = true;
	
	// Ensure percentage is between 0 and 100
	$: clampedPercentage = Math.max(0, Math.min(100, percentage));
	
	function getProgressColor(): string {
		switch (variant) {
			case 'success':
				return 'var(--color-success)';
			case 'warning':
				return 'var(--color-warning)';
			case 'error':
				return 'var(--color-error)';
			default:
				return 'var(--color-primary)';
		}
	}
	
	function getProgressGradient(): string {
		switch (variant) {
			case 'success':
				return 'linear-gradient(135deg, var(--color-success) 0%, var(--color-success-dark) 100%)';
			case 'warning':
				return 'linear-gradient(135deg, var(--color-warning) 0%, var(--color-warning-dark) 100%)';
			case 'error':
				return 'linear-gradient(135deg, var(--color-error) 0%, var(--color-error-dark) 100%)';
			default:
				return 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)';
		}
	}
	
	function getHeight(): string {
		switch (size) {
			case 'sm':
				return '0.25rem';
			case 'lg':
				return '0.75rem';
			default:
				return '0.5rem';
		}
	}
</script>

<div class="progress-container">
	{#if showLabel}
		<div class="progress-header">
			<span class="progress-label">{label}</span>
			{#if showPercentage}
				<span class="progress-percentage">{Math.round(clampedPercentage)}%</span>
			{/if}
		</div>
	{/if}
	
	<div class="progress-bar progress-bar--{size}">
		<div 
			class="progress-fill progress-fill--{variant} {animated ? 'progress-fill--animated' : ''}"
			style="width: {clampedPercentage}%; height: {getHeight()}; background: {getProgressGradient()};"
		></div>
	</div>
</div>

<style>
	.progress-container {
		width: 100%;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-1);
	}

	.progress-label {
		font-size: 0.875rem;
		color: var(--color-gray-600);
		font-weight: 500;
	}

	.progress-percentage {
		font-size: 0.875rem;
		color: var(--color-gray-600);
		font-weight: 600;
	}

	.progress-bar {
		width: 100%;
		background-color: var(--color-gray-200);
		border-radius: var(--radius-full);
		overflow: hidden;
		position: relative;
	}

	.progress-bar--sm {
		height: 0.25rem;
	}

	.progress-bar--md {
		height: 0.5rem;
	}

	.progress-bar--lg {
		height: 0.75rem;
	}

	.progress-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width 0.3s ease;
		position: relative;
	}

	.progress-fill--animated {
		transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.progress-fill--animated::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.3),
			transparent
		);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	/* Variant-specific styles */
	.progress-fill--success {
		background: linear-gradient(135deg, var(--color-success) 0%, var(--color-success-dark) 100%);
	}

	.progress-fill--warning {
		background: linear-gradient(135deg, var(--color-warning) 0%, var(--color-warning-dark) 100%);
	}

	.progress-fill--error {
		background: linear-gradient(135deg, var(--color-error) 0%, var(--color-error-dark) 100%);
	}

	.progress-fill--default {
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
	}
</style> 