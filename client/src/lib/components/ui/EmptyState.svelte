<script lang="ts">
	export let title: string;
	export let description: string;
	export let icon = '📝';
	export let actionText: string | null = null;
	export let actionHref: string | null = null;
	export let variant: 'default' | 'compact' | 'large' = 'default';
	export let showIcon = true;
	
	function getIconSize(): string {
		switch (variant) {
			case 'compact':
				return '2rem';
			case 'large':
				return '4rem';
			default:
				return '3rem';
		}
	}
	
	function getTitleSize(): string {
		switch (variant) {
			case 'compact':
				return '1rem';
			case 'large':
				return '1.5rem';
			default:
				return '1.25rem';
		}
	}
</script>

<div class="empty-state empty-state--{variant}">
	{#if showIcon}
		<div 
			class="empty-icon"
			style="font-size: {getIconSize()};"
		>
			{icon}
		</div>
	{/if}
	
	<h3 
		class="empty-title"
		style="font-size: {getTitleSize()};"
	>
		{title}
	</h3>
	
	<p class="empty-description">
		{description}
	</p>
	
	{#if actionText && actionHref}
		<div class="empty-action">
			<a href={actionHref} class="btn-primary">
				{actionText}
			</a>
		</div>
	{/if}
</div>

<style>
	.empty-state {
		text-align: center;
		padding: var(--spacing-8);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-4);
	}

	.empty-state--compact {
		padding: var(--spacing-6);
		gap: var(--spacing-3);
	}

	.empty-state--large {
		padding: var(--spacing-12);
		gap: var(--spacing-6);
	}

	.empty-icon {
		opacity: 0.6;
		margin-bottom: var(--spacing-2);
	}

	.empty-title {
		font-weight: 600;
		color: var(--color-gray-800);
		margin: 0;
		line-height: 1.3;
	}

	.empty-description {
		color: var(--color-gray-500);
		margin: 0;
		line-height: 1.5;
		max-width: 24rem;
	}

	.empty-state--compact .empty-description {
		max-width: 20rem;
	}

	.empty-state--large .empty-description {
		max-width: 32rem;
		font-size: 1.125rem;
	}

	.empty-action {
		margin-top: var(--spacing-2);
	}

	.empty-state--compact .empty-action {
		margin-top: var(--spacing-1);
	}

	.empty-state--large .empty-action {
		margin-top: var(--spacing-4);
	}
</style> 