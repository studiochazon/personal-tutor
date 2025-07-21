<script lang="ts">
	import { onMount } from 'svelte';

	let stats: any = null;
	let logs: any[] = [];
	let loading = false;
	let error = '';
	let selectedDate = new Date().toISOString().split('T')[0];

	async function loadStats() {
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/logs/llm?action=stats');
			const data = await response.json();
			
			if (data.success) {
				stats = data.stats;
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to load stats';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function loadLogs() {
		loading = true;
		error = '';
		
		try {
			const response = await fetch(`/api/logs/llm?action=logs&date=${selectedDate}&limit=20`);
			const data = await response.json();
			
			if (data.success) {
				logs = data.logs;
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Failed to load logs';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function exportLogs() {
		try {
			const response = await fetch('/api/logs/llm?action=export');
			const data = await response.json();
			
			if (data.success) {
				alert(`Logs exported to: ${data.exportFile}`);
			} else {
				alert('Failed to export logs');
			}
		} catch (err) {
			alert('Failed to export logs');
			console.error(err);
		}
	}

	function formatDuration(ms: number): string {
		return `${Math.round(ms)}ms`;
	}

	function formatTokens(tokens: number): string {
		if (tokens >= 1000) {
			return `${(tokens / 1000).toFixed(1)}k`;
		}
		return tokens.toString();
	}

	function formatTimestamp(timestamp: string): string {
		return new Date(timestamp).toLocaleString();
	}

	onMount(() => {
		loadStats();
		loadLogs();
	});
</script>

<svelte:head>
	<title>LLM Logs - Personal Tutor AI</title>
</svelte:head>

<div class="container">
	<div class="header">
		<h1>LLM Response Logs</h1>
		<p>Monitor and analyze AI responses and usage statistics</p>
	</div>

	{#if error}
		<div class="error-message">
			{error}
		</div>
	{/if}

	<div class="stats-section">
		<h2>Today's Statistics</h2>
		{#if loading && !stats}
			<div class="loading">Loading stats...</div>
		{:else if stats}
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-value">{stats.totalRequests}</div>
					<div class="stat-label">Total Requests</div>
				</div>
				<div class="stat-card">
					<div class="stat-value success">{stats.successfulRequests}</div>
					<div class="stat-label">Successful</div>
				</div>
				<div class="stat-card">
					<div class="stat-value error">{stats.failedRequests}</div>
					<div class="stat-label">Failed</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{formatDuration(stats.averageResponseTime)}</div>
					<div class="stat-label">Avg Response Time</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{formatTokens(stats.totalTokens)}</div>
					<div class="stat-label">Total Tokens</div>
				</div>
			</div>

			{#if Object.keys(stats.models).length > 0}
				<div class="models-section">
					<h3>Models Used</h3>
					<div class="models-list">
						{#each Object.entries(stats.models) as [model, count]}
							<div class="model-item">
								<span class="model-name">{model}</span>
								<span class="model-count">{count}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<div class="logs-section">
		<div class="logs-header">
			<h2>Response Logs</h2>
			<div class="logs-controls">
				<input 
					type="date" 
					bind:value={selectedDate} 
					on:change={loadLogs}
					class="date-input"
				/>
				<button on:click={loadLogs} disabled={loading} class="refresh-btn">
					{loading ? 'Loading...' : 'Refresh'}
				</button>
				<button on:click={exportLogs} class="export-btn">
					Export All
				</button>
			</div>
		</div>

		{#if loading && logs.length === 0}
			<div class="loading">Loading logs...</div>
		{:else if logs.length === 0}
			<div class="no-logs">No logs found for {selectedDate}</div>
		{:else}
			<div class="logs-list">
				{#each logs as log}
					<div class="log-item">
						<div class="log-header">
							<span class="log-time">{formatTimestamp(log.timestamp)}</span>
							<span class="log-status {log.success ? 'success' : 'error'}">
								{log.success ? '✅' : '❌'}
							</span>
							<span class="log-model">{log.response.model}</span>
							<span class="log-duration">{formatDuration(log.duration_ms)}</span>
						</div>
						<div class="log-content">
							<div class="log-prompt">
								<strong>Prompt:</strong> {log.request.user_prompt.substring(0, 100)}...
							</div>
							<div class="log-response">
								<strong>Response:</strong> {log.response.content.substring(0, 200)}...
							</div>
							{#if log.error}
								<div class="log-error">
									<strong>Error:</strong> {log.error}
								</div>
							{/if}
							{#if log.response.usage}
								<div class="log-usage">
									Tokens: {log.response.usage.prompt_tokens} + {log.response.usage.completion_tokens} = {log.response.usage.total_tokens}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	.header {
		text-align: center;
		margin-bottom: 30px;
	}

	.header h1 {
		color: var(--color-gray-800);
		margin-bottom: var(--spacing-2);
	}

	.header p {
		color: var(--color-gray-500);
		margin: 0;
	}

	.error-message {
		background-color: var(--color-error-light);
		color: var(--color-error-text);
		padding: var(--spacing-3);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-5);
		border: 1px solid var(--color-error);
	}

	.stats-section {
		margin-bottom: 40px;
	}

	.stats-section h2 {
		color: var(--color-gray-800);
		margin-bottom: var(--spacing-5);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-5);
		margin-bottom: var(--spacing-5);
	}

	.stat-card {
		background: white;
		padding: var(--spacing-5);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-base);
		text-align: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: var(--color-gray-800);
		margin-bottom: var(--spacing-2);
	}

	.stat-value.success {
		color: var(--color-success);
	}

	.stat-value.error {
		color: var(--color-error);
	}

	.stat-label {
		color: var(--color-gray-500);
		font-size: 0.9rem;
	}

	.models-section {
		background: white;
		padding: var(--spacing-5);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-base);
	}

	.models-section h3 {
		margin-bottom: var(--spacing-4);
		color: var(--color-gray-800);
	}

	.models-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-3);
	}

	.model-item {
		background: var(--color-gray-50);
		padding: var(--spacing-2) var(--spacing-3);
		border-radius: var(--radius-base);
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.model-name {
		font-weight: 500;
		color: var(--color-gray-800);
	}

	.model-count {
		background: var(--color-primary);
		color: white;
		padding: 2px var(--spacing-2);
		border-radius: var(--radius-full);
		font-size: 0.8rem;
	}

	.logs-section {
		background: white;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-base);
		overflow: hidden;
	}

	.logs-header {
		padding: var(--spacing-5);
		border-bottom: 1px solid var(--color-gray-200);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-4);
	}

	.logs-header h2 {
		margin: 0;
		color: var(--color-gray-800);
	}

	.logs-controls {
		display: flex;
		gap: var(--spacing-3);
		align-items: center;
	}

	.date-input {
		padding: var(--spacing-2) var(--spacing-3);
		border: 1px solid var(--color-gray-300);
		border-radius: var(--radius-base);
	}

	.refresh-btn, .export-btn {
		padding: var(--spacing-2) var(--spacing-4);
		border: none;
		border-radius: var(--radius-base);
		cursor: pointer;
		font-size: 0.9rem;
	}

	.refresh-btn {
		background: var(--color-primary);
		color: white;
	}

	.refresh-btn:hover {
		background: var(--color-primary-dark);
	}

	.refresh-btn:disabled {
		background: var(--color-gray-400);
		cursor: not-allowed;
	}

	.export-btn {
		background: var(--color-success);
		color: white;
	}

	.export-btn:hover {
		background: var(--color-success-dark);
	}

	.loading {
		padding: var(--spacing-10);
		text-align: center;
		color: var(--color-gray-500);
	}

	.no-logs {
		padding: var(--spacing-10);
		text-align: center;
		color: var(--color-gray-500);
	}

	.logs-list {
		max-height: 600px;
		overflow-y: auto;
	}

	.log-item {
		padding: var(--spacing-4) var(--spacing-5);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.log-item:last-child {
		border-bottom: none;
	}

	.log-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-4);
		margin-bottom: var(--spacing-3);
		font-size: 0.9rem;
	}

	.log-time {
		color: var(--color-gray-500);
		font-family: monospace;
	}

	.log-status {
		font-size: 1.2rem;
	}

	.log-status.success {
		color: var(--color-success);
	}

	.log-status.error {
		color: var(--color-error);
	}

	.log-model {
		background: var(--color-gray-50);
		padding: 2px var(--spacing-2);
		border-radius: var(--radius-base);
		font-size: 0.8rem;
		color: var(--color-gray-500);
	}

	.log-duration {
		color: var(--color-gray-500);
		font-family: monospace;
	}

	.log-content {
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.log-prompt, .log-response, .log-error, .log-usage {
		margin-bottom: var(--spacing-2);
	}

	.log-prompt strong, .log-response strong, .log-error strong {
		color: var(--color-gray-800);
	}

	.log-error {
		color: var(--color-error);
	}

	.log-usage {
		color: var(--color-gray-500);
		font-size: 0.8rem;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		.logs-header {
			flex-direction: column;
			align-items: stretch;
		}

		.logs-controls {
			flex-direction: column;
		}

		.log-header {
			flex-wrap: wrap;
			gap: 8px;
		}

		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}
	}
</style> 