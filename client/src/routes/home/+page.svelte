<script lang="ts">
	import { onMount } from 'svelte';
	import type { Course } from '$lib/types';
	
	let inProgressCourses: Course[] = [];
	let loading = true;
	let creatingCourse = false;
	let promptText = '';
	let selectedAudience = 'beginners';
	let selectedDepth = 'comprehensive';
	
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
			// For now, we'll fetch all courses and filter for unpublished ones
			// In the future, this should be a dedicated endpoint for user's in-progress courses
			const response = await fetch('/api/courses?limit=20');
			const data = await response.json();
			
			if (response.ok) {
				// Filter for unpublished courses (in-progress)
				inProgressCourses = data.courses
					.filter((course: Course) => !course.is_published)
					.slice(0, 5); // Max 5 courses
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
				// Redirect to the new course
				window.location.href = `/courses/${result.course.id}`;
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
	
	function calculateProgress(course: Course): number {
		// For now, return a random progress between 10-90%
		// In the future, this should be calculated based on actual lesson completion
		return Math.floor(Math.random() * 80) + 10;
	}
	
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			createCourse();
		}
	}
	
	onMount(() => {
		loadInProgressCourses();
	});
</script>

<svelte:head>
	<title>Home - Personal Tutor AI</title>
	<meta name="description" content="Your learning dashboard with in-progress courses and quick course creation." />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- In-Progress Courses Section -->
	<section class="mb-12">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-2xl font-bold text-gray-800">In-Progress Courses</h2>
			{#if inProgressCourses.length > 0}
				<a href="/courses" class="text-primary hover:text-primary-dark transition-colors">
					View All →
				</a>
			{/if}
		</div>
		
		{#if loading}
			<div class="flex justify-center py-8">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		{:else if inProgressCourses.length === 0}
			<!-- Empty State -->
			<div class="card text-center py-12">
				<div class="text-6xl mb-4">📝</div>
				<h3 class="text-xl font-semibold text-gray-700 mb-2">You have no drafts yet</h3>
				<p class="text-gray-500 mb-6">Start creating your first course to begin your teaching journey</p>
				<a href="/start" class="btn btn-primary">
					+ Start
				</a>
			</div>
		{:else}
			<!-- Horizontal Scroll List -->
			<div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
				{#each inProgressCourses as course}
					<div class="card min-w-[300px] flex-shrink-0">
						<div class="flex items-start justify-between mb-3">
							<h3 class="font-semibold text-gray-800 line-clamp-2">{course.title}</h3>
							<span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
								{formatDate(course.updated_at)}
							</span>
						</div>
						
						<!-- Progress Bar -->
						<div class="mb-4">
							<div class="flex justify-between text-sm text-gray-600 mb-1">
								<span>Progress</span>
								<span>{calculateProgress(course)}%</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-primary h-2 rounded-full transition-all duration-300"
									style="width: {calculateProgress(course)}%"
								></div>
							</div>
						</div>
						
						<a 
							href="/courses/{course.id}" 
							class="btn btn-primary w-full text-center"
						>
							Resume
						</a>
					</div>
				{/each}
			</div>
		{/if}
	</section>
	
	<!-- Start a New Course Card -->
	<section class="mb-12">
		<div class="card-elevated p-8">
			<h2 class="text-2xl font-bold text-gray-800 mb-6">Start a New Course</h2>
			
			<div class="space-y-6">
				<!-- Textarea -->
				<div>
					<textarea
						bind:value={promptText}
						on:keypress={handleKeyPress}
						placeholder="Teach X to Y in Z hours…"
						class="textarea w-full min-h-[120px] resize-none"
						disabled={creatingCourse}
					></textarea>
				</div>
				
				<!-- Dropdowns Row -->
				<div class="flex gap-4 flex-wrap">
					<div class="flex-1 min-w-[200px]">
						<label for="audience" class="block text-sm font-medium text-gray-700 mb-2">
							Audience
						</label>
						<select
							id="audience"
							bind:value={selectedAudience}
							class="input"
							disabled={creatingCourse}
						>
							{#each audienceOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					
					<div class="flex-1 min-w-[200px]">
						<label for="depth" class="block text-sm font-medium text-gray-700 mb-2">
							Depth
						</label>
						<select
							id="depth"
							bind:value={selectedDepth}
							class="input"
							disabled={creatingCourse}
						>
							{#each depthOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				</div>
				
				<!-- Create Button -->
				<div class="flex justify-end">
					<button
						on:click={createCourse}
						class="btn btn-primary btn-lg flex items-center gap-2"
						disabled={!promptText.trim() || creatingCourse}
					>
						{#if creatingCourse}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Creating...
						{:else}
							<span class="text-lg">•</span>
							Create Course →
						{/if}
					</button>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	/* Custom scrollbar hiding for horizontal scroll */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	/* Line clamp utility */
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	/* Smooth scrolling for horizontal scroll */
	.overflow-x-auto {
		scroll-behavior: smooth;
	}
</style> 