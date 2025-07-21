// LLM Response Logger - Stores all OpenAI API responses to files
import fs from 'fs';
import path from 'path';

export interface LLMRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  user_prompt: string;
  timestamp: string;
}

export interface LLMResponse {
  content: string;
  usage?: any;
  model: string;
  finish_reason?: string;
  raw_response?: any; // Store the complete raw response
}

export interface LLMLogEntry {
  id: string;
  timestamp: string;
  request: LLMRequest;
  response: LLMResponse;
  success: boolean;
  error?: string;
  duration_ms: number;
}

export class LLMLogger {
  private logDir: string;
  private maxLogFiles: number = 100; // Keep last 100 log files

  constructor() {
    // Create logs directory in the project root
    this.logDir = path.join(process.cwd(), 'logs', 'llm');
    this.ensureLogDirectory();
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Generate a unique log entry ID
   */
  private generateLogId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Log an LLM request and response
   */
  async logLLMInteraction(
    request: Omit<LLMRequest, 'timestamp'>,
    response: LLMResponse,
    success: boolean,
    error?: string,
    duration_ms: number = 0
  ): Promise<string> {
    const logId = this.generateLogId();
    const timestamp = new Date().toISOString();

    const logEntry: LLMLogEntry = {
      id: logId,
      timestamp,
      request: {
        ...request,
        timestamp
      },
      response,
      success,
      error,
      duration_ms
    };

    // Save to individual log file
    const logFileName = `${logId}.json`;
    const logFilePath = path.join(this.logDir, logFileName);
    
    try {
      fs.writeFileSync(logFilePath, JSON.stringify(logEntry, null, 2));
      console.log(`📝 LLM Response logged: ${logFileName}`);
    } catch (err) {
      console.error('Failed to write LLM log file:', err);
    }

    // Also append to a daily log file for easier browsing
    const dailyLogFileName = `llm-${new Date().toISOString().split('T')[0]}.jsonl`;
    const dailyLogFilePath = path.join(this.logDir, dailyLogFileName);
    
    try {
      fs.appendFileSync(dailyLogFilePath, JSON.stringify(logEntry) + '\n');
    } catch (err) {
      console.error('Failed to append to daily log file:', err);
    }

    // Clean up old log files
    this.cleanupOldLogs();

    return logId;
  }

  /**
   * Log just the response content to a simple text file for easy reading
   */
  async logResponseContent(
    userPrompt: string,
    responseContent: string,
    model: string = 'unknown'
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `response-${timestamp}.txt`;
    const filePath = path.join(this.logDir, fileName);

    // Clean and format the content for better readability
    const cleanContent = this.formatResponseContent(responseContent);
    const cleanPrompt = this.formatPromptContent(userPrompt);

    const content = `=== LLM Response Log ===
Timestamp: ${new Date().toISOString()}
Model: ${model}

=== User Prompt ===
${cleanPrompt}

=== AI Response ===
${cleanContent}

=== End Response ===
`;

    try {
      fs.writeFileSync(filePath, content);
      console.log(`📄 Response content logged: ${fileName}`);
      return fileName;
    } catch (err) {
      console.error('Failed to write response content file:', err);
      return '';
    }
  }

  /**
   * Format response content for better readability
   */
  private formatResponseContent(content: string): string {
    if (!content) return '(No content)';
    
    // If it's JSON, try to format it nicely
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not JSON, return as is
      return content;
    }
  }

  /**
   * Format prompt content for better readability
   */
  private formatPromptContent(prompt: string): string {
    if (!prompt) return '(No prompt)';
    
    // Truncate very long prompts
    if (prompt.length > 1000) {
      return prompt.substring(0, 1000) + '\n\n... (truncated)';
    }
    
    return prompt;
  }

  /**
   * Get all log entries for a specific date
   */
  getLogsForDate(date: string): LLMLogEntry[] {
    const dailyLogFileName = `llm-${date}.jsonl`;
    const dailyLogFilePath = path.join(this.logDir, dailyLogFileName);
    
    if (!fs.existsSync(dailyLogFilePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(dailyLogFilePath, 'utf-8');
      return content
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (err) {
      console.error('Failed to read daily log file:', err);
      return [];
    }
  }

  /**
   * Get the latest log entries
   */
  getLatestLogs(limit: number = 10): LLMLogEntry[] {
    const files = fs.readdirSync(this.logDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    const logs: LLMLogEntry[] = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.logDir, file), 'utf-8');
        logs.push(JSON.parse(content));
      } catch (err) {
        console.error(`Failed to read log file ${file}:`, err);
      }
    }

    return logs;
  }

  /**
   * Get statistics about LLM usage
   */
  getStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    totalTokens: number;
    models: Record<string, number>;
  } {
    const today = new Date().toISOString().split('T')[0];
    const logs = this.getLogsForDate(today);

    const stats = {
      totalRequests: logs.length,
      successfulRequests: logs.filter(log => log.success).length,
      failedRequests: logs.filter(log => !log.success).length,
      averageResponseTime: 0,
      totalTokens: 0,
      models: {} as Record<string, number>
    };

    if (logs.length > 0) {
      const successfulLogs = logs.filter(log => log.success);
      stats.averageResponseTime = successfulLogs.reduce((sum, log) => sum + log.duration_ms, 0) / successfulLogs.length;
      
      // Calculate total tokens with flexible usage structure
      stats.totalTokens = successfulLogs.reduce((sum, log) => {
        const usage = log.response.usage;
        if (usage?.total_tokens) return sum + usage.total_tokens;
        if (usage?.completion_tokens && usage?.prompt_tokens) return sum + usage.completion_tokens + usage.prompt_tokens;
        if (typeof usage === 'number') return sum + usage;
        return sum;
      }, 0);
      
      // Count models
      successfulLogs.forEach(log => {
        const model = log.response.model || 'unknown';
        stats.models[model] = (stats.models[model] || 0) + 1;
      });
    }

    return stats;
  }

  /**
   * Clean up old log files to prevent disk space issues
   */
  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length > this.maxLogFiles) {
        const filesToDelete = files.slice(this.maxLogFiles);
        for (const file of filesToDelete) {
          fs.unlinkSync(path.join(this.logDir, file));
        }
        console.log(`🧹 Cleaned up ${filesToDelete.length} old log files`);
      }
    } catch (err) {
      console.error('Failed to cleanup old logs:', err);
    }
  }

  /**
   * Export all logs as a single JSON file
   */
  exportAllLogs(): string {
    const exportFileName = `llm-export-${new Date().toISOString().split('T')[0]}.json`;
    const exportFilePath = path.join(this.logDir, exportFileName);

    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.json') && !file.startsWith('llm-export-'))
        .sort();

      const allLogs: LLMLogEntry[] = [];
      
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.logDir, file), 'utf-8');
          allLogs.push(JSON.parse(content));
        } catch (err) {
          console.error(`Failed to read log file ${file}:`, err);
        }
      }

      fs.writeFileSync(exportFilePath, JSON.stringify(allLogs, null, 2));
      console.log(`📦 Exported ${allLogs.length} log entries to ${exportFileName}`);
      return exportFileName;
    } catch (err) {
      console.error('Failed to export logs:', err);
      return '';
    }
  }
}

// Create a singleton instance
export const llmLogger = new LLMLogger();

/**
 * Utility function to wrap OpenAI API calls with logging
 */
export async function logOpenAIRequest(
  openAIRequest: any,
  userPrompt: string,
  apiCall: () => Promise<any>
): Promise<any> {
  const startTime = Date.now();
  
  try {
    const response = await apiCall();
    const duration = Date.now() - startTime;

    // Parse the response if it's a fetch Response object
    let responseData: any;
    if (response && typeof response.json === 'function') {
      // It's a fetch Response object, parse it
      responseData = await response.json();
    } else {
      // It's already parsed data
      responseData = response;
    }

    // Extract response data with flexible structure handling
    let content = '';
    let model = 'unknown';
    let finish_reason = undefined;
    let usage = undefined;

    // Try to extract content from various possible response structures
    if (responseData?.choices?.[0]?.message?.content) {
      content = responseData.choices[0].message.content;
    } else if (responseData?.content) {
      content = responseData.content;
    } else if (responseData?.text) {
      content = responseData.text;
    } else if (responseData?.message) {
      content = responseData.message;
    } else if (typeof responseData === 'string') {
      content = responseData;
    } else {
      content = JSON.stringify(responseData, null, 2);
    }

    // Try to extract model from various possible locations
    if (responseData?.model) {
      model = responseData.model;
    } else if (responseData?.model_name) {
      model = responseData.model_name;
    }

    // Try to extract finish reason
    if (responseData?.choices?.[0]?.finish_reason) {
      finish_reason = responseData.choices[0].finish_reason;
    } else if (responseData?.finish_reason) {
      finish_reason = responseData.finish_reason;
    }

    // Try to extract usage information
    if (responseData?.usage) {
      usage = responseData.usage;
    }

    const logResponseData: LLMResponse = {
      content,
      usage,
      model,
      finish_reason,
      raw_response: responseData // Store the complete raw response for debugging
    };

    // Log the interaction
    await llmLogger.logLLMInteraction(
      {
        model: openAIRequest.model,
        messages: openAIRequest.messages,
        max_tokens: openAIRequest.max_tokens,
        temperature: openAIRequest.temperature,
        user_prompt: userPrompt
      },
      logResponseData,
      true,
      undefined,
      duration
    );

    // Also log the response content separately for easy reading
    await llmLogger.logResponseContent(userPrompt, logResponseData.content, logResponseData.model);

    return responseData;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log the failed interaction
    await llmLogger.logLLMInteraction(
      {
        model: openAIRequest.model,
        messages: openAIRequest.messages,
        max_tokens: openAIRequest.max_tokens,
        temperature: openAIRequest.temperature,
        user_prompt: userPrompt
      },
      {
        content: `Error: ${errorMessage}`,
        model: openAIRequest.model,
        raw_response: { error: errorMessage }
      },
      false,
      errorMessage,
      duration
    );

    throw error;
  }
} 