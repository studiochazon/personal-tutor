<script lang="ts">
	import { onMount } from 'svelte';
	import { requireAuth } from '$lib/auth-guard';
	import { getAuthToken, clearCourseCreationInProgress } from '$lib/auth';
	import type { Course } from '$lib/types';
	import { CourseCard, LoadingState, EmptyState, NewCourseCard } from '$lib/components/ui';
	
	let inProgressCourses: Course[] = [];
	let courseProgress: { [key: number]: number } = {};
	let loading = true;
	let creatingCourse = false;
	let promptText = '';
	let selectedAudience = 'beginners';
	let selectedDepth = 'comprehensive';
	let isAuthenticated = false;
	let hasProcessedUrlParams = false; // Flag to prevent duplicate processing
	let autoCreatingCourse = false; // Flag for automatic course creation from URL params
	let courseCreationError = ''; // Store error message for retry functionality
	
	onMount(() => {
		// Check authentication first
		requireAuth().then(authenticated => {
			isAuthenticated = authenticated;
			
			if (isAuthenticated) {
				// Only load data if authenticated
				loadInProgressCourses().then(() => {
					// Check for URL parameters and handle automatic course creation
					handleUrlParameters();
				});
			}
		});

		// Also check for URL parameters on page load (for direct URL visits)
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('prompt') && !hasProcessedUrlParams) {
			// If we have URL parameters but haven't processed them yet, wait for authentication
			const checkAuth = setInterval(() => {
				if (isAuthenticated && !hasProcessedUrlParams) {
					handleUrlParameters();
					clearInterval(checkAuth);
				}
			}, 100);
			
			// Cleanup interval after 10 seconds
			setTimeout(() => clearInterval(checkAuth), 10000);
		}

		// Add beforeunload event listener to clear course creation flag if user navigates away during course creation
		const handleBeforeUnload = () => {
			if (creatingCourse) {
				clearCourseCreationInProgress();
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		// Cleanup function
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	function handleUrlParameters() {
		// Prevent duplicate processing
		if (hasProcessedUrlParams) {
			return;
		}
		
		// Check for URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const promptParam = urlParams.get('prompt');
		const audienceParam = urlParams.get('audience');
		const depthParam = urlParams.get('depth');

		if (promptParam) {
			console.log('Home page: Found URL parameters, initiating automatic course creation');
			
			// Mark as processed to prevent duplicates
			hasProcessedUrlParams = true;
			autoCreatingCourse = true;
			
			// Set the form values
			promptText = promptParam;
			if (audienceParam) selectedAudience = audienceParam;
			if (depthParam) selectedDepth = depthParam;
			
			// Clear URL parameters to prevent duplicate course creation
			const newUrl = window.location.pathname;
			window.history.replaceState({}, '', newUrl);
			
			// Automatically start course creation with longer delay to ensure auth is ready
			setTimeout(() => {
				// Double-check that we have auth token before proceeding
				let token = getAuthToken();
				if (!token) {
					// Fallback to localStorage
					token = localStorage.getItem('auth_token');
				}
				if (token) {
					createCourse();
				} else {
					console.error('Home page: No auth token available for automatic course creation');
					autoCreatingCourse = false;
					alert('Authentication error. Please try again.');
				}
			}, 1000); // Longer delay to ensure auth store is fully updated
		}
	}
	
	// Audience options for the dropdown
	const audienceOptions = [
		{ value: 'beginners', label: 'Beginners' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
		{ value: 'mixed', label: 'Mixed Level' }
	];
	
	// Depth options for the dropdown
	const depthOptions = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'comprehensive', label: 'Comprehensive' },
		{ value: 'deep-dive', label: 'Deep Dive' }
	];
	
	async function loadInProgressCourses() {
		try {
			const token = getAuthToken();
			if (!token) {
				loading = false;
				return;
			}
			
			// Fetch user's in-progress courses with progress information
			const response = await fetch('/api/courses/in-progress', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			const data = await response.json();
			
			if (response.ok) {
				inProgressCourses = data.courses.slice(0, 5); // Max 5 courses
				
				// Set progress from the API response
				for (const course of inProgressCourses) {
					courseProgress[course.id] = course.progress_percentage || 0;
				}
			}
		} catch (error) {
			console.error('Error loading in-progress courses:', error);
		} finally {
			loading = false;
		}
	}
	
	async function createCourse() {
		if (!promptText.trim()) {
			alert('Please enter a course description');
			return;
		}
		
		// Prevent duplicate course creation
		if (creatingCourse) {
			console.log('Home page: Course creation already in progress, ignoring duplicate request');
			return;
		}
		
		creatingCourse = true;
		
		try {
			// Create a system prompt that incorporates the audience and depth preferences
			const systemPrompt = `You are an expert educational content creator and curriculum designer for Personal Tutor AI. Your role is to create comprehensive, engaging, and well-structured learning courses based on user requests.

## Core Principles

### 1. Educational Excellence
- Create content that follows proven learning methodologies
- Structure courses with clear learning objectives
- Ensure progressive difficulty and logical flow
- Include practical examples and real-world applications
- Design for different learning styles (visual, auditory, kinesthetic)

### 2. Content Quality Standards
- Write clear, concise, and engaging content
- Use active voice and conversational tone
- Include relevant examples and case studies
- Provide actionable insights and practical takeaways
- Ensure accuracy and up-to-date information

### 3. Course Structure Guidelines
- **Course Title**: Clear, descriptive, and engaging
- **Description**: Comprehensive overview of what learners will gain
- **Difficulty Level**: ${selectedAudience === 'beginners' ? 'beginner' : selectedAudience === 'advanced' ? 'advanced' : 'intermediate'}
- **Estimated Duration**: Realistic time commitment in minutes
- **Lessons**: ${selectedDepth === 'overview' ? '3-5' : selectedDepth === 'deep-dive' ? '10-15' : '5-10'} lessons per course, depending on complexity

## Content Guidelines

### Writing Style
- Use clear, simple language appropriate for ${selectedAudience} level
- Avoid jargon unless necessary, and always explain technical terms
- Write in an encouraging, supportive tone
- Use bullet points and numbered lists for better readability
- Include "Pro Tips" and "Common Mistakes to Avoid" sections

### Depth and Coverage
- ${selectedDepth === 'overview' ? 'Provide a high-level overview with key concepts and essential information' : selectedDepth === 'deep-dive' ? 'Provide comprehensive coverage with detailed explanations, advanced concepts, and extensive examples' : 'Provide comprehensive coverage with detailed explanations and practical examples'}
- ${selectedDepth === 'overview' ? 'Focus on breadth over depth' : selectedDepth === 'deep-dive' ? 'Include advanced topics, edge cases, and expert-level insights' : 'Balance breadth and depth appropriately'}

## Lesson Structure Template

Each lesson should follow this structure:

1. **Introduction** (10-15% of content)
   - Hook the learner's interest
   - State learning objectives
   - Provide context and relevance

2. **Main Content** (70-80% of content)
   - Core concepts and explanations
   - Examples and demonstrations
   - Step-by-step processes
   - Best practices and tips

3. **Practice/Application** (10-15% of content)
   - Hands-on exercises
   - Real-world scenarios
   - Self-assessment questions
   - Next steps and preparation`;

			// Create messages array with system prompt and user input
			const messages = [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: promptText.trim() }
			];

			// Get auth token - try both store and localStorage
			let token = getAuthToken();
			if (!token) {
				// Fallback to localStorage
				token = localStorage.getItem('auth_token');
			}
			console.log('Home page: Auth token check:', { 
				hasToken: !!token, 
				tokenLength: token?.length,
				fromStore: !!getAuthToken(),
				fromLocalStorage: !!localStorage.getItem('auth_token')
			});
			if (!token) {
				throw new Error('Authentication token not found. Please log in again.');
			}

			const response = await fetch('/api/start/create-course', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ messages })
			});
			
			if (response.ok) {
				const result = await response.json();
				// Clear course creation in progress flag since course was successfully created
				clearCourseCreationInProgress();
				courseCreationError = ''; // Clear any error messages
				// Redirect to the new course with success indicator
				window.location.href = `/courses/${result.course.id}?new=true`;
			} else {
				const error = await response.json();
				const errorMessage = error.error || 'Unknown error';
				
				// Show more user-friendly error messages
				if (errorMessage.includes('quota exceeded')) {
					courseCreationError = 'Course creation is temporarily unavailable due to high demand. Please try again in a few minutes.';
				} else if (errorMessage.includes('temporarily unavailable')) {
					courseCreationError = 'Course creation service is temporarily unavailable. Please try again in a few minutes.';
				} else if (errorMessage.includes('authentication failed')) {
					courseCreationError = 'There was an authentication issue. Please try logging out and logging back in.';
				} else {
					courseCreationError = `Error creating course: ${errorMessage}`;
				}
			}
		} catch (error) {
			console.error('Error creating course:', error);
			courseCreationError = 'Failed to create course. Please try again.';
			// Clear course creation in progress flag on error
			clearCourseCreationInProgress();
		} finally {
			creatingCourse = false;
			autoCreatingCourse = false; // Reset automatic course creation flag
		}
	}
	
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 1) {
			return 'Yesterday';
		} else if (diffDays < 7) {
			return `${diffDays} days ago`;
		} else {
			return date.toLocaleDateString();
		}
	}
	

	
	function handleNewCourseSubmit(data: {prompt: string, audience?: string, depth?: string}) {
		promptText = data.prompt;
		if (data.audience) selectedAudience = data.audience;
		if (data.depth) selectedDepth = data.depth;
		courseCreationError = ''; // Clear any previous errors
		createCourse();
	}

	function retryCourseCreation() {
		courseCreationError = ''; // Clear error
		createCourse();
	}
</script>

<svelte:head>
	<title>Home - Personal Tutor AI</title>
	<meta name="description" content="Your learning dashboard with in-progress courses and quick course creation." />
</svelte:head>

{#if !isAuthenticated}
	<!-- Loading state while checking authentication -->
	<div class="container mx-auto px-4 py-8">
		<LoadingState message="Checking authentication..." />
	</div>
{:else}
	<div class="container mx-auto px-4 py-8">
		<!-- Automatic Course Creation Indicator -->
		{#if autoCreatingCourse && creatingCourse}
			<div class="mb-6">
				<div class="card-elevated bg-white border border-gray-200">
					<div class="p-4">
						<div class="flex items-center justify-center">
							<div class="text-center">
								<h3 class="course-creation-title mb-3">
									Creating Your Course - <b>{promptText || 'Course'}</b>
								</h3>
								<div class="loading-dots">
									<div class="loading-dot"></div>
									<div class="loading-dot"></div>
									<div class="loading-dot"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Course Creation Error -->
		{#if courseCreationError}
			<div class="mb-6">
				<div class="card-elevated bg-red-50 border border-red-200">
					<div class="p-6">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold text-red-800 mb-1">Course Creation Failed</h3>
								<p class="text-red-700 text-sm">{courseCreationError}</p>
							</div>
							<button 
								on:click={retryCourseCreation}
								class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
							>
								Retry
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
		<!-- In-Progress Courses Section -->
		<section class="mb-12">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-2xl font-bold text-gray-800">Continue your learning journey</h2>
				{#if inProgressCourses.length > 0}
					<a href="/courses" class="text-primary hover:text-primary-dark transition-colors">
						View All →
					</a>
				{/if}
			</div>
			
			{#if loading}
				<LoadingState message="Loading your courses..." />
			{:else if inProgressCourses.length === 0}
				<!-- Empty State -->
				<EmptyState 
					title="No courses in progress"
					description="Enroll in a course to start learning and track your progress"
					icon="📚"
					actionText="Browse Courses"
					actionHref="/courses"
				/>
			{:else}
				<!-- Horizontal Scroll List -->
				<div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
					{#each inProgressCourses as course}
						<div class="min-w-[300px] flex-shrink-0">
							<CourseCard 
								{course}
								showProgress={true}
								progressPercentage={courseProgress[course.id] || 0}
								actionText="Resume"
								actionHref="/courses/{course.id}"
								variant="compact"
							/>
						</div>
					{/each}
				</div>
			{/if}
		</section>
		
		<!-- Start a New Course Card -->
		{#if !autoCreatingCourse}
			<section class="mb-12">
				<NewCourseCard
					bind:promptText
					bind:selectedAudience
					bind:selectedDepth
					bind:isLoading={creatingCourse}
					onSubmit={handleNewCourseSubmit}
				/>
			</section>
		{/if}
	</div>
{/if}

<style>
	/* Custom scrollbar hiding for horizontal scroll */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	/* Smooth scrolling for horizontal scroll */
	.overflow-x-auto {
		scroll-behavior: smooth;
	}
	

</style> 