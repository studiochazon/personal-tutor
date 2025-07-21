import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { llmLogger } from '$lib/llm-logger';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchParams = url.searchParams;
		const action = searchParams.get('action') || 'stats';
		const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
		const limit = parseInt(searchParams.get('limit') || '10');

		switch (action) {
			case 'stats':
				const stats = llmLogger.getStats();
				return json({
					success: true,
					stats,
					date
				});

			case 'logs':
				const logs = llmLogger.getLogsForDate(date);
				return json({
					success: true,
					logs: logs.slice(0, limit),
					total: logs.length,
					date
				});

			case 'latest':
				const latestLogs = llmLogger.getLatestLogs(limit);
				return json({
					success: true,
					logs: latestLogs,
					total: latestLogs.length
				});

			case 'export':
				const exportFileName = llmLogger.exportAllLogs();
				return json({
					success: true,
					exportFile: exportFileName,
					message: 'Logs exported successfully'
				});

			default:
				return json(
					{ 
						success: false, 
						error: 'Invalid action. Use: stats, logs, latest, or export' 
					},
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error('Error fetching LLM logs:', error);
		return json(
			{ 
				success: false, 
				error: 'Failed to fetch logs' 
			},
			{ status: 500 }
		);
	}
}; 