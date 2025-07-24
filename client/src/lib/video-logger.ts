// Video source logging and validation utility

export interface VideoSource {
  url: string;
  title: string | null;
  duration: number | null;
  platform: 'youtube' | 'vimeo' | 'other';
  isValid: boolean;
  error?: string;
}

export interface VideoLogEntry {
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  videoSource: VideoSource;
  timestamp: string;
}

export class VideoLogger {
  private logs: VideoLogEntry[] = [];

  /**
   * Log a video source for a lesson
   */
  logVideoSource(
    lessonId: number,
    lessonTitle: string,
    courseId: number,
    courseTitle: string,
    videoUrl: string | null,
    videoTitle: string | null,
    videoDuration: number | null
  ): VideoLogEntry {
    const videoSource = this.validateVideoSource(videoUrl, videoTitle, videoDuration);
    
    const logEntry: VideoLogEntry = {
      lessonId,
      lessonTitle,
      courseId,
      courseTitle,
      videoSource,
      timestamp: new Date().toISOString()
    };

    this.logs.push(logEntry);
    
    // Log to console for debugging
    console.log('Video Source Logged:', {
      lesson: lessonTitle,
      course: courseTitle,
      video: videoSource,
      isValid: videoSource.isValid
    });

    return logEntry;
  }

  /**
   * Validate a video source
   */
  private validateVideoSource(
    url: string | null,
    title: string | null,
    duration: number | null
  ): VideoSource {
    if (!url) {
      return {
        url: '',
        title,
        duration,
        platform: 'other',
        isValid: false,
        error: 'No video URL provided'
      };
    }

    // Check if URL is valid
    try {
      new URL(url);
    } catch {
      return {
        url,
        title,
        duration,
        platform: 'other',
        isValid: false,
        error: 'Invalid URL format'
      };
    }

    // Determine platform
    let platform: 'youtube' | 'vimeo' | 'other' = 'other';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
    } else if (url.includes('vimeo.com')) {
      platform = 'vimeo';
    }

    // Validate duration
    if (duration && (duration < 0 || duration > 7200)) { // Max 2 hours
      return {
        url,
        title,
        duration,
        platform,
        isValid: false,
        error: 'Invalid duration (must be between 0 and 7200 seconds)'
      };
    }

    return {
      url,
      title,
      duration,
      platform,
      isValid: true
    };
  }

  /**
   * Get all video logs
   */
  getLogs(): VideoLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get video logs for a specific course
   */
  getLogsForCourse(courseId: number): VideoLogEntry[] {
    return this.logs.filter(log => log.courseId === courseId);
  }

  /**
   * Get video logs for a specific lesson
   */
  getLogsForLesson(lessonId: number): VideoLogEntry[] {
    return this.logs.filter(log => log.lessonId === lessonId);
  }

  /**
   * Get statistics about video sources
   */
  getStats() {
    const total = this.logs.length;
    const valid = this.logs.filter(log => log.videoSource.isValid).length;
    const invalid = total - valid;
    
    const platforms = this.logs.reduce((acc, log) => {
      if (log.videoSource.isValid) {
        acc[log.videoSource.platform] = (acc[log.videoSource.platform] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      valid,
      invalid,
      validityRate: total > 0 ? (valid / total) * 100 : 0,
      platforms
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create a singleton instance
export const videoLogger = new VideoLogger();

/**
 * Utility function to check if a lesson has video content
 */
export function hasVideoContent(lesson: {
  video_url?: string | null;
  video_title?: string | null;
  video_duration?: number | null;
}): boolean {
  return !!(lesson.video_url && lesson.video_url.trim());
}

/**
 * Utility function to extract video ID from YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Utility function to convert YouTube URL to embed format
 */
export function convertToYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  
  // Check if it's already an embed URL
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Extract video ID and convert to embed URL
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return null;
}

/**
 * Utility function to format video duration
 */
export function formatVideoDuration(seconds: number | null): string {
  if (!seconds) return 'Unknown';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
} 