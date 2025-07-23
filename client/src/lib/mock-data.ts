import type { Course, Lesson, User, Progress } from './types';

// Mock data for demonstration
export const mockUsers: User[] = [
	{
		id: 1,
		email: "admin@example.com",
		name: "Admin User",
		email_verified: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 2,
		email: "teacher@example.com",
		name: "Teacher User",
		email_verified: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 3,
		email: "instructor@example.com",
		name: "Course Instructor",
		email_verified: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	}
];

export const mockCourses: Course[] = [
	{
		id: 1,
		title: "Introduction to SvelteKit",
		description: "Learn the basics of SvelteKit framework and build your first application. Perfect for beginners who want to create modern web applications.",
		thumbnail_url: null,
		difficulty: "beginner",
		estimated_duration: 120,
		owned_by: 1,
		is_published: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 2,
		title: "Advanced SvelteKit Patterns",
		description: "Master advanced patterns and best practices for building scalable applications with SvelteKit.",
		thumbnail_url: null,
		difficulty: "intermediate",
		estimated_duration: 180,
		owned_by: 1,
		is_published: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 3,
		title: "Building APIs with SvelteKit",
		description: "Create robust APIs using SvelteKit server-side capabilities and database integration.",
		thumbnail_url: null,
		difficulty: "intermediate",
		estimated_duration: 150,
		owned_by: 2,
		is_published: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 4,
		title: "Full-Stack Development with SvelteKit",
		description: "Complete guide to building full-stack applications with SvelteKit, including authentication and deployment.",
		thumbnail_url: null,
		difficulty: "advanced",
		estimated_duration: 240,
		owned_by: 2,
		is_published: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 5,
		title: "SvelteKit Performance Optimization",
		description: "Learn techniques to optimize your SvelteKit applications for speed and efficiency.",
		thumbnail_url: null,
		difficulty: "advanced",
		estimated_duration: 90,
		owned_by: 3,
		is_published: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 6,
		title: "SvelteKit Testing Strategies",
		description: "Comprehensive testing strategies for SvelteKit applications including unit, integration, and E2E tests.",
		thumbnail_url: null,
		difficulty: "intermediate",
		estimated_duration: 120,
		owned_by: 3,
		is_published: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	}
];

export const mockLessons: Lesson[] = [
	{
		id: 1,
		course_id: 1,
		title: "Getting Started with SvelteKit",
		content: "# Getting Started with SvelteKit\n\nWelcome to your first lesson! This lesson covers the basics of setting up a SvelteKit project.\n\n## What you will learn:\n- Installing SvelteKit\n- Creating your first page\n- Understanding the file structure\n\n## Code Example:\n```bash\nnpm create svelte@latest my-app\ncd my-app\nnpm install\nnpm run dev\n```\n\n## Key Concepts:\n- File-based routing\n- Component structure\n- Development server",
		video_url: null,
		video_duration: null,
		video_title: null,
		order_index: 1,
		estimated_duration: 15,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 2,
		course_id: 1,
		title: "Routing Basics",
		content: "# SvelteKit Routing\n\nLearn how routing works in SvelteKit and how to create different pages.\n\n## File-based Routing\nSvelteKit uses file-based routing where each file in the `routes` directory becomes a route.\n\n## Examples:\n- `routes/index.svelte` → `/`\n- `routes/about.svelte` → `/about`\n- `routes/blog/[id].svelte` → `/blog/123`\n\n## Dynamic Routes:\nDynamic routes allow you to create pages with parameters that can change.",
		video_url: null,
		video_duration: null,
		video_title: null,
		order_index: 2,
		estimated_duration: 20,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 3,
		course_id: 2,
		title: "Advanced State Management",
		content: "# Advanced State Management\n\nLearn about stores and advanced state patterns in SvelteKit.\n\n## Svelte Stores\nStores allow you to share state between components.\n\n```javascript\nimport { writable } from 'svelte/store';\n\nconst count = writable(0);\n```\n\n## Store Types:\n- Writable stores\n- Readable stores\n- Derived stores\n- Custom stores",
		video_url: null,
		video_duration: null,
		video_title: null,
		order_index: 1,
		estimated_duration: 30,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 4,
		course_id: 2,
		title: "Server-side Rendering",
		content: "# Server-side Rendering\n\nUnderstanding SSR and how to optimize your SvelteKit app.\n\n## Benefits of SSR:\n- Better SEO\n- Faster initial page load\n- Better accessibility\n\n## Implementation:\nLearn how to configure SSR for different deployment environments.",
		video_url: null,
		video_duration: null,
		video_title: null,
		order_index: 2,
		estimated_duration: 35,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 5,
		course_id: 3,
		title: "API Routes Fundamentals",
		content: "# API Routes Fundamentals\n\nLearn how to create API endpoints in SvelteKit.\n\n## Creating API Routes:\n- `+server.js` files\n- HTTP methods (GET, POST, PUT, DELETE)\n- Request/response handling\n\n## Example:\n```javascript\n// routes/api/users/+server.js\nexport async function GET() {\n  return new Response(JSON.stringify({ users: [] }));\n}\n```",
		video_url: null,
		video_duration: null,
		video_title: null,
		order_index: 1,
		estimated_duration: 20,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 6,
		course_id: 3,
		title: "Database Integration",
		content: "# Database Integration\n\nConnect your SvelteKit API to a database.\n\n## Database Options:\n- MySQL/PostgreSQL\n- SQLite\n- MongoDB\n\n## Best Practices:\n- Connection pooling\n- Query optimization\n- Error handling",
		video_url: null,
		video_duration: null,
		video_title: null,
		order_index: 2,
		estimated_duration: 30,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	},
	{
		id: 7,
		course_id: 4,
		title: "Project Structure and Architecture",
		content: "# Project Structure and Architecture\n\nDesign scalable full-stack applications with SvelteKit.\n\n## Best Practices:\n- Folder organization\n- Code splitting\n- Performance optimization\n\n## Architecture Patterns:\n- MVC pattern\n- Repository pattern\n- Service layer pattern",
		video_url: null,
		video_duration: null,
		video_title: null,
		order_index: 1,
		estimated_duration: 30,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z"
	}
];

// Mock API functions
export async function getAllCourses(): Promise<Course[]> {
	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 100));
	return mockCourses;
}

export async function getCourseById(id: number): Promise<Course | null> {
	await new Promise(resolve => setTimeout(resolve, 100));
	return mockCourses.find(course => course.id === id) || null;
}

export async function getCourseWithLessons(id: number): Promise<{ course: Course; lessons: Lesson[] } | null> {
	await new Promise(resolve => setTimeout(resolve, 100));
	const course = mockCourses.find(c => c.id === id);
	if (!course) return null;
	
	const lessons = mockLessons
		.filter(lesson => lesson.course_id === id)
		.sort((a, b) => a.order_index - b.order_index);
	
	return { course, lessons };
}

export async function searchCourses(search: string, difficulty?: string, limit: number = 20, offset: number = 0): Promise<{ courses: Course[]; total: number }> {
	await new Promise(resolve => setTimeout(resolve, 100));
	
	let filteredCourses = mockCourses;
	
	if (search) {
		const searchLower = search.toLowerCase();
		filteredCourses = filteredCourses.filter(course => 
			course.title.toLowerCase().includes(searchLower) ||
			course.description?.toLowerCase().includes(searchLower)
		);
	}
	
	if (difficulty) {
		filteredCourses = filteredCourses.filter(course => course.difficulty === difficulty);
	}
	
	const total = filteredCourses.length;
	const courses = filteredCourses.slice(offset, offset + limit);
	
	return { courses, total };
} 