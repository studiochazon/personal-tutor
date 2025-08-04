// Enhanced LLM Response Logger with better organization
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
  api_type?: string; // New: track API type
  topic?: string; // New: track topic
}

export class EnhancedLLMLogger {
  private baseLogDir: string;
  private maxLogFiles: number = 100; // Keep last 100 log files per category
  private counters: Map<string, number> = new Map(); // Track counters per API type

  constructor() {
    // Create logs directory in the project root
    this.baseLogDir = path.join(process.cwd(), 'logs', 'llm');
    this.ensureLogDirectory();
    this.loadCounters();
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.baseLogDir)) {
      fs.mkdirSync(this.baseLogDir, { recursive: true });
    }

    // Create subdirectories for different API types
    const subdirs = [
      'keyword_generation',
      'lesson_youtube_discovery', 
      'keyword_video_discovery',
      'course_planning',
      'content_generation',
      'video_search',
      'artifact_generation',
      'artifact_prioritization',
      'course_plan_refinement',
      'video_verification',
      'orchestrator_v3',
      'daily'
    ];

    subdirs.forEach(dir => {
      const dirPath = path.join(this.baseLogDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  /**
   * Load existing counters from files
   */
  private loadCounters(): void {
    const subdirs = [
      'keyword_generation',
      'lesson_youtube_discovery', 
      'keyword_video_discovery',
      'course_planning',
      'content_generation',
      'video_search',
      'artifact_generation',
      'artifact_prioritization',
      'course_plan_refinement',
      'video_verification',
      'orchestrator_v3'
    ];

    subdirs.forEach(apiType => {
      const dirPath = path.join(this.baseLogDir, apiType);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath)
          .filter(file => file.endsWith('.json'))
          .map(file => {
            const match = file.match(/^(\d+)-/);
            return match ? parseInt(match[1]) : 0;
          });
        
        const maxCounter = files.length > 0 ? Math.max(...files) : 0;
        this.counters.set(apiType, maxCounter);
      } else {
        this.counters.set(apiType, 0);
      }
    });
  }

  /**
   * Extract topic from prompt content
   */
  private extractTopic(prompt: string): string {
    // Try to extract course title or main topic
    const courseTitleMatch = prompt.match(/Course Title[:\s]+([^\n]+)/i);
    if (courseTitleMatch) {
      return this.sanitizeFilename(courseTitleMatch[1].trim());
    }

    // Try to extract from keyword cloud
    const keywordMatch = prompt.match(/Primary Keywords[:\s]+([^\n]+)/i);
    if (keywordMatch) {
      const keywords = keywordMatch[1].split(',').map(k => k.trim());
      return this.sanitizeFilename(keywords[0] || 'unknown');
    }

    // Try to extract from lesson titles
    const lessonMatch = prompt.match(/Lesson \d+[:\s]+([^\n]+)/i);
    if (lessonMatch) {
      return this.sanitizeFilename(lessonMatch[1].trim());
    }

    // Fallback: extract first meaningful words
    const words = prompt.split(/\s+/).slice(0, 3).join('-');
    return this.sanitizeFilename(words || 'unknown');
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 50); // Limit length
  }

  /**
   * Get next counter for API type
   */
  private getNextCounter(apiType: string): number {
    const current = this.counters.get(apiType) || 0;
    const next = current + 1;
    this.counters.set(apiType, next);
    return next;
  }

  /**
   * Generate descriptive filename
   */
  private generateDescriptiveFilename(apiType: string, topic: string): string {
    const counter = this.getNextCounter(apiType);
    return `${counter}-${topic}-${apiType.replace(/_/g, '-')}`;
  }

  /**
   * Log an LLM request and response with better organization
   */
  async logLLMInteraction(
    request: Omit<LLMRequest, 'timestamp'>,
    response: LLMResponse,
    success: boolean,
    error?: string,
    duration_ms: number = 0,
    apiType: string = 'unknown'
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const topic = this.extractTopic(request.user_prompt);
    const logId = this.generateDescriptiveFilename(apiType, topic);

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
      duration_ms,
      api_type: apiType,
      topic
    };

    // Save to categorized log file
    const logFileName = `${logId}.json`;
    const logDir = path.join(this.baseLogDir, apiType);
    const logFilePath = path.join(logDir, logFileName);
    
    try {
      fs.writeFileSync(logFilePath, JSON.stringify(logEntry, null, 2));
      console.log(`📝 LLM Response logged: ${apiType}/${logFileName}`);
    } catch (err) {
      console.error('Failed to write LLM log file:', err);
    }

    // Also append to a daily log file for easier browsing
    const dailyLogFileName = `llm-${new Date().toISOString().split('T')[0]}.jsonl`;
    const dailyLogDir = path.join(this.baseLogDir, 'daily');
    const dailyLogFilePath = path.join(dailyLogDir, dailyLogFileName);
    
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(dailyLogFilePath, logLine);
    } catch (err) {
      console.error('Failed to append to daily log file:', err);
    }

    // Cleanup old files
    this.cleanupOldLogs(apiType);

    return logId;
  }

  /**
   * Log response content with descriptive naming
   */
  async logResponseContent(
    userPrompt: string,
    responseContent: string,
    model: string = 'unknown',
    apiType: string = 'unknown'
  ): Promise<string> {
    const topic = this.extractTopic(userPrompt);
    const counter = this.getNextCounter(apiType);
    const fileName = `response-${counter}-${topic}-${apiType.replace(/_/g, '-')}.txt`;
    const logDir = path.join(this.baseLogDir, apiType);
    const filePath = path.join(logDir, fileName);

    // Clean and format the content for better readability
    const cleanContent = this.formatResponseContent(responseContent);
    const cleanPrompt = this.formatPromptContent(userPrompt);

    const content = `=== LLM Response Log ===
Timestamp: ${new Date().toISOString()}
Model: ${model}
API Type: ${apiType}
Topic: ${topic}

=== User Prompt ===
${cleanPrompt}

=== AI Response ===
${cleanContent}

=== End Response ===
`;

    try {
      fs.writeFileSync(filePath, content);
      console.log(`📄 Response content logged: ${apiType}/${fileName}`);
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
   * Get all log entries for a specific API type
   */
  getLogsForApiType(apiType: string): LLMLogEntry[] {
    const logDir = path.join(this.baseLogDir, apiType);
    
    if (!fs.existsSync(logDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse();

      return files.map(file => {
        const filePath = path.join(logDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      });
    } catch (err) {
      console.error('Failed to read API type log files:', err);
      return [];
    }
  }

  /**
   * Get all log entries for a specific date
   */
  getLogsForDate(date: string): LLMLogEntry[] {
    const dailyLogFileName = `llm-${date}.jsonl`;
    const dailyLogDir = path.join(this.baseLogDir, 'daily');
    const dailyLogFilePath = path.join(dailyLogDir, dailyLogFileName);
    
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
    const dailyLogDir = path.join(this.baseLogDir, 'daily');
    const files = fs.readdirSync(dailyLogDir)
      .filter(file => file.endsWith('.jsonl'))
      .sort()
      .reverse()
      .slice(0, 1); // Get most recent daily file

    if (files.length === 0) {
      return [];
    }

    try {
      const filePath = path.join(dailyLogDir, files[0]);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      return lines.slice(-limit).map(line => JSON.parse(line));
    } catch (err) {
      console.error('Failed to read latest log files:', err);
      return [];
    }
  }

  /**
   * Get statistics across all API types
   */
  getStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    totalTokens: number;
    models: Record<string, number>;
    apiTypes: Record<string, number>;
  } {
    const apiTypes = [
      'keyword_generation',
      'lesson_youtube_discovery', 
      'keyword_video_discovery',
      'course_planning',
      'content_generation',
      'video_search',
      'artifact_generation',
      'artifact_prioritization',
      'course_plan_refinement',
      'video_verification',
      'orchestrator_v3'
    ];

    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalResponseTime = 0;
    let totalTokens = 0;
    const models: Record<string, number> = {};
    const apiTypeCounts: Record<string, number> = {};

    apiTypes.forEach(apiType => {
      const logs = this.getLogsForApiType(apiType);
      apiTypeCounts[apiType] = logs.length;
      
      logs.forEach(log => {
        totalRequests++;
        if (log.success) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
        
        totalResponseTime += log.duration_ms;
        
        if (log.response.usage?.total_tokens) {
          totalTokens += log.response.usage.total_tokens;
        }
        
        const model = log.response.model;
        models[model] = (models[model] || 0) + 1;
      });
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      totalTokens,
      models,
      apiTypes: apiTypeCounts
    };
  }

  /**
   * Cleanup old log files for a specific API type
   */
  private cleanupOldLogs(apiType: string): void {
    const logDir = path.join(this.baseLogDir, apiType);
    
    if (!fs.existsSync(logDir)) {
      return;
    }

    try {
      const files = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(logDir, file),
          stats: fs.statSync(path.join(logDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Keep only the most recent files
      if (files.length > this.maxLogFiles) {
        const filesToDelete = files.slice(this.maxLogFiles);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log(`🗑️  Deleted old log file: ${apiType}/${file.name}`);
          } catch (err) {
            console.error(`Failed to delete old log file: ${file.name}`, err);
          }
        });
      }
    } catch (err) {
      console.error('Failed to cleanup old log files:', err);
    }
  }

  /**
   * Export all logs for a specific API type
   */
  exportLogsForApiType(apiType: string): string {
    const logs = this.getLogsForApiType(apiType);
    const exportPath = path.join(this.baseLogDir, `${apiType}-export-${new Date().toISOString().split('T')[0]}.json`);
    
    try {
      fs.writeFileSync(exportPath, JSON.stringify(logs, null, 2));
      console.log(`📤 Exported ${logs.length} logs for ${apiType} to: ${exportPath}`);
      return exportPath;
    } catch (err) {
      console.error('Failed to export logs:', err);
      return '';
    }
  }

  /**
   * Get available API types
   */
  getAvailableApiTypes(): string[] {
    return [
      'keyword_generation',
      'lesson_youtube_discovery', 
      'keyword_video_discovery',
      'course_planning',
      'content_generation',
      'video_search',
      'artifact_generation',
      'artifact_prioritization',
      'course_plan_refinement',
      'video_verification',
      'orchestrator_v3'
    ];
  }
}

// Create singleton instance
export const enhancedLLMLogger = new EnhancedLLMLogger();

// Enhanced logOpenAIRequest function
export async function logOpenAIRequest(
  openAIRequest: any,
  userPrompt: string,
  apiCall: () => Promise<any>,
  apiType: string = 'unknown'
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

    // Log the interaction with enhanced logger
    await enhancedLLMLogger.logLLMInteraction(
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
      duration,
      apiType
    );

    // Also log the response content separately for easy reading
    await enhancedLLMLogger.logResponseContent(userPrompt, logResponseData.content, logResponseData.model, apiType);

    return responseData;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log the failed interaction
    await enhancedLLMLogger.logLLMInteraction(
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
      duration,
      apiType
    );

    throw error;
  }
}
