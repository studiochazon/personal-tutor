<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	type CreationSystem = 'original' | 'simple';

	let userPrompt = '';
	let selectedSystem: CreationSystem = 'simple';
	let audience = 'beginners';
	let depth = 'comprehensive';
	let isLoading = false;
	let errorMessage = '';

	// Results
	let lastResult: any = null;
	let systemInfo: any = null;

	// Check authentication on mount
	onMount(async () => {
		const token = localStorage.getItem('authToken');
		if (!token) {
			goto('/auth/login');
			return;
		}

		// Load system information
		try {
			const response = await fetch('/api/course-creation');
			if (response.ok) {
				systemInfo = await response.json();
			}
		} catch (error) {
			console.error('Failed to load system info:', error);
		}
	});

	async function createCourse() {
		if (!userPrompt.trim()) {
			errorMessage = 'Please enter a course prompt';
			return;
		}

		isLoading = true;
		errorMessage = '';
		lastResult = null;

		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				goto('/auth/login');
				return;
			}

			console.log(`Creating course with ${selectedSystem} system...`);

			const response = await fetch('/api/course-creation', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					userPrompt,
					system: selectedSystem,
					audience,
					depth
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				if (response.status === 401) {
					goto('/auth/login');
					return;
				}
				throw new Error(errorData.error || 'Failed to create course');
			}

			const result = await response.json();
			lastResult = result;
			
			if (result.success) {
				console.log(`✅ Course created successfully with ${result.system} system`);
				
				// Handle different system responses
				if (result.system === 'original' && result.course) {
					// Original system - redirect to course page
					setTimeout(() => {
						window.location.href = `/courses/${result.course.id}?new=true`;
					}, 2000);
				} else if (result.system === 'simple' && result.logId) {
					// Simple system - show file location
					console.log(`📁 Response saved as: ${result.logId}.txt`);
				}
			} else {
				throw new Error(result.error || 'Course creation failed');
			}

		} catch (error) {
			console.error('Error creating course:', error);
			errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			createCourse();
		}
	}

	function clearResults() {
		lastResult = null;
		errorMessage = '';
	}

	function formatSystemFeatures(features: string[]): string {
		return features.map(f => `• ${f}`).join('\n');
	}
</script>

<svelte:head>
	<title>Course Creator - Personal Tutor AI</title>
</svelte:head>

<div class="container">
	<header>
		<h1>🎯 Course Creator</h1>
		<p>Choose between our two course creation systems and compare the results</p>
	</header>

	{#if systemInfo}
		<div class="systems-info">
			<h2>📋 Available Systems</h2>
			<div class="systems-grid">
				{#each Object.entries(systemInfo.systems) as [key, system]}
					<div class="system-card" class:selected={selectedSystem === key}>
						<h3>{system.name}</h3>
						<p>{system.description}</p>
						<div class="system-details">
							<div class="detail">
								<strong>Model:</strong> {system.model}
							</div>
							<div class="detail">
								<strong>Output:</strong> {system.output}
							</div>
							<div class="features">
								<strong>Features:</strong>
								<ul>
									{#each system.features as feature}
										<li>{feature}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="creation-form">
		<div class="form-section">
			<h2>🚀 Create Your Course</h2>
			
			<div class="form-group">
				<label for="system">Creation System</label>
				<select id="system" bind:value={selectedSystem} disabled={isLoading}>
					<option value="simple">Simple (Web Search + Text Files)</option>
					<option value="original">Original (Database + Complex JSON)</option>
				</select>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="audience">Target Audience</label>
					<select id="audience" bind:value={audience} disabled={isLoading}>
						<option value="beginners">Beginners</option>
						<option value="intermediate">Intermediate</option>
						<option value="advanced">Advanced</option>
					</select>
				</div>

				<div class="form-group">
					<label for="depth">Course Depth</label>
					<select id="depth" bind:value={depth} disabled={isLoading}>
						<option value="overview">Overview</option>
						<option value="comprehensive">Comprehensive</option>
						<option value="deep-dive">Deep Dive</option>
					</select>
				</div>
			</div>

			<div class="form-group">
				<label for="prompt">Course Prompt</label>
				<textarea
					id="prompt"
					bind:value={userPrompt}
					on:keypress={handleKeyPress}
					placeholder="Enter your course idea... (e.g., 'Create a course about Python programming for data science')"
					rows="4"
					disabled={isLoading}
				></textarea>
			</div>
			
			<div class="button-group">
				<button 
					on:click={createCourse} 
					disabled={isLoading || !userPrompt.trim()}
					class="primary-button"
				>
					{#if isLoading}
						⏳ Creating with {selectedSystem} system...
					{:else}
						✨ Create Course ({selectedSystem})
					{/if}
				</button>
				
				{#if lastResult}
					<button 
						on:click={clearResults}
						class="secondary-button"
					>
						🗑️ Clear Results
					</button>
				{/if}
			</div>
		</div>

		{#if errorMessage}
			<div class="error-message">
				⚠️ {errorMessage}
			</div>
		{/if}

		{#if lastResult}
			<div class="results-section">
				<div class="result-header">
					<h3>📊 Results from {lastResult.system} System</h3>
					<div class="result-metadata">
						<span class="system-tag system-{lastResult.system}">{lastResult.system}</span>
						<span class="timestamp">{new Date(lastResult.timestamp).toLocaleString()}</span>
					</div>
				</div>
				
				{#if lastResult.success}
					<div class="success-result">
						{#if lastResult.system === 'original'}
							<div class="original-result">
								<h4>📚 Course Created in Database</h4>
								<div class="course-info">
									<p><strong>Title:</strong> {lastResult.course.title}</p>
									<p><strong>ID:</strong> {lastResult.course.id}</p>
									<p><strong>Lessons:</strong> {lastResult.course.lessons?.length || 0}</p>
									<p><strong>Redirecting to course page...</strong></p>
								</div>
							</div>
						{:else if lastResult.system === 'simple'}
							<div class="simple-result">
								<h4>📁 Response Saved to File</h4>
								<div class="file-info">
									<p><strong>Log ID:</strong> {lastResult.logId}</p>
									<p><strong>Model:</strong> {lastResult.model}</p>
									<p><strong>Location:</strong> <code>/llm-logs/simple-response/{lastResult.logId}.txt</code></p>
								</div>
								
								{#if lastResult.response}
									<div class="response-preview">
										<h5>📖 Response Preview</h5>
										<div class="response-content">
											{@html lastResult.response.replace(/\n/g, '<br>').substring(0, 500)}
											{#if lastResult.response.length > 500}
												<span class="truncated">... (truncated)</span>
											{/if}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<div class="error-result">
						<h4>❌ Creation Failed</h4>
						<p>{lastResult.error}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
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

	.systems-info {
		margin-bottom: 3rem;
	}

	.systems-info h2 {
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.systems-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.system-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.system-card.selected {
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.system-card h3 {
		color: #1f2937;
		margin-top: 0;
		margin-bottom: 0.5rem;
	}

	.system-card p {
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.system-details .detail {
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.features ul {
		margin: 0.5rem 0 0 1rem;
		font-size: 0.9rem;
	}

	.features li {
		margin-bottom: 0.25rem;
		color: #4b5563;
	}

	.creation-form {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.form-section h2 {
		color: #1f2937;
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: block;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	select, textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	select:focus, textarea:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	textarea {
		resize: vertical;
		line-height: 1.5;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
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
		margin-top: 1.5rem;
	}

	.results-section {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 1.5rem;
		margin-top: 2rem;
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.result-header h3 {
		color: #1e293b;
		margin: 0;
	}

	.result-metadata {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.system-tag {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	.system-original {
		background: #ddd6fe;
		color: #5b21b6;
	}

	.system-simple {
		background: #d1fae5;
		color: #065f46;
	}

	.timestamp {
		color: #6b7280;
		font-size: 0.8rem;
	}

	.success-result {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.course-info, .file-info {
		margin-top: 1rem;
	}

	.course-info p, .file-info p {
		margin: 0.5rem 0;
		color: #374151;
	}

	.file-info code {
		background: #f1f5f9;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.response-preview {
		margin-top: 1.5rem;
	}

	.response-preview h5 {
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.response-content {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		line-height: 1.6;
		color: #374151;
		max-height: 300px;
		overflow-y: auto;
	}

	.truncated {
		color: #6b7280;
		font-style: italic;
	}

	.error-result {
		background: #fef2f2;
		color: #dc2626;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #fecaca;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.systems-grid {
			grid-template-columns: 1fr;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.result-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.button-group {
			flex-direction: column;
		}
	}
</style>