<script lang="ts">
	import { Icon } from '$lib/components/ui';
	
	export let title: string = "Create Your Course";
	export let subtitle: string = "Describe what you want to teach and our AI will create a comprehensive course for you";
	export let placeholder: string = "e.g., I want to create a course about Python programming for beginners, covering variables, functions, and basic data structures...";
	export let buttonText: string = "Create Course";
	export let loadingText: string = "Creating Course...";
	export let showAudienceDropdown: boolean = false;
	export let showDepthDropdown: boolean = false;
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

<div class="prompt-section">
	<div class="prompt-header">
		<h2 class="prompt-title">{title}</h2>
		<p class="prompt-subtitle">{subtitle}</p>
	</div>
	
	<div class="prompt-form">
		<div class="form-group">
			<label for="prompt-input" class="form-label">What would you like to teach?</label>
			<textarea
				id="prompt-input"
				bind:value={promptText}
				on:keypress={handleKeyPress}
				{placeholder}
				disabled={isLoading}
				rows="6"
				class="prompt-input"
			></textarea>
		</div>
		
		{#if showAudienceDropdown || showDepthDropdown}
			<div class="dropdowns-row">
				{#if showAudienceDropdown}
					<div class="dropdown-group">
						<label for="audience-select" class="dropdown-label">Audience</label>
						<select
							id="audience-select"
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
						<label for="depth-select" class="dropdown-label">Depth</label>
						<select
							id="depth-select"
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
		
		{#if errorMessage}
			<div class="error-message">
				<Icon name="alert" size={16} color="currentColor" />
				{errorMessage}
			</div>
		{/if}
		
		<button 
			on:click={handleSubmit} 
			disabled={!promptText.trim() || isLoading}
			class="submit-button {isLoading ? 'loading' : ''}"
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
	
	<div class="prompt-info">
		<div class="info-section">
			<h3 class="info-title">How it works</h3>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<div class="step-content">
						<h4>Describe Your Topic</h4>
						<p>Tell us what you want to teach, your target audience, and any specific requirements.</p>
					</div>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<div class="step-content">
						<h4>AI Generates Course</h4>
						<p>Our AI creates a comprehensive course structure with lessons, examples, and exercises.</p>
					</div>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<div class="step-content">
						<h4>Review & Customize</h4>
						<p>Review your course and make any adjustments to fit your needs perfectly.</p>
					</div>
				</div>
			</div>
		</div>
		
		<div class="examples-section">
			<h4 class="examples-title">Example prompts:</h4>
			<ul class="examples-list">
				<li>"Create a beginner-friendly course on JavaScript fundamentals"</li>
				<li>"Design a course about digital marketing for small business owners"</li>
				<li>"Make a course teaching photography basics with practical exercises"</li>
				<li>"Create an advanced course on machine learning algorithms"</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.prompt-section {
		background: white;
		border-radius: 1.5rem;
		padding: 3rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border: 1px solid var(--color-gray-200);
		max-width: 1000px;
		margin: 0 auto;
	}

	.prompt-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.prompt-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-gray-900);
		margin-bottom: 1rem;
	}

	.prompt-subtitle {
		font-size: 1.125rem;
		color: var(--color-gray-600);
		line-height: 1.6;
	}

	.prompt-form {
		margin-bottom: 3rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: var(--color-gray-800);
		font-size: 1.125rem;
	}

	.prompt-input {
		width: 100%;
		border: 2px solid var(--color-gray-300);
		border-radius: 0.75rem;
		padding: 1rem;
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.5;
		resize: vertical;
		transition: all 0.2s ease;
		background: white;
	}

	.prompt-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.prompt-input:disabled {
		background: var(--color-gray-50);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.dropdowns-row {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.dropdown-group {
		flex: 1;
	}

	.dropdown-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-gray-700);
		margin-bottom: 0.5rem;
	}

	.dropdown-select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid var(--color-gray-300);
		border-radius: 0.5rem;
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
		background: var(--color-error-light);
		color: var(--color-error-text);
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid var(--color-error);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
	}

	.submit-button {
		width: 100%;
		padding: 1rem 2rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 0.75rem;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.submit-button:hover:not(:disabled) {
		background: var(--color-primary-dark);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.button-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.loading-spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.prompt-info {
		background: var(--color-gray-50);
		border-radius: 1rem;
		padding: 2rem;
	}

	.info-section {
		margin-bottom: 2rem;
	}

	.info-title {
		margin: 0 0 1.5rem 0;
		color: var(--color-gray-900);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.step-number {
		width: 2rem;
		height: 2rem;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.step-content h4 {
		margin: 0 0 0.25rem 0;
		color: var(--color-gray-900);
		font-size: 1rem;
		font-weight: 600;
	}

	.step-content p {
		margin: 0;
		color: var(--color-gray-600);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.examples-section {
		border-top: 1px solid var(--color-gray-200);
		padding-top: 1.5rem;
	}

	.examples-title {
		margin: 0 0 1rem 0;
		color: var(--color-gray-900);
		font-size: 1rem;
		font-weight: 600;
	}

	.examples-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.examples-list li {
		color: var(--color-gray-600);
		font-size: 0.875rem;
		padding-left: 1rem;
		position: relative;
	}

	.examples-list li::before {
		content: "•";
		color: var(--color-primary);
		font-weight: bold;
		position: absolute;
		left: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.prompt-section {
			padding: 2rem;
			margin: 1rem;
		}

		.prompt-title {
			font-size: 1.75rem;
		}

		.dropdowns-row {
			flex-direction: column;
			gap: 1rem;
		}

		.steps {
			gap: 1rem;
		}

		.step {
			gap: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.prompt-section {
			padding: 1.5rem;
		}

		.prompt-title {
			font-size: 1.5rem;
		}

		.submit-button {
			padding: 0.875rem 1.5rem;
			font-size: 1rem;
		}
	}
</style> 