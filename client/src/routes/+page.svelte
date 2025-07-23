<script lang="ts">
	import { onMount } from 'svelte';
	import type { Course } from '$lib/types';
	
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
			icon: "🎯",
			title: "Personalized Learning Paths",
			description: "AI-powered course recommendations tailored to your learning style and goals"
		},
		{
			icon: "📚",
			title: "Interactive Lessons",
			description: "Engage with hands-on exercises, quizzes, and real-world projects"
		},
		{
			icon: "📊",
			title: "Progress Tracking",
			description: "Monitor your learning journey with detailed analytics and achievements"
		},
		{
			icon: "🚀",
			title: "Learn at Your Pace",
			description: "Flexible learning schedule that adapts to your busy lifestyle"
		},
		{
			icon: "🤖",
			title: "AI Tutor Support",
			description: "Get instant help and guidance from our intelligent tutoring system"
		},
		{
			icon: "✨",
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
</script>

<svelte:head>
	<title>Personal Tutor AI - Your Custom Learning Path Creator</title>
	<meta name="description" content="Create personalized learning paths with AI-powered recommendations. Learn at your own pace with interactive lessons and progress tracking." />
</svelte:head>

<!-- Hero Section -->
<section class="hero-section">
	<div class="hero-container">
		<h1 class="hero-title">Your Personal AI Tutor</h1>
		<p class="hero-subtitle">
			Create custom learning paths tailored to your goals. Learn smarter, not harder, with AI-powered recommendations and interactive lessons.
		</p>
		<div class="hero-buttons">
			<a href="/courses" class="btn btn-primary btn-lg">
				Start Learning
			</a>
			<a href="/start" class="btn btn-secondary btn-lg">
				Create Course
			</a>
			<a href="/auth/register" class="btn btn-ghost btn-lg">
				Get Started Free
			</a>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="features-section">
	<div class="container">
		<div class="section-header">
			<h2 class="section-title">Why Choose Personal Tutor AI?</h2>
			<p class="section-subtitle">
				Experience the future of learning with our AI-powered platform designed to adapt to your unique learning style.
			</p>
		</div>
		
		<div class="features-grid">
			{#each features as feature}
				<div class="feature-card">
					<div class="feature-icon">
						{feature.icon}
					</div>
					<h3 class="feature-title">{feature.title}</h3>
					<p class="feature-description">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Featured Courses Section -->
<section class="courses-section">
	<div class="container">
		<div class="section-header">
			<h2 class="section-title">Featured Courses</h2>
			<p class="section-subtitle">
				Explore our curated selection of courses designed to help you master new skills.
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
									⏱️ {formatDuration(course.estimated_duration)}
								</span>
								<a href="/courses/{course.id}" class="btn btn-secondary">
									Start Course
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
			
			<div class="section-footer">
				<a href="/courses" class="btn-primary btn-large">
					View All Courses
				</a>
			</div>
		{/if}
	</div>
</section>

<!-- CTA Section -->
<section class="cta-section">
	<div class="container">
		<h2 class="cta-title">Ready to Transform Your Learning?</h2>
		<p class="cta-subtitle">
			Join thousands of learners who are already accelerating their growth with Personal Tutor AI.
		</p>
		<div class="cta-buttons">
			<a href="/auth/register" class="btn btn-primary btn-lg">
				Create Free Account
			</a>
			<a href="/courses" class="btn btn-secondary btn-lg">
				Browse Courses
			</a>
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
		background: linear-gradient(135deg, #0066FF 0%, #4D94FF 100%);
		padding: 6rem 0;
		text-align: center;
		color: white;
	}

	.hero-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.hero-title {
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		line-height: 1.2;
	}

	.hero-subtitle {
		font-size: 1.25rem;
		opacity: 0.9;
		margin-bottom: 3rem;
		max-width: 48rem;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.6;
	}

	.hero-buttons {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Features Section */
	.features-section {
		padding: 5rem 0;
		background-color: white;
	}

	.section-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.section-title {
		font-size: 2.25rem;
		font-weight: 700;
		color: #1F2937;
		margin-bottom: 1rem;
	}

	.section-subtitle {
		font-size: 1.25rem;
		color: #6B7280;
		max-width: 48rem;
		margin: 0 auto;
		line-height: 1.6;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 2rem;
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
		padding: 2rem;
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		border: 1px solid #E5E7EB;
		transition: all 0.2s ease;
	}

	.feature-card:hover {
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		transform: translateY(-2px);
	}

	.feature-icon {
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, #0066FF 0%, #4D94FF 100%);
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
		color: white;
		font-size: 1.5rem;
	}

	.feature-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1F2937;
		margin-bottom: 0.75rem;
	}

	.feature-description {
		color: #6B7280;
		line-height: 1.6;
	}

	/* Courses Section */
	.courses-section {
		padding: 5rem 0;
		background-color: #F9FAFB;
	}

	.courses-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 2rem;
		margin-bottom: 3rem;
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
		background-color: white;
		border-radius: 0.75rem;
		overflow: hidden;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		border: 1px solid #E5E7EB;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
	}

	.course-card:hover {
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		transform: translateY(-2px);
	}

	/* Course Thumbnail */
	.course-thumbnail {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
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

	.difficulty-badge {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
		white-space: nowrap;
		backdrop-filter: blur(8px);
		background-color: rgba(255, 255, 255, 0.9);
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}

	.difficulty-beginner {
		color: #059669;
		background-color: rgba(16, 185, 129, 0.1);
	}

	.difficulty-intermediate {
		color: #D97706;
		background-color: rgba(245, 158, 11, 0.1);
	}

	.difficulty-advanced {
		color: #DC2626;
		background-color: rgba(239, 68, 68, 0.1);
	}

	.difficulty-default {
		color: #6B7280;
		background-color: rgba(107, 114, 128, 0.1);
	}

	/* Course Content */
	.course-content {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.course-header {
		margin-bottom: 0.75rem;
	}

	.course-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1F2937;
		line-height: 1.3;
		margin-bottom: 0.5rem;
	}

	.course-description {
		color: #6B7280;
		line-height: 1.5;
		margin-bottom: 1rem;
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
		color: #9CA3AF;
	}

	.section-footer {
		text-align: center;
	}

	/* CTA Section */
	.cta-section {
		padding: 5rem 0;
		background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
		text-align: center;
		color: white;
	}

	.cta-title {
		font-size: 2.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.cta-subtitle {
		font-size: 1.25rem;
		opacity: 0.9;
		margin-bottom: 2rem;
		max-width: 42rem;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.6;
	}

	.cta-buttons {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Difficulty Badges */
	.difficulty-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
		white-space: nowrap;
	}

	.difficulty-beginner {
		background-color: #D1FAE5;
		color: #065F46;
	}

	.difficulty-intermediate {
		background-color: #FEF3C7;
		color: #92400E;
	}

	.difficulty-advanced {
		background-color: #FEE2E2;
		color: #991B1B;
	}

	.difficulty-default {
		background-color: #F3F4F6;
		color: #374151;
	}

	/* Button styles are now imported from the consolidated buttons.css */

	/* Loading State */
	.loading-state {
		text-align: center;
		padding: 4rem 0;
	}

	.loading-spinner {
		display: inline-block;
		width: 2rem;
		height: 2rem;
		border: 2px solid #E5E7EB;
		border-top: 2px solid #0066FF;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.loading-text {
		color: #6B7280;
		font-size: 1rem;
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
			font-size: 1.875rem;
		}

		.section-subtitle {
			font-size: 1.125rem;
		}

		.hero-buttons,
		.cta-buttons {
			flex-direction: column;
			align-items: center;
		}

		.course-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.course-footer {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.btn-secondary {
			text-align: center;
		}
	}
</style>
