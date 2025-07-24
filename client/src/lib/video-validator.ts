// Video validation and fallback system
export interface VideoInfo {
	url: string;
	title: string;
	duration: number;
	platform: 'youtube' | 'vimeo';
	isValid: boolean;
}

export interface FallbackVideo {
	videoId: string;
	title: string;
	duration: number;
	embedUrl: string;
}

// Curated list of reliable educational videos for common topics
const FALLBACK_VIDEOS: Record<string, FallbackVideo[]> = {
	'react': [
		{
			videoId: 'W6NZfCO5SIk',
			title: 'React JS Crash Course 2021',
			duration: 720,
			embedUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk'
		},
		{
			videoId: 'DLX62G4lc44',
			title: 'React Tutorial for Beginners',
			duration: 600,
			embedUrl: 'https://www.youtube.com/embed/DLX62G4lc44'
		},
		{
			videoId: 'Ke90Tje7VS0',
			title: 'React.js Full Course for Beginners',
			duration: 720,
			embedUrl: 'https://www.youtube.com/embed/Ke90Tje7VS0'
		}
	],
	'javascript': [
		{
			videoId: 'W6NZfCO5SIk',
			title: 'JavaScript Full Course for Beginners',
			duration: 720,
			embedUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk'
		},
		{
			videoId: 'PkZNo7MFNFg',
			title: 'Learn JavaScript - Full Course for Beginners',
			duration: 600,
			embedUrl: 'https://www.youtube.com/embed/PkZNo7MFNFg'
		}
	],
	'python': [
		{
			videoId: 'rfscVS0vtbw',
			title: 'Learn Python - Full Course for Beginners',
			duration: 720,
			embedUrl: 'https://www.youtube.com/embed/rfscVS0vtbw'
		},
		{
			videoId: 'kqtD5dpn9C8',
			title: 'Python for Beginners - Learn Python in 1 Hour',
			duration: 360,
			embedUrl: 'https://www.youtube.com/embed/kqtD5dpn9C8'
		}
	],
	'cpp': [
		{
			videoId: '8jLOx1hD3_o',
			title: 'C++ Tutorial for Beginners - Full Course',
			duration: 720,
			embedUrl: 'https://www.youtube.com/embed/8jLOx1hD3_o'
		},
		{
			videoId: 'vLnPwxZdW4Y',
			title: 'C++ Programming Course - Beginner to Advanced',
			duration: 600,
			embedUrl: 'https://www.youtube.com/embed/vLnPwxZdW4Y'
		}
	],
	'html': [
		{
			videoId: 'UB1O30fR-EE',
			title: 'HTML Crash Course For Absolute Beginners',
			duration: 600,
			embedUrl: 'https://www.youtube.com/embed/UB1O30fR-EE'
		}
	],
	'css': [
		{
			videoId: '1PnVor36_40',
			title: 'CSS Crash Course For Absolute Beginners',
			duration: 600,
			embedUrl: 'https://www.youtube.com/embed/1PnVor36_40'
		}
	],
	'node': [
		{
			videoId: 'Oe421EPjeBE',
			title: 'Node.js and Express.js - Full Course',
			duration: 720,
			embedUrl: 'https://www.youtube.com/embed/Oe421EPjeBE'
		}
	],
	'default': [
		{
			videoId: 'W6NZfCO5SIk',
			title: 'Programming Tutorial for Beginners',
			duration: 600,
			embedUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk'
		}
	]
};

/**
 * Check if a YouTube video is available
 */
export async function checkYouTubeVideoAvailability(videoId: string): Promise<boolean> {
	try {
		const response = await fetch(`https://www.youtube.com/embed/${videoId}`, {
			method: 'HEAD',
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; VideoValidator/1.0)'
			}
		});
		
		if (!response.ok) {
			return false;
		}
		
		// Check if the response contains "Video unavailable"
		const textResponse = await fetch(`https://www.youtube.com/embed/${videoId}`);
		const html = await textResponse.text();
		
		return !html.includes('Video unavailable') && !html.includes('This video is unavailable');
	} catch (error) {
		console.error(`Error checking video availability for ${videoId}:`, error);
		return false;
	}
}

/**
 * Extract video ID from YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
	if (!url) return null;
	
	// Handle youtu.be URLs
	if (url.includes('youtu.be/')) {
		return url.split('youtu.be/')[1]?.split('?')[0] || null;
	}
	
	// Handle youtube.com/watch URLs
	if (url.includes('youtube.com/watch')) {
		const urlParams = new URLSearchParams(url.split('?')[1] || '');
		return urlParams.get('v') || null;
	}
	
	// Handle embed URLs
	if (url.includes('youtube.com/embed/')) {
		return url.split('youtube.com/embed/')[1]?.split('?')[0] || null;
	}
	
	return null;
}

/**
 * Get fallback video for a topic
 */
export function getFallbackVideo(topic: string): FallbackVideo {
	const normalizedTopic = topic.toLowerCase();
	
	// Find matching fallback videos
	for (const [key, videos] of Object.entries(FALLBACK_VIDEOS)) {
		if (normalizedTopic.includes(key)) {
			// Return a random video from the matching category
			const randomIndex = Math.floor(Math.random() * videos.length);
			return videos[randomIndex];
		}
	}
	
	// Return default fallback
	const defaultVideos = FALLBACK_VIDEOS.default;
	const randomIndex = Math.floor(Math.random() * defaultVideos.length);
	return defaultVideos[randomIndex];
}

/**
 * Validate and potentially replace a video URL with a fallback
 */
export async function validateAndGetFallbackVideo(
	originalUrl: string, 
	topic: string
): Promise<{ url: string; title: string; duration: number; wasReplaced: boolean }> {
	
	// If it's already an embed URL, extract the video ID
	const videoId = extractYouTubeVideoId(originalUrl);
	
	if (!videoId) {
		// Not a valid YouTube URL, get fallback
		const fallback = getFallbackVideo(topic);
		return {
			url: fallback.embedUrl,
			title: fallback.title,
			duration: fallback.duration,
			wasReplaced: true
		};
	}
	
	// Check if the original video is available
	const isAvailable = await checkYouTubeVideoAvailability(videoId);
	
	if (isAvailable) {
		// Original video is available, convert to embed URL
		const embedUrl = `https://www.youtube.com/embed/${videoId}`;
		return {
			url: embedUrl,
			title: 'Original video', // We don't have the original title
			duration: 600, // Default duration
			wasReplaced: false
		};
	} else {
		// Original video is unavailable, get fallback
		console.log(`Video ${videoId} is unavailable, using fallback for topic: ${topic}`);
		const fallback = getFallbackVideo(topic);
		return {
			url: fallback.embedUrl,
			title: fallback.title,
			duration: fallback.duration,
			wasReplaced: true
		};
	}
}

/**
 * Batch validate multiple videos and replace unavailable ones
 */
export async function validateVideoList(
	videos: Array<{ url: string; title: string; duration: number }>,
	topic: string
): Promise<Array<{ url: string; title: string; duration: number; wasReplaced: boolean }>> {
	
	const validatedVideos = [];
	
	for (const video of videos) {
		const validated = await validateAndGetFallbackVideo(video.url, topic);
		validatedVideos.push(validated);
		
		// Add a small delay to avoid rate limiting
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	
	return validatedVideos;
} 