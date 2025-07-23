<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { requireAuth } from '$lib/auth-guard';
	import { authStore, getAuthToken } from '$lib/auth';
	import type { CreateCourseRequest } from '$lib/types';

	let userPrompt = '';
	let isLoading = false;
	let errorMessage = '';
	let testResult = '';
	let user: any = null;
	let isAuthenticated = false;

	onMount(async () => {
		// Check authentication first
		isAuthenticated = await requireAuth();
		
		if (isAuthenticated) {
			// Subscribe to auth store for user data
			authStore.subscribe(state => {
				user = state.user;
			});
		}
	});

	// System prompt for course creation - this should match the content from system-prompt.md
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
- **Difficulty Level**: beginner, intermediate, or advanced
- **Estimated Duration**: Realistic time commitment in minutes
- **Lessons**: 5-15 lessons per course, depending on complexity

## Course Generation Process

### 1. Analysis Phase
- Analyze the user's learning goals and requirements
- Identify the target audience and their skill level
- Determine the scope and depth of the course
- Assess prerequisites and foundational knowledge needed

### 2. Planning Phase
- Create a logical learning progression
- Break down complex topics into digestible lessons
- Design hands-on activities and assessments
- Plan for knowledge retention and application

### 3. Content Creation Phase
- Write engaging lesson content with clear objectives
- Include practical examples and exercises
- Provide step-by-step instructions where applicable
- Incorporate multimedia suggestions (images, videos, diagrams)

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
   - Next steps and preparation

## Content Guidelines

### Writing Style
- Use clear, simple language appropriate for the target audience
- Avoid jargon unless necessary, and always explain technical terms
- Write in an encouraging, supportive tone
- Use bullet points and numbered lists for better readability
- Include "Pro Tips" and "Common Mistakes to Avoid" sections

### Engagement Techniques
- Start with compelling questions or scenarios
- Use storytelling and real-world examples
- Include interactive elements and thought experiments
- Provide immediate value and actionable insights
- End with clear next steps and motivation

### Assessment and Progress
- Include self-assessment questions throughout lessons
- Provide practical exercises and challenges
- Create opportunities for reflection and application
- Design progressive complexity in exercises

## Specialized Course Types

### Technical Courses
- Include code examples and syntax highlighting
- Provide step-by-step tutorials
- Include debugging and troubleshooting sections
- Offer multiple approaches to problem-solving

### Business/Professional Courses
- Include case studies and industry examples
- Provide templates and frameworks
- Include role-playing scenarios
- Offer networking and career advancement tips

### Creative/Skill-Based Courses
- Include inspiration and creative prompts
- Provide multiple techniques and approaches
- Include critique and feedback frameworks
- Offer portfolio-building opportunities

## Quality Assurance Checklist

Before finalizing any course, ensure:

- [ ] Learning objectives are clear and measurable
- [ ] Content flows logically from one lesson to the next
- [ ] Examples are relevant and up-to-date
- [ ] Language is appropriate for the target audience
- [ ] Practical exercises are included
- [ ] Course provides immediate value
- [ ] Content is accurate and well-researched
- [ ] Course length is appropriate for the topic
- [ ] Difficulty level matches the target audience

## Response Format

When generating a course, always respond with a valid JSON object containing:

{
  "title": "Engaging and descriptive course title",
  "description": "Comprehensive overview of the course content and learning outcomes",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_duration": number in minutes,
  "lessons": [
    {
      "title": "Clear lesson title",
      "content": "Comprehensive lesson content with clear structure, examples, and practical exercises",
      "order_index": number,
      "estimated_duration": number in minutes
    }
  ]
}

Remember: Your goal is to create transformative learning experiences that empower users to achieve their goals and develop new skills effectively.`;

	async function createCourse() {
		if (!userPrompt.trim() || isLoading) return;

		// Check authentication
		if (!user) {
			errorMessage = 'Please log in to create courses';
			goto('/auth/login');
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// Get auth token
			const token = getAuthToken();
			if (!token) {
				throw new Error('Authentication token not found');
			}

			// Create messages array with system prompt and user input
			const messages = [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt.trim() }
			];

			const response = await fetch('/api/start/create-course', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ messages })
			});

			if (!response.ok) {
				const errorData = await response.json();
				if (response.status === 401) {
					// Authentication error - redirect to login
					goto('/auth/login');
					return;
				}
				throw new Error(errorData.error || 'Failed to create course');
			}

			const data = await response.json();
			
			if (data.success && data.course) {
				// Redirect to the course page
				goto(`/courses/${data.course.id}`);
			} else {
				throw new Error('Course creation failed');
			}

		} catch (error) {
			console.error('Error creating course:', error);
			errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			createCourse();
		}
	}

	async function testDbConnection() {
		testResult = 'Testing database connection...';
		
		try {
			const response = await fetch('/api/test-db', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: 'Test Course',
					description: 'This is a test course to verify database connection and write operations.',
					difficulty: 'beginner',
					estimated_duration: 60,
					lessons: [
						{
							title: 'Test Lesson 1',
							content: 'This is a test lesson content.',
							order_index: 1,
							estimated_duration: 30
						}
					]
				})
			});

			const data = await response.json();
			
			if (data.success) {
				testResult = `✅ Database test successful! Course created with ID: ${data.courseId}`;
			} else {
				testResult = `❌ Database test failed: ${data.error}`;
			}
		} catch (error) {
			console.error('Database test error:', error);
			testResult = `❌ Database test error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}
</script>

<svelte:head>
	<title>Create Course - Personal Tutor AI</title>
</svelte:head>

{#if !isAuthenticated}
	<!-- Loading state while checking authentication -->
	<div class="container">
		<div class="flex justify-center items-center min-h-[400px]">
			<div class="text-center">
				<div class="loading mx-auto mb-4"></div>
				<p>Checking authentication...</p>
			</div>
		</div>
	</div>
{:else}
	<div class="container">
		<div class="page-header">
			<h1>Create Your Course</h1>
			<p>Describe what you want to teach and AI will create a comprehensive course for you</p>
		</div>

		<div class="form-container">
			<div class="input-section">
				<label for="course-prompt" class="label">What would you like to teach?</label>
				<textarea
					id="course-prompt"
					bind:value={userPrompt}
					on:keypress={handleKeyPress}
					placeholder="e.g., I want to create a course about Python programming for beginners, covering variables, functions, and basic data structures..."
					disabled={isLoading}
					rows="6"
					class="prompt-input"
				></textarea>
				
				{#if errorMessage}
					<div class="error-message">
						{errorMessage}
					</div>
				{/if}

				<button 
					on:click={createCourse} 
					disabled={!userPrompt.trim() || isLoading}
					class="btn btn-primary btn-lg create-button {isLoading ? 'btn-loading' : ''}"
				>
					{#if isLoading}
						Creating Course...
					{:else}
						Create Course
					{/if}
				</button>

				<button 
					on:click={testDbConnection} 
					class="btn btn-success"
					style="margin-top: 10px;"
				>
					Test DB Connection & Write
				</button>

				{#if testResult}
					<div class="test-result" style="margin-top: 10px; padding: 10px; border-radius: 5px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
						{testResult}
					</div>
				{/if}
			</div>

			<div class="info-section">
				<h3>How it works</h3>
				<div class="steps">
					<div class="step">
						<div class="step-number">1</div>
						<div class="step-content">
							<h4>Describe Your Topic</h4>
							<p>Tell us what you want to teach, your target audience, and any specific requirements.</p>
						</div>
					</div>
					<div class="step">
						<div class="step-number">2</div>
						<div class="step-content">
							<h4>AI Generates Course</h4>
							<p>Our AI creates a comprehensive course structure with lessons, examples, and exercises.</p>
						</div>
					</div>
					<div class="step">
						<div class="step-number">3</div>
						<div class="step-content">
							<h4>Review & Customize</h4>
							<p>Review your course and make any adjustments to fit your needs perfectly.</p>
						</div>
					</div>
				</div>

				<div class="examples">
					<h4>Example prompts:</h4>
					<ul>
						<li>"Create a beginner-friendly course on JavaScript fundamentals"</li>
						<li>"Design a course about digital marketing for small business owners"</li>
						<li>"Make a course teaching photography basics with practical exercises"</li>
						<li>"Create an advanced course on machine learning algorithms"</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="setup-note">
			<p><strong>Setup Required:</strong> Make sure to add your OpenAI API key to the <code>.env</code> file in the root directory:</p>
			<code>OPENAI_API_KEY=your_actual_api_key_here</code>
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 20px;
		min-height: 100vh;
	}

	/* Using consolidated header styles from design-system.css */

	.form-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 40px;
		margin-bottom: 40px;
	}

	.input-section {
		background: white;
		padding: 30px;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.label {
		display: block;
		font-weight: 600;
		margin-bottom: var(--spacing-3);
		color: var(--color-gray-800);
		font-size: 1.1rem;
	}

	.prompt-input {
		width: 100%;
		border: 2px solid var(--color-gray-300);
		border-radius: var(--radius-lg);
		padding: var(--spacing-4);
		font-family: inherit;
		font-size: 14px;
		line-height: 1.5;
		resize: vertical;
		transition: border-color 0.2s;
	}

	.prompt-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.prompt-input:disabled {
		background: var(--color-gray-50);
		cursor: not-allowed;
	}

	.error-message {
		background: var(--color-error-light);
		color: var(--color-error-text);
		padding: var(--spacing-3);
		border-radius: var(--radius-md);
		margin: var(--spacing-4) 0;
		border: 1px solid var(--color-error);
	}

	.create-button {
		width: 100%;
		margin-top: var(--spacing-5);
	}

	/* Loading spinner is now handled by the consolidated button styles */

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.info-section {
		background: #f8f9fa;
		padding: 30px;
		border-radius: 12px;
	}

	.info-section h3 {
		margin: 0 0 24px 0;
		color: #333;
		font-size: 1.3rem;
	}

	.steps {
		margin-bottom: 30px;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 20px;
	}

	.step-number {
		width: 32px;
		height: 32px;
		background: #007bff;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		flex-shrink: 0;
	}

	.step-content h4 {
		margin: 0 0 4px 0;
		color: #333;
		font-size: 1rem;
	}

	.step-content p {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.examples h4 {
		margin: 0 0 12px 0;
		color: #333;
		font-size: 1rem;
	}

	.examples ul {
		margin: 0;
		padding-left: 20px;
	}

	.examples li {
		margin-bottom: 8px;
		color: #666;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.setup-note {
		margin-top: 20px;
		padding: 16px;
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
		font-size: 14px;
	}

	.setup-note code {
		background: #f8f9fa;
		padding: 2px 6px;
		border-radius: 4px;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		.container {
			padding: 10px;
		}
		
		.form-container {
			grid-template-columns: 1fr;
			gap: 20px;
		}
		
		.page-header h1 {
			font-size: 2rem;
		}
		
		.input-section,
		.info-section {
			padding: 20px;
		}
	}
</style> 