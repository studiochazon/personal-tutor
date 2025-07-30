import fs from 'fs';
import path from 'path';

export class SimpleLogger {
  private logDir: string;
  private counterFile: string;

  constructor() {
    // Create logs directory in the project root
    this.logDir = path.join(process.cwd(), 'llm-logs', 'simple-response');
    this.counterFile = path.join(this.logDir, '.counter');
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
   * Get the next counter number
   */
  private getNextCounter(): number {
    try {
      if (fs.existsSync(this.counterFile)) {
        const counter = parseInt(fs.readFileSync(this.counterFile, 'utf-8').trim());
        const nextCounter = counter + 1;
        fs.writeFileSync(this.counterFile, nextCounter.toString());
        return nextCounter;
      } else {
        // Initialize counter
        fs.writeFileSync(this.counterFile, '1');
        return 1;
      }
    } catch (err) {
      console.error('Error managing counter:', err);
      // Fallback to timestamp-based ID
      return Date.now() % 10000;
    }
  }

  /**
   * Clean and shorten the user prompt for filename
   */
  private sanitizePromptForFilename(prompt: string): string {
    return prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim()
      .split(/\s+/) // Split by whitespace
      .slice(0, 3) // Take first 3 words
      .join('-') // Join with hyphens
      .substring(0, 30); // Limit to 30 characters
  }

  /**
   * Generate a unique log ID with timestamp
   */
  private generateLogId(): string {
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Log a simple text response
   */
  async logSimpleResponse(
    userPrompt: string,
    responseContent: string,
    model: string = 'unknown'
  ): Promise<string> {
    const counter = this.getNextCounter();
    const sanitizedPrompt = this.sanitizePromptForFilename(userPrompt);
    const logId = this.generateLogId();
    const timestamp = new Date().toISOString();

    // Create filename with counter and prompt
    const fileName = `${counter}-${sanitizedPrompt || 'course-prompt'}.txt`;

    // Create a simple text log
    const logContent = `=== SIMPLE COURSE CREATION LOG ===
Timestamp: ${timestamp}
Log ID: ${logId}
Counter: ${counter}
Model: ${model}

=== USER PROMPT ===
${userPrompt}

=== AI RESPONSE ===
${responseContent}

=== END LOG ===
`;

    // Save to text file
    const logFilePath = path.join(this.logDir, fileName);
    
    try {
      fs.writeFileSync(logFilePath, logContent);
      console.log(`📝 Simple response logged: ${fileName}`);
    } catch (err) {
      console.error('Failed to write simple log file:', err);
    }

    return logId;
  }

  /**
   * List recent logs
   */
  getRecentLogs(limit: number = 10): Array<{ id: string; filename: string; timestamp: Date; counter?: number }> {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.txt') && !file.startsWith('.'))
        .map(file => {
          const stat = fs.statSync(path.join(this.logDir, file));
          
          // Extract counter from filename
          const counterMatch = file.match(/^(\d+)-/);
          const counter = counterMatch ? parseInt(counterMatch[1]) : undefined;
          
          return {
            id: file.replace('.txt', ''),
            filename: file,
            timestamp: stat.mtime,
            counter
          };
        })
        .sort((a, b) => {
          // Sort by counter if available, otherwise by timestamp
          if (a.counter !== undefined && b.counter !== undefined) {
            return b.counter - a.counter; // Newest first
          }
          return b.timestamp.getTime() - a.timestamp.getTime();
        })
        .slice(0, limit);

      return files;
    } catch (err) {
      console.error('Failed to list log files:', err);
      return [];
    }
  }

  /**
   * Read a specific log file by filename or ID
   */
  readLog(identifier: string): string | null {
    try {
      let logFilePath: string;
      
      // Check if it's a filename or needs .txt extension
      if (identifier.endsWith('.txt')) {
        logFilePath = path.join(this.logDir, identifier);
      } else {
        // Try with .txt extension
        logFilePath = path.join(this.logDir, `${identifier}.txt`);
      }
      
      if (fs.existsSync(logFilePath)) {
        return fs.readFileSync(logFilePath, 'utf-8');
      }
      
      // If not found, try to find by partial match
      const files = fs.readdirSync(this.logDir).filter(file => 
        file.includes(identifier) && file.endsWith('.txt')
      );
      
      if (files.length > 0) {
        logFilePath = path.join(this.logDir, files[0]);
        return fs.readFileSync(logFilePath, 'utf-8');
      }
      
      return null;
    } catch (err) {
      console.error('Failed to read log file:', err);
      return null;
    }
  }

  /**
   * Get current counter value
   */
  getCurrentCounter(): number {
    try {
      if (fs.existsSync(this.counterFile)) {
        return parseInt(fs.readFileSync(this.counterFile, 'utf-8').trim());
      }
      return 0;
    } catch (err) {
      console.error('Error reading counter:', err);
      return 0;
    }
  }

  /**
   * Reset counter (useful for testing)
   */
  resetCounter(): void {
    try {
      fs.writeFileSync(this.counterFile, '0');
      console.log('Counter reset to 0');
    } catch (err) {
      console.error('Error resetting counter:', err);
    }
  }
}

// Create a singleton instance
export const simpleLogger = new SimpleLogger(); 