<script lang="ts">
  import { onMount } from 'svelte';

  interface Course {
    id: string;
    title: string;
    description: string;
    createdAt: string;
  }

  let courses: Course[] = [];
  let loading = false;
  let topic = '';
  let creating = false;

  const API_BASE = 'http://localhost:4000/api';

  onMount(() => {
    fetchCourses();
  });

  async function fetchCourses() {
    try {
      loading = true;
      const response = await fetch(`${API_BASE}/courses`);
      courses = await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      loading = false;
    }
  }

  async function createCourse(e: SubmitEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    creating = true;
    try {
      const response = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (response.ok) {
        topic = '';
        await fetchCourses();
      } else {
        alert('Failed to create course. Please try again.');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    } finally {
      creating = false;
    }
  }
</script>

<svelte:head>
  <title>Personal Tutor - Learn Anything with AI</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
  <!-- Header -->
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <h1 class="text-3xl font-bold text-indigo-600">Personal Tutor</h1>
          </div>
        </div>
        <div class="text-sm text-gray-500">
          AI-Powered Learning
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">
        Learn Anything with AI
      </h2>
      <p class="text-xl text-gray-600 mb-8">
        Tell us what you want to learn, and we'll create a personalized course just for you.
      </p>

      <!-- Course Creation Form -->
      <form on:submit={createCourse} class="max-w-2xl mx-auto">
        <div class="flex gap-4">
          <input
            type="text"
            bind:value={topic}
            placeholder="I want to learn about..."
            class="flex-1 px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !topic.trim()}
            class="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>

    <!-- Courses Section -->
    <div class="mb-8">
      <h3 class="text-2xl font-semibold text-gray-900 mb-6">Your Courses</h3>
      
      {#if loading}
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      {:else if courses.length === 0}
        <div class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p class="text-gray-500">Create your first course by entering a topic above!</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each courses as course (course.id)}
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <div class="p-6">
                <h4 class="text-xl font-semibold text-gray-900 mb-2">{course.title}</h4>
                <p class="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500">
                    Created {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                  <button class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                    Start Learning
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style> 