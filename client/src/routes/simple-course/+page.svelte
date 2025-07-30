<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let userPrompt = '';
	let isLoading = false;
	let errorMessage = '';
	let response = '';
	let logId = '';
	let model = '';

	// Check authentication on mount
	onMount(() => {
		const token = localStorage.getItem('authToken');
		if (!token) {
			goto('/auth/login');
		}
	});

	async function createSimpleCourse() {
		if (!userPrompt.trim()) {
			errorMessage = 'Please enter a course prompt';
			return;
		}

		isLoading = true;
		errorMessage = '';
		response = '';
		logId = '';
		model = '';

		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				goto('/auth/login');
				return;
			}

			const res = await fetch('/api/start/simple-course', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ userPrompt })
			});

			if (!res.ok) {
				const errorData = await res.json();
				if (res.status === 401) {
					// Authentication error - redirect to login
					goto('/auth/login');
					return;
				}
				throw new Error(errorData.error || 'Failed to create course');
			}

			const data = await res.json();
			
			if (data.success) {
				response = data.response;
				logId = data.logId;
				model = data.model;
				
				// Show a notification with the filename format
				const sanitizedPrompt = userPrompt
					.toLowerCase()
					.replace(/[^a-z0-9\s]/g, '')
					.trim()
					.split(/\s+/)
					.slice(0, 3)
					.join('-')
					.substring(0, 30);
				console.log(`📁 Response saved as: [next-number]-${sanitizedPrompt}.txt`);
			} else {
				throw new Error('Course creation failed');
			}

		} catch (error) {
			console.error('Error creating simple course:', error);
			errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			createSimpleCourse();
		}
	}

	function clearResponse() {
		response = '';
		logId = '';
		model = '';
		errorMessage = '';
	}
</script>

<svelte:head>
	<title>Simple Course Creation - Personal Tutor</title>
</svelte:head>

<div class="container">
	<header>
		<h1>🚀 Simple Course Creation</h1>
		<p>Generate course content with AI and web search capabilities</p>
	</header>

	<div class="creation-section">
		<div class="input-section">
			<label for="prompt">Course Prompt</label>
			<textarea
				id="prompt"
				bind:value={userPrompt}
				on:keypress={handleKeyPress}
				placeholder="Enter your course idea... (e.g., 'Create a course about sustainable energy')"
				rows="4"
				disabled={isLoading}
			></textarea>
			
			<div class="button-group">
				<button 
					on:click={createSimpleCourse} 
					disabled={isLoading || !userPrompt.trim()}
					class="primary-button"
				>
					{#if isLoading}
						⏳ Creating Course...
					{:else}
						✨ Create Course
					{/if}
				</button>
				
				{#if response}
					<button 
						on:click={clearResponse}
						class="secondary-button"
					>
						🗑️ Clear
					</button>
				{/if}
			</div>
		</div>

		{#if errorMessage}
			<div class="error-message">
				⚠️ {errorMessage}
			</div>
		{/if}

		{#if response}
			<div class="response-section">
				<div class="response-header">
					<h3>📚 Generated Course Content</h3>
					<div class="metadata">
						{#if model}
							<span class="model-tag">Model: {model}</span>
						{/if}
						{#if logId}
							<span class="log-tag">Log ID: {logId}</span>
						{/if}
					</div>
				</div>
				
				<div class="response-content">
					{@html response.replace(/\n/g, '<br>')}
				</div>
			</div>
		{/if}
	</div>

	<div class="info-section">
		<h3>ℹ️ About Simple Course Creation</h3>
		<ul>
			<li><strong>Web Search Enabled:</strong> Uses OpenAI's web search capabilities for up-to-date information</li>
			<li><strong>Simple Prompt:</strong> Uses a minimal system prompt: "Create a course based on [user prompt]"</li>
			<li><strong>Text Logging:</strong> Responses are saved as simple text files in <code>/llm-logs/simple-response/</code></li>
			<li><strong>Consecutive Numbering:</strong> Files are named like <code>1-sustainable-energy.txt</code>, <code>2-machine-learning.txt</code>, etc.</li>
			<li><strong>Model:</strong> Uses <code>gpt-4o-search-preview</code> for enhanced search capabilities</li>
		</ul>
	</div>
</div>

<style>
	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	header h1 {
		font-size: 2.5rem;
		color: #2563eb;
		margin-bottom: 0.5rem;
	}

	header p {
		color: #6b7280;
		font-size: 1.1rem;
	}

	.creation-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.input-section {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	textarea {
		width: 100%;
		padding: 1rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		line-height: 1.5;
		resize: vertical;
		transition: border-color 0.2s;
	}

	textarea:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	textarea:disabled {
		background-color: #f9fafb;
		cursor: not-allowed;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.primary-button {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.primary-button:hover:not(:disabled) {
		background: #1d4ed8;
	}

	.primary-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.secondary-button {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.secondary-button:hover {
		background: #e5e7eb;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #fecaca;
		margin-top: 1rem;
	}

	.response-section {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 1.5rem;
		margin-top: 2rem;
	}

	.response-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.response-header h3 {
		color: #1e293b;
		margin: 0;
	}

	.metadata {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.model-tag, .log-tag {
		background: #e0e7ff;
		color: #3730a3;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.log-tag {
		background: #d1fae5;
		color: #065f46;
	}

	.response-content {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		line-height: 1.6;
		color: #334155;
	}

	.info-section {
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 12px;
		padding: 1.5rem;
	}

	.info-section h3 {
		color: #0c4a6e;
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.info-section ul {
		color: #0f172a;
		line-height: 1.6;
	}

	.info-section li {
		margin-bottom: 0.5rem;
	}

	.info-section code {
		background: #e0f2fe;
		color: #0c4a6e;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		header h1 {
			font-size: 2rem;
		}

		.response-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.button-group {
			flex-direction: column;
		}
	}
</style> 