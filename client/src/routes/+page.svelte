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
				return 'bg-green-100 text-green-800';
			case 'intermediate':
				return 'bg-yellow-100 text-yellow-800';
			case 'advanced':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
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

<!-- Test div to verify CSS is working -->
<div style="background: red; color: white; padding: 10px; text-align: center; display: none;">
	CSS Test - If you see this, CSS is not loading properly
</div>

<!-- Hero Section -->
<section class="hero" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; padding: 6rem 0;">
	<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
		<h1 class="hero-title" style="font-size: 3.5rem; font-weight: 700; color: white; margin-bottom: 1.5rem; line-height: 1.2;">
			Your Personal AI Tutor
		</h1>
		<p class="hero-subtitle" style="font-size: 1.25rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
			Create custom learning paths tailored to your goals. Learn smarter, not harder, with AI-powered recommendations and interactive lessons.
		</p>
		<div class="flex gap-6 justify-center" style="display: flex; gap: 1.5rem; justify-content: center;">
			<a href="/courses" class="btn btn-primary btn-lg" style="display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.125rem;">
				Start Learning
			</a>
			<a href="/start" class="btn btn-secondary btn-lg" style="display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid rgba(255, 255, 255, 0.2); font-size: 1.125rem;">
				Create Course
			</a>
			<a href="/auth/register" class="btn btn-secondary btn-lg" style="display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid rgba(255, 255, 255, 0.2); font-size: 1.125rem;">
				Get Started Free
			</a>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="features" style="padding: 5rem 0; background: white;">
	<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
		<div class="text-center mb-12" style="text-align: center; margin-bottom: 3rem;">
			<h2 class="text-4xl font-bold text-gray-800 mb-4" style="font-size: 2.25rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">
				Why Choose Personal Tutor AI?
			</h2>
			<p class="text-xl text-gray-600 max-w-3xl mx-auto" style="font-size: 1.25rem; color: #4b5563; max-width: 48rem; margin-left: auto; margin-right: auto;">
				Experience the future of learning with our AI-powered platform designed to adapt to your unique learning style.
			</p>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style="display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 2rem;">
			{#each features as feature}
				<div class="feature-card card" style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
					<div class="feature-icon" style="width: 64px; height: 64px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: white; font-size: 1.5rem;">
						{feature.icon}
					</div>
					<h3 class="text-xl font-semibold text-gray-800 mb-3" style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem;">
						{feature.title}
					</h3>
					<p class="text-gray-600 leading-relaxed" style="color: #4b5563; line-height: 1.625;">
						{feature.description}
					</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Featured Courses Section -->
<section class="py-20 bg-gray-50" style="padding: 5rem 0; background: #f9fafb;">
	<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
		<div class="text-center mb-12" style="text-align: center; margin-bottom: 3rem;">
			<h2 class="text-4xl font-bold text-gray-800 mb-4" style="font-size: 2.25rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">
				Featured Courses
			</h2>
			<p class="text-xl text-gray-600 max-w-3xl mx-auto" style="font-size: 1.25rem; color: #4b5563; max-width: 48rem; margin-left: auto; margin-right: auto;">
				Explore our curated selection of courses designed to help you master new skills.
			</p>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style="display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 2rem;">
			{#each featuredCourses as course}
				<div class="card hover:shadow-xl transition-shadow" style="background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
					<div class="flex justify-between items-start mb-4" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
						<h3 class="text-xl font-semibold text-gray-800" style="font-size: 1.25rem; font-weight: 600; color: #1f2937;">
							{course.title}
						</h3>
						<span class="px-2 py-1 rounded-full text-xs font-medium {getDifficultyColor(course.difficulty)}" style="padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;">
							{course.difficulty}
						</span>
					</div>
					<p class="text-gray-600 mb-4" style="color: #4b5563; margin-bottom: 1rem;">
						{course.description}
					</p>
					<div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
						<span class="text-sm text-gray-500" style="font-size: 0.875rem; color: #6b7280;">
							⏱️ {formatDuration(course.estimated_duration)}
						</span>
						<a href="/courses/{course.id}" class="btn btn-primary" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
							Start Course
						</a>
					</div>
				</div>
			{/each}
		</div>
		
		<div class="text-center mt-12" style="text-align: center; margin-top: 3rem;">
			<a href="/courses" class="btn btn-secondary btn-lg" style="display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid rgba(255, 255, 255, 0.2); font-size: 1.125rem;">
				View All Courses
			</a>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-gradient-purple" style="padding: 5rem 0; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);">
	<div class="container text-center" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem; text-align: center;">
		<h2 class="text-4xl font-bold text-white mb-4" style="font-size: 2.25rem; font-weight: 700; color: white; margin-bottom: 1rem;">
			Ready to Transform Your Learning?
		</h2>
		<p class="text-xl text-gray-100 mb-8 max-w-2xl mx-auto" style="font-size: 1.25rem; color: #f3f4f6; margin-bottom: 2rem; max-width: 42rem; margin-left: auto; margin-right: auto;">
			Join thousands of learners who are already accelerating their growth with Personal Tutor AI.
		</p>
		<div class="flex gap-6 justify-center" style="display: flex; gap: 1.5rem; justify-content: center;">
			<a href="/auth/register" class="btn btn-primary btn-lg" style="display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.125rem;">
				Create Free Account
			</a>
			<a href="/courses" class="btn btn-secondary btn-lg" style="display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; background: rgba(255, 255, 255, 0.1); color: white; border: 2px solid rgba(255, 255, 255, 0.2); font-size: 1.125rem;">
				Browse Courses
			</a>
		</div>
	</div>
</section>
