import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { simpleLogger } from '$lib/simple-logger';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const action = url.searchParams.get('action');
		const identifier = url.searchParams.get('id') || url.searchParams.get('logId');

		if (action === 'list') {
			// Get list of recent logs
			const limit = parseInt(url.searchParams.get('limit') || '10');
			const logs = simpleLogger.getRecentLogs(limit);
			
			return json({
				success: true,
				logs: logs,
				currentCounter: simpleLogger.getCurrentCounter()
			});
		} else if (action === 'read' && identifier) {
			// Read a specific log by counter number, filename, or ID
			const logContent = simpleLogger.readLog(identifier);
			
			if (logContent) {
				return json({
					success: true,
					content: logContent
				});
			} else {
				return json({
					error: 'Log not found'
				}, { status: 404 });
			}
		} else if (action === 'counter') {
			// Get current counter value
			return json({
				success: true,
				counter: simpleLogger.getCurrentCounter()
			});
		} else if (action === 'reset-counter') {
			// Reset counter (for testing/admin purposes)
			simpleLogger.resetCounter();
			return json({
				success: true,
				message: 'Counter reset to 0'
			});
		} else {
			return json({
				error: 'Invalid action. Use ?action=list, ?action=read&id=<identifier>, ?action=counter, or ?action=reset-counter'
			}, { status: 400 });
		}

	} catch (error) {
		console.error('Simple logs API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}; 