<script lang="ts">
	import Icon from './Icon.svelte';
	
	export let title: string = "Start a New Course";
	export let subtitle: string = "Describe what you want to teach and our AI will create a comprehensive course for you";
	export let placeholder: string = "Teach X to Y in Z hours…";
	export let buttonText: string = "Create Course";
	export let loadingText: string = "Creating...";
	export let showAudienceDropdown: boolean = true;
	export let showDepthDropdown: boolean = true;
	export let audienceOptions: Array<{value: string, label: string}> = [
		{ value: 'beginners', label: 'Beginners' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
		{ value: 'mixed', label: 'Mixed Level' }
	];
	export let depthOptions: Array<{value: string, label: string}> = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'comprehensive', label: 'Comprehensive' },
		{ value: 'deep-dive', label: 'Deep Dive' }
	];
	export let selectedAudience: string = 'beginners';
	export let selectedDepth: string = 'comprehensive';
	export let isLoading: boolean = false;
	export let errorMessage: string = '';
	export let promptText: string = '';
	
	// Events
	export let onSubmit: (data: {prompt: string, audience?: string, depth?: string}) => void = () => {};
	
	function handleSubmit() {
		if (!promptText.trim() || isLoading) return;
		
		const data: {prompt: string, audience?: string, depth?: string} = {
			prompt: promptText.trim()
		};
		
		if (showAudienceDropdown) {
			data.audience = selectedAudience;
		}
		
		if (showDepthDropdown) {
			data.depth = selectedDepth;
		}
		
		onSubmit(data);
	}
	
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}
</script>

<section class="new-course-card">
	<div class="card-elevated">
		<div class="card-header">
			<h2 class="card-title">{title}</h2>
			{#if subtitle}
				<p class="card-subtitle">{subtitle}</p>
			{/if}
		</div>
		
		<div class="card-content">
			<!-- Textarea -->
			<div class="form-group">
				<textarea
					bind:value={promptText}
					on:keypress={handleKeyPress}
					{placeholder}
					class="prompt-textarea"
					disabled={isLoading}
				></textarea>
			</div>
			
			<!-- Dropdowns and Button Row -->
			<div class="controls-row">
				<div class="dropdowns-section">
					{#if showAudienceDropdown || showDepthDropdown}
						<div class="dropdowns-row">
							{#if showAudienceDropdown}
								<div class="dropdown-group">
									<label for="audience" class="dropdown-label">
										Audience
									</label>
									<select
										id="audience"
										bind:value={selectedAudience}
										class="dropdown-select"
										disabled={isLoading}
									>
										{#each audienceOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</div>
							{/if}
							
							{#if showDepthDropdown}
								<div class="dropdown-group">
									<label for="depth" class="dropdown-label">
										Depth
									</label>
									<select
										id="depth"
										bind:value={selectedDepth}
										class="dropdown-select"
										disabled={isLoading}
									>
										{#each depthOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</div>
							{/if}
						</div>
					{/if}
				</div>
				
				<!-- Create Button -->
				<div class="button-section">
					<button
						on:click={handleSubmit}
						class="submit-button {isLoading ? 'loading' : ''}"
						disabled={!promptText.trim() || isLoading}
					>
						{#if isLoading}
							<div class="loading-spinner"></div>
							{loadingText}
						{:else}
							<span class="button-content">
								<span class="button-text">{buttonText}</span>
								<Icon name="arrowRight" size={20} color="white" />
							</span>
						{/if}
					</button>
				</div>
			</div>
			
			<!-- Error Message -->
			{#if errorMessage}
				<div class="error-message">
					<Icon name="alert" size={16} color="currentColor" />
					{errorMessage}
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.new-course-card {
		width: 100%;
	}

	.card-elevated {
		background: white;
		border-radius: var(--radius-xl);
		padding: var(--spacing-6);
		box-shadow: var(--shadow-lg);
		border: 1px solid var(--color-gray-200);
		transition: all 0.2s ease;
	}

	.card-elevated:hover {
		box-shadow: var(--shadow-xl);
	}

	.card-header {
		margin-bottom: var(--spacing-4);
	}

	.card-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--card-title-color, var(--color-gray-800));
		margin: 0 0 var(--spacing-2) 0;
		line-height: 1.3;
	}

	.card-subtitle {
		font-size: 1rem;
		color: var(--card-subtitle-color, var(--color-gray-600));
		margin: 0;
		line-height: 1.5;
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
	}

	.form-group {
		width: 100%;
	}

	.prompt-textarea {
		width: 100%;
		height: 50px;
		min-height: 50px;
		padding: var(--spacing-3);
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-lg);
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.5;
		resize: none;
		transition: all 0.2s ease;
		background: white;
	}

	.prompt-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.prompt-textarea:disabled {
		background: var(--color-gray-50);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.prompt-textarea::placeholder {
		color: var(--color-gray-400);
	}

	.controls-row {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-4);
		flex-wrap: wrap;
	}

	.dropdowns-section {
		flex: 1;
		min-width: 0;
	}

	.dropdowns-row {
		display: flex;
		gap: var(--spacing-3);
		flex-wrap: wrap;
	}

	.dropdown-group {
		flex: 1;
		min-width: 200px;
	}

	.dropdown-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dropdown-label-color, var(--color-gray-700));
		margin-bottom: var(--spacing-1);
	}

	.dropdown-select {
		width: 100%;
		padding: var(--spacing-2) var(--spacing-3);
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		background: white;
		transition: all 0.2s ease;
	}

	.dropdown-select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.dropdown-select:disabled {
		background: var(--color-gray-50);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
		padding: var(--spacing-2) var(--spacing-3);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-error);
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-weight: 500;
		font-size: 0.875rem;
	}

	.button-section {
		flex-shrink: 0;
	}

	.submit-button {
		background: var(--submit-button-bg, #000);
		color: var(--submit-button-color, #fff);
		box-shadow: var(--submit-button-shadow, 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06));
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		white-space: nowrap;
		position: relative;
		overflow: hidden;
	}

	.submit-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.submit-button:hover:not(:disabled) {
		background: var(--submit-button-hover-bg, #333);
		transform: translateY(-1px);
		box-shadow: var(--submit-button-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15));
	}

	.submit-button:hover:not(:disabled)::before {
		opacity: 1;
	}

	.submit-button:active:not(:disabled) {
		transform: translateY(0);
		background: #000;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
	}

	.submit-button:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
	}

	.submit-button:disabled:hover {
		transform: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
	}

	.submit-button.loading {
		cursor: not-allowed;
	}

	.button-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.button-text {
		font-weight: 600;
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.card-elevated {
			padding: var(--spacing-4);
		}

		.card-title {
			font-size: 1.25rem;
		}

		.controls-row {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-3);
		}

		.dropdowns-section {
			flex: none;
		}

		.dropdowns-row {
			flex-direction: column;
			gap: var(--spacing-3);
		}

		.dropdown-group {
			min-width: auto;
		}

		.button-section {
			flex: none;
		}

		.submit-button {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.card-elevated {
			padding: var(--spacing-3);
		}

		.card-title {
			font-size: 1.125rem;
		}

		.submit-button {
			padding: var(--spacing-2) var(--spacing-3);
			font-size: 1rem;
		}
	}
</style> 