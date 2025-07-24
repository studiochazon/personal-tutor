<script lang="ts">
	import { onMount } from 'svelte';
	import { requireAuth } from '$lib/auth-guard';
	import { getAuthToken } from '$lib/auth';
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
	
	onMount(async () => {
		// Check authentication first
		isAuthenticated = await requireAuth();
		
		if (isAuthenticated) {
			// Only load data if authenticated
			await loadInProgressCourses();
		}
	});
	
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

			const response = await fetch('/api/start/create-course', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ messages })
			});
			
			if (response.ok) {
				const result = await response.json();
				// Redirect to the new course with success indicator
				window.location.href = `/courses/${result.course.id}?new=true`;
			} else {
				const error = await response.json();
				alert(`Error creating course: ${error.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error creating course:', error);
			alert('Failed to create course. Please try again.');
		} finally {
			creatingCourse = false;
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
		<section class="mb-12">
			<NewCourseCard
				bind:promptText
				bind:selectedAudience
				bind:selectedDepth
				bind:isLoading={creatingCourse}
				onSubmit={handleNewCourseSubmit}
			/>
		</section>
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