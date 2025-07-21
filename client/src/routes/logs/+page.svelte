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
		color: #333;
		margin-bottom: 8px;
	}

	.header p {
		color: #666;
		margin: 0;
	}

	.error-message {
		background-color: #fee;
		color: #c33;
		padding: 12px;
		border-radius: 6px;
		margin-bottom: 20px;
		border: 1px solid #fcc;
	}

	.stats-section {
		margin-bottom: 40px;
	}

	.stats-section h2 {
		color: #333;
		margin-bottom: 20px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin-bottom: 20px;
	}

	.stat-card {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		text-align: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: #333;
		margin-bottom: 8px;
	}

	.stat-value.success {
		color: #28a745;
	}

	.stat-value.error {
		color: #dc3545;
	}

	.stat-label {
		color: #666;
		font-size: 0.9rem;
	}

	.models-section {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.models-section h3 {
		margin-bottom: 15px;
		color: #333;
	}

	.models-list {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.model-item {
		background: #f8f9fa;
		padding: 8px 12px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.model-name {
		font-weight: 500;
		color: #333;
	}

	.model-count {
		background: #007bff;
		color: white;
		padding: 2px 6px;
		border-radius: 10px;
		font-size: 0.8rem;
	}

	.logs-section {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		overflow: hidden;
	}

	.logs-header {
		padding: 20px;
		border-bottom: 1px solid #eee;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 15px;
	}

	.logs-header h2 {
		margin: 0;
		color: #333;
	}

	.logs-controls {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.date-input {
		padding: 8px 12px;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.refresh-btn, .export-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.refresh-btn {
		background: #007bff;
		color: white;
	}

	.refresh-btn:hover {
		background: #0056b3;
	}

	.refresh-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.export-btn {
		background: #28a745;
		color: white;
	}

	.export-btn:hover {
		background: #1e7e34;
	}

	.loading {
		padding: 40px;
		text-align: center;
		color: #666;
	}

	.no-logs {
		padding: 40px;
		text-align: center;
		color: #666;
	}

	.logs-list {
		max-height: 600px;
		overflow-y: auto;
	}

	.log-item {
		padding: 15px 20px;
		border-bottom: 1px solid #eee;
	}

	.log-item:last-child {
		border-bottom: none;
	}

	.log-header {
		display: flex;
		align-items: center;
		gap: 15px;
		margin-bottom: 10px;
		font-size: 0.9rem;
	}

	.log-time {
		color: #666;
		font-family: monospace;
	}

	.log-status {
		font-size: 1.2rem;
	}

	.log-status.success {
		color: #28a745;
	}

	.log-status.error {
		color: #dc3545;
	}

	.log-model {
		background: #f8f9fa;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.8rem;
		color: #666;
	}

	.log-duration {
		color: #666;
		font-family: monospace;
	}

	.log-content {
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.log-prompt, .log-response, .log-error, .log-usage {
		margin-bottom: 8px;
	}

	.log-prompt strong, .log-response strong, .log-error strong {
		color: #333;
	}

	.log-error {
		color: #dc3545;
	}

	.log-usage {
		color: #666;
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