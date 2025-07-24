<script lang="ts">
	import { onMount } from 'svelte';
	import type { Course } from '$lib/types';
	import { Icon, PromptSection, NewCourseCard } from '$lib/components/ui';
	
	let featuredCourses: Course[] = [];
	let loading = true;
	
	async function loadFeaturedCourses() {
		try {
			const response = await fetch('/api/courses?limit=3');
			const data = await response.json();
			
			if (response.ok) {
				featuredCourses = data.courses.slice(0, 3); // Get first 3 courses
			}
		} catch (error) {
			console.error('Error loading featured courses:', error);
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		loadFeaturedCourses();
	});

	const features = [
		{
			icon: "target",
			title: "Personalized Learning Paths",
			description: "AI-powered course recommendations tailored to your learning style and goals"
		},
		// {
		// 	icon: "book",
		// 	title: "Interactive Lessons",
		// 	description: "Engage with hands-on exercises, quizzes, and real-world projects"
		// },
		{
			icon: "chart",
			title: "Progress Tracking",
			description: "Monitor your learning journey with detailed analytics and achievements"
		},
		{
			icon: "rocket",
			title: "Learn at Your Pace",
			description: "Flexible learning schedule that adapts to your busy lifestyle"
		},
		// {
		// 	icon: "bot",
		// 	title: "AI Tutor Support",
		// 	description: "Get instant help and guidance from our intelligent tutoring system"
		// },
		{
			icon: "sparkles",
			title: "AI Course Creation",
			description: "Create your own courses with our AI assistant - just describe what you want to teach"
		}
	];

	function getDifficultyColor(difficulty: string): string {
		switch (difficulty) {
			case 'beginner':
				return 'difficulty-beginner';
			case 'intermediate':
				return 'difficulty-intermediate';
			case 'advanced':
				return 'difficulty-advanced';
			default:
				return 'difficulty-default';
		}
	}

	function formatDuration(minutes: number | null): string {
		if (!minutes) return 'Self-paced';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}

	async function handlePromptSubmit(data: {prompt: string, audience?: string, depth?: string}) {
		// Redirect to the start page with the prompt data
		const params = new URLSearchParams({
			prompt: data.prompt,
			audience: data.audience || 'beginners',
			depth: data.depth || 'comprehensive'
		});
		window.location.href = `/start?${params.toString()}`;
	}

	// Handler for the hero NewCourseCard - handles authentication flow
	async function handleHeroCourseSubmit(data: {prompt: string, audience?: string, depth?: string}) {
		// Check if user is authenticated
		const token = localStorage.getItem('auth_token');
		const userStr = localStorage.getItem('auth_user');
		
		if (token && userStr) {
			// User is logged in, redirect to start page with prompt data
			const params = new URLSearchParams({
				prompt: data.prompt,
				audience: data.audience || 'beginners',
				depth: data.depth || 'comprehensive'
			});
			window.location.href = `/start?${params.toString()}`;
		} else {
			// User is not logged in, save to localStorage and redirect to login
			const { savePromptData } = await import('$lib/auth');
			savePromptData(data);
			window.location.href = '/auth/login';
		}
	}
</script>

<svelte:head>
	<title>Personal Tutor AI - Your Custom Learning Path Creator</title>
	<meta name="description" content="Create personalized learning paths with AI-powered recommendations. Learn at your own pace with interactive lessons and progress tracking." />
</svelte:head>

<!-- Hero Section -->
<section class="hero-section">
	<div class="hero-background">
		<div class="hero-gradient"></div>
		<div class="hero-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
		</div>
	</div>
	<div class="hero-container">
		<div class="hero-content">
			<h1 class="hero-title">
				Novotio - Personalized Learning with AI
				<span class="hero-title-accent">for Modern Learning</span>
			</h1>
			<p class="hero-subtitle">
				Create custom learning paths tailored to your goals.
			</p>
			<div class="hero-course-card-container">
				<NewCourseCard 
					title="Start Creating Your Course"
					subtitle="Describe what you want to teach and our AI will create a comprehensive course for you"
					placeholder="e.g., I want to create a course about React development"
					buttonText="Create Course"
					loadingText="Creating Course..."
					showAudienceDropdown={true}
					showDepthDropdown={true}
					onSubmit={handleHeroCourseSubmit}
				/>
			</div>
			<div class="hero-stats">
				<div class="stat-item">
					<span class="stat-number">10K+</span>
					<span class="stat-label">Active Learners</span>
				</div>
				<div class="stat-item">
					<span class="stat-number">500+</span>
					<span class="stat-label">Courses Created</span>
				</div>
				<div class="stat-item">
					<span class="stat-number">95%</span>
					<span class="stat-label">Completion Rate</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="features-section">
	<div class="container">
		<div class="section-header">
			<div class="section-badge">Why Choose Us</div>
			<h2 class="section-title">Experience the Future of Learning</h2>
			<p class="section-subtitle">
				Our AI-powered platform is designed to adapt to your unique learning style, providing personalized experiences that accelerate your growth.
			</p>
		</div>
		
		<div class="features-grid">
			{#each features as feature, index}
				<div class="feature-card" style="animation-delay: {index * 0.1}s">
					<div class="feature-icon-wrapper">
						<div class="feature-icon">
							<Icon name={feature.icon} size={32} color="white" />
						</div>
						<div class="feature-icon-bg"></div>
					</div>
					<h3 class="feature-title">{feature.title}</h3>
					<p class="feature-description">{feature.description}</p>
					<div class="feature-hover-effect"></div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Featured Courses Section -->
<section class="courses-section">
	<div class="container">
		<div class="section-header">
			<div class="section-badge">Featured</div>
			<h2 class="section-title">Explore Our Curated Courses</h2>
			<p class="section-subtitle">
				Discover our handpicked selection of courses designed to help you master new skills and advance your career.
			</p>
		</div>
		
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p class="loading-text">Loading featured courses...</p>
			</div>
		{:else}
			<div class="courses-grid">
				{#each featuredCourses as course}
					<article class="course-card">
						<div class="course-thumbnail">
							<img 
								src={course.thumbnail_url || '/images/default-course-thumbnail.svg'} 
								alt="{course.title} thumbnail"
								class="thumbnail-image"
								on:error={(e) => {
									const target = e.target as HTMLImageElement;
									if (target) {
										target.src = '/images/default-course-thumbnail.svg';
									}
								}}
							/>
							<div class="difficulty-badge {getDifficultyColor(course.difficulty)}">
								{course.difficulty}
							</div>
							<div class="course-overlay">
								<div class="course-overlay-content">
									<span class="overlay-text">Start Learning</span>
								</div>
							</div>
						</div>
						<div class="course-content">
							<div class="course-header">
								<h3 class="course-title">{course.title}</h3>
							</div>
							<p class="course-description">
								{course.description ? (course.description.length > 120 ? course.description.substring(0, 120) + '...' : course.description) : 'No description available'}
							</p>
							<div class="course-footer">
								<span class="course-duration">
									<Icon name="clock" size={16} color="currentColor" />
									{formatDuration(course.estimated_duration)}
								</span>
								<a href="/courses/{course.id}" class="btn btn-secondary course-btn">
									Start Course
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
			
			<div class="section-footer">
				<a href="/courses" class="btn btn-primary btn-lg view-all-btn">
					<span class="btn-content">
						<span class="btn-text">View All Courses</span>
						<span class="btn-icon">
							<Icon name="arrowRight" size={20} color="white" />
						</span>
					</span>
				</a>
			</div>
		{/if}
	</div>
</section>

<!-- CTA Section -->
<section class="cta-section">
	<div class="cta-background">
		<div class="cta-gradient"></div>
		<div class="cta-shapes">
			<div class="cta-shape cta-shape-1"></div>
			<div class="cta-shape cta-shape-2"></div>
		</div>
	</div>
	<div class="container">
		<div class="cta-content">
			<h2 class="cta-title">Ready to Transform Your Learning?</h2>
			<p class="cta-subtitle">
				Join thousands of learners who are already accelerating their growth with Personal Tutor AI. Start your journey today.
			</p>
			<div class="cta-buttons">
				<a href="/auth/register" class="btn btn-primary btn-lg cta-btn-primary">
					<span class="btn-content">
						<span class="btn-text">Create Free Account</span>
						<span class="btn-icon">
							<Icon name="rocket" size={20} color="white" />
						</span>
					</span>
				</a>
				<a href="/courses" class="btn btn-ghost btn-lg cta-btn-secondary">
					<span class="btn-content">
						<span class="btn-text">Browse Courses</span>
						<span class="btn-icon">
							<Icon name="book" size={20} color="white" />
						</span>
					</span>
				</a>
			</div>
		</div>
	</div>
</section>


<style>
	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Hero Section */
	.hero-section {
		position: relative;
		padding: 8rem 0 6rem;
		text-align: center;
		color: white;
		overflow: hidden;
	}

	.hero-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: -1;
	}

	.hero-gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		background-size: 200% 200%;
		animation: gradientShift 8s ease infinite;
	}

	@keyframes gradientShift {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	.hero-shapes {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
	}

	.shape {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		animation: float 6s ease-in-out infinite;
	}

	.shape-1 {
		width: 200px;
		height: 200px;
		top: 10%;
		left: 10%;
		animation-delay: 0s;
	}

	.shape-2 {
		width: 150px;
		height: 150px;
		top: 60%;
		right: 15%;
		animation-delay: 2s;
	}

	.shape-3 {
		width: 100px;
		height: 100px;
		bottom: 20%;
		left: 20%;
		animation-delay: 4s;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(180deg); }
	}

	.hero-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		position: relative;
		z-index: 1;
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.hero-title {
		font-size: 4rem;
		font-weight: 800;
		margin-bottom: 1.5rem;
		line-height: 1.1;
		background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-title-accent {
		display: block;
		font-size: 0.6em;
		font-weight: 400;
		opacity: 0.8;
		margin-top: 0.5rem;
	}

	.hero-subtitle {
		font-size: 1.375rem;
		opacity: 0.9;
		margin-bottom: 3rem;
		max-width: 48rem;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.6;
		font-weight: 400;
	}

	.hero-course-card-container {
		margin-bottom: 4rem;
	}

	/* Hero-specific styling for NewCourseCard */
	.hero-course-card-container :global(.new-course-card) {
		max-width: 800px;
		margin: 0 auto;
		--card-title-color: var(--color-gray-800);
		--card-subtitle-color: var(--color-gray-600);
		--dropdown-label-color: var(--color-gray-700);
		--submit-button-bg: var(--color-primary);
		--submit-button-color: white;
		--submit-button-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
		--submit-button-hover-bg: var(--color-primary-dark);
		--submit-button-hover-shadow: 0 8px 25px rgba(0, 102, 255, 0.4);
	}

	.hero-course-card-container :global(.card-elevated) {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.hero-course-card-container :global(.card-title) {
		/* No text shadow needed for dark text on white background */
	}

	.hero-course-card-container :global(.card-subtitle) {
		/* No text shadow needed for dark text on white background */
	}

	.hero-course-card-container :global(.dropdown-label) {
		/* No text shadow needed for dark text on white background */
	}

	.hero-course-card-container :global(.dropdown-select) {
		border-color: rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.9);
	}

	.hero-course-card-container :global(.dropdown-select:focus) {
		border-color: white;
		background: white;
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
	}

	.hero-course-card-container :global(.prompt-textarea) {
		border-color: rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.9);
	}

	.hero-course-card-container :global(.prompt-textarea:focus) {
		border-color: white;
		background: white;
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
	}

	.hero-stats {
		display: flex;
		justify-content: center;
		gap: 4rem;
		margin-top: 2rem;
	}

	.stat-item {
		text-align: center;
	}

	.stat-number {
		display: block;
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.stat-label {
		font-size: 0.875rem;
		opacity: 0.8;
		font-weight: 500;
	}

	/* Features Section */
	.features-section {
		padding: 8rem 0;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		position: relative;
	}

	.section-header {
		text-align: center;
		margin-bottom: 5rem;
	}

	.section-badge {
		display: inline-block;
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
		color: white;
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-title {
		font-size: 3rem;
		font-weight: 700;
		color: var(--color-gray-900);
		margin-bottom: 1.5rem;
		line-height: 1.2;
	}

	.section-subtitle {
		font-size: 1.25rem;
		color: var(--color-gray-600);
		max-width: 48rem;
		margin: 0 auto;
		line-height: 1.6;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 2.5rem;
	}

	@media (min-width: 768px) {
		.features-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.features-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.feature-card {
		text-align: center;
		padding: 3rem 2rem;
		background: white;
		border-radius: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.8);
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		opacity: 0;
		transform: translateY(30px);
		animation: fadeInUp 0.6s ease forwards;
	}

	@keyframes fadeInUp {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.feature-card:hover {
		transform: translateY(-8px);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.feature-icon-wrapper {
		position: relative;
		width: 80px;
		height: 80px;
		margin: 0 auto 2rem;
	}

	.feature-icon {
		position: relative;
		z-index: 2;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
		border-radius: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 2rem;
		transition: all 0.3s ease;
	}

	.feature-icon-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
		border-radius: 1.5rem;
		opacity: 0;
		transition: all 0.3s ease;
	}

	.feature-card:hover .feature-icon {
		transform: scale(1.1) rotate(5deg);
	}

	.feature-card:hover .feature-icon-bg {
		opacity: 1;
		transform: scale(1.2);
	}

	.feature-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-gray-900);
		margin-bottom: 1rem;
	}

	.feature-description {
		color: var(--color-gray-600);
		line-height: 1.6;
		font-size: 1rem;
	}

	.feature-hover-effect {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
		border-radius: 1.5rem;
	}

	.feature-card:hover .feature-hover-effect {
		opacity: 1;
	}

	/* Courses Section */
	.courses-section {
		padding: 8rem 0;
		background: white;
	}

	.courses-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 2.5rem;
		margin-bottom: 4rem;
	}

	@media (min-width: 768px) {
		.courses-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.courses-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.course-card {
		background: white;
		border-radius: 1.5rem;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border: 1px solid var(--color-gray-200);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.course-card:hover {
		transform: translateY(-8px);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	/* Course Thumbnail */
	.course-thumbnail {
		position: relative;
		width: 100%;
		height: 220px;
		overflow: hidden;
		background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
	}

	.thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.course-card:hover .thumbnail-image {
		transform: scale(1.05);
	}

	.course-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.course-card:hover .course-overlay {
		opacity: 1;
	}

	.overlay-content {
		text-align: center;
		color: white;
	}

	.overlay-text {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.difficulty-badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.375rem 1rem;
		border-radius: 2rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
		white-space: nowrap;
		backdrop-filter: blur(8px);
		background-color: rgba(255, 255, 255, 0.95);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.difficulty-beginner {
		color: var(--color-success-dark);
		background-color: rgba(16, 185, 129, 0.1);
	}

	.difficulty-intermediate {
		color: var(--color-warning-dark);
		background-color: rgba(245, 158, 11, 0.1);
	}

	.difficulty-advanced {
		color: var(--color-error-dark);
		background-color: rgba(239, 68, 68, 0.1);
	}

	.difficulty-default {
		color: var(--color-gray-600);
		background-color: rgba(107, 114, 128, 0.1);
	}

	/* Course Content */
	.course-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.course-header {
		margin-bottom: 1rem;
	}

	.course-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-gray-900);
		line-height: 1.3;
		margin-bottom: 0.75rem;
	}

	.course-description {
		color: var(--color-gray-600);
		line-height: 1.5;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		flex: 1;
	}

	.course-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}

	.course-duration {
		font-size: 0.875rem;
		color: var(--color-gray-500);
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.duration-icon {
		opacity: 0.7;
	}

	.course-btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.section-footer {
		text-align: center;
	}

	.view-all-btn {
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.view-all-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 20px 40px rgba(0, 102, 255, 0.3);
	}

	/* CTA Section */
	.cta-section {
		padding: 8rem 0;
		text-align: center;
		color: white;
		position: relative;
		overflow: hidden;
	}

	.cta-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: -1;
	}

	.cta-gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		background-size: 200% 200%;
		animation: gradientShift 8s ease infinite reverse;
	}

	.cta-shapes {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
	}

	.cta-shape {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		animation: float 8s ease-in-out infinite;
	}

	.cta-shape-1 {
		width: 300px;
		height: 300px;
		top: -150px;
		right: -150px;
		animation-delay: 0s;
	}

	.cta-shape-2 {
		width: 200px;
		height: 200px;
		bottom: -100px;
		left: -100px;
		animation-delay: 4s;
	}

	.cta-content {
		max-width: 800px;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}

	.cta-title {
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		line-height: 1.2;
		background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.cta-subtitle {
		font-size: 1.375rem;
		opacity: 0.9;
		margin-bottom: 3rem;
		max-width: 42rem;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.6;
		font-weight: 400;
	}

	.cta-buttons {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.cta-btn-primary,
	.cta-btn-secondary {
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.cta-btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.cta-btn-secondary:hover {
		transform: translateY(-2px);
		background: rgba(255, 255, 255, 0.1);
	}

	/* Loading State */
	.loading-state {
		text-align: center;
		padding: 6rem 0;
	}

	.loading-spinner {
		display: inline-block;
		width: 3rem;
		height: 3rem;
		border: 3px solid var(--color-gray-200);
		border-top: 3px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1.5rem;
	}

	.loading-text {
		color: var(--color-gray-600);
		font-size: 1.125rem;
		font-weight: 500;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2.5rem;
		}

		.hero-subtitle {
			font-size: 1.125rem;
		}

		.section-title {
			font-size: 2rem;
		}

		.section-subtitle {
			font-size: 1.125rem;
		}

		.cta-title {
			font-size: 2.5rem;
		}

		.cta-buttons {
			flex-direction: column;
			align-items: center;
		}

		.hero-stats {
			flex-direction: column;
			gap: 2rem;
		}

		.course-footer {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.course-btn {
			text-align: center;
		}

		.feature-card {
			padding: 2rem 1.5rem;
		}

		.feature-icon-wrapper {
			width: 60px;
			height: 60px;
		}

		.feature-icon {
			font-size: 1.5rem;
		}
	}

	/* Prompt Section Wrapper */
	.prompt-section-wrapper {
		padding: 6rem 0;
		background: var(--color-gray-50);
	}

	@media (max-width: 480px) {
		.hero-title {
			font-size: 2rem;
		}

		.cta-title {
			font-size: 2rem;
		}

		.btn-lg {
			padding: 0.75rem 1.5rem;
			font-size: 1rem;
		}

		.prompt-section-wrapper {
			padding: 4rem 0;
		}
	}
</style>
