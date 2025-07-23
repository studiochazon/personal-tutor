// TypeScript types for Personal Tutor AI MVP
// Generated from schema.json - keep in sync!

export interface User {
  id: number;
  email: string;
  name: string;
  google_id?: string;
  avatar_url?: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number | null;
  owned_by: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
	id: number;
	course_id: number;
	title: string;
	content: string;
	video_url: string | null;
	video_duration: number | null;
	video_title: string | null;
	order_index: number;
	estimated_duration: number | null;
	created_at: string;
	updated_at: string;
}

export interface Progress {
  id: number;
  user_id: number;
  lesson_id: number;
  completed: boolean;
  completed_at: string | null;
  time_spent: number | null;
  created_at: string;
  updated_at: string;
}

// Google Identity Services types
export interface GoogleUser {
  sub: string; // Google ID
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

export interface GoogleAuthRequest {
  credential: string;
}

// API Response types
export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface GoogleAuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

export interface CoursesResponse {
  courses: Course[];
  total: number;
}

export interface CourseWithLessonsResponse {
  course: Course;
  lessons: Lesson[];
}

export interface ProgressResponse {
  progress: Progress[];
}

export interface CourseProgressResponse {
  course_progress: {
    course: Course;
    lessons: Lesson[];
    progress: Progress[];
  };
}

// API Request types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration?: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration?: number;
  is_published?: boolean;
}

export interface CreateLessonRequest {
  title: string;
  content: string;
  video_url?: string;
  video_title?: string;
  video_duration?: number;
  order_index: number;
}

export interface UpdateLessonRequest {
  title?: string;
  content?: string;
  order_index?: number;
}

export interface UpdateProgressRequest {
  lesson_id: number;
  completed: boolean;
  time_spent?: number;
}

// Query parameter types
export interface CoursesQueryParams {
  search?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  limit?: number;
  offset?: number;
}

// Utility types
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Route parameters
export interface RouteParams {
  id?: string;
  courseId?: string;
  lessonId?: string;
} 