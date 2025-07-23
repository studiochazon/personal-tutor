<script lang="ts">
	export let message = 'Loading...';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'spinner' | 'dots' | 'pulse' = 'spinner';
	export let showMessage = true;
	export let centered = true;
	
	function getSpinnerSize(): string {
		switch (size) {
			case 'sm':
				return '1rem';
			case 'lg':
				return '3rem';
			default:
				return '2rem';
		}
	}
	
	function getMessageSize(): string {
		switch (size) {
			case 'sm':
				return '0.875rem';
			case 'lg':
				return '1.125rem';
			default:
				return '1rem';
		}
	}
</script>

<div class="loading-state {centered ? 'loading-state--centered' : ''}">
	{#if variant === 'spinner'}
		<div 
			class="loading-spinner loading-spinner--{size}"
			style="width: {getSpinnerSize()}; height: {getSpinnerSize()};"
		></div>
	{:else if variant === 'dots'}
		<div class="loading-dots loading-dots--{size}">
			<div class="dot"></div>
			<div class="dot"></div>
			<div class="dot"></div>
		</div>
	{:else if variant === 'pulse'}
		<div 
			class="loading-pulse loading-pulse--{size}"
			style="width: {getSpinnerSize()}; height: {getSpinnerSize()};"
		></div>
	{/if}
	
	{#if showMessage}
		<p 
			class="loading-message loading-message--{size}"
			style="font-size: {getMessageSize()};"
		>
			{message}
		</p>
	{/if}
</div>

<style>
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-3);
	}

	.loading-state--centered {
		justify-content: center;
		min-height: 200px;
	}

	/* Spinner Animation */
	.loading-spinner {
		border: 2px solid var(--color-gray-200);
		border-top: 2px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Dots Animation */
	.loading-dots {
		display: flex;
		gap: var(--spacing-1);
	}

	.loading-dots--sm {
		gap: 0.25rem;
	}

	.loading-dots--lg {
		gap: 0.5rem;
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		background-color: var(--color-primary);
		border-radius: 50%;
		animation: dots 1.4s ease-in-out infinite both;
	}

	.loading-dots--sm .dot {
		width: 0.375rem;
		height: 0.375rem;
	}

	.loading-dots--lg .dot {
		width: 0.75rem;
		height: 0.75rem;
	}

	.dot:nth-child(1) {
		animation-delay: -0.32s;
	}

	.dot:nth-child(2) {
		animation-delay: -0.16s;
	}

	@keyframes dots {
		0%, 80%, 100% {
			transform: scale(0);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Pulse Animation */
	.loading-pulse {
		background-color: var(--color-primary);
		border-radius: 50%;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.8);
			opacity: 0.5;
		}
		50% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(0.8);
			opacity: 0.5;
		}
	}

	/* Message Styles */
	.loading-message {
		color: var(--color-gray-600);
		margin: 0;
		text-align: center;
		font-weight: 500;
	}

	.loading-message--sm {
		font-size: 0.875rem;
	}

	.loading-message--lg {
		font-size: 1.125rem;
	}
</style> 