import mysql from 'mysql2/promise';
import type { Course, Lesson, User, Progress } from './types';
import { dbConfig } from './server-config';

// Database configuration with connection pool settings
const poolConfig = {
	...dbConfig,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
};

// Create connection pool
let pool: mysql.Pool | null = null;

export async function getConnection() {
	if (!pool) {
		pool = mysql.createPool(poolConfig);
	}
	return pool;
}

// Course functions
export async function getAllCourses(): Promise<Course[]> {
	const connection = await getConnection();
	const [rows] = await connection.execute(
		'SELECT * FROM courses WHERE is_published = TRUE ORDER BY created_at DESC'
	);
	return rows as Course[];
}

export async function getCourseById(id: number): Promise<Course | null> {
	const connection = await getConnection();
	const [rows] = await connection.execute(
		'SELECT * FROM courses WHERE id = ? AND is_published = TRUE',
		[id]
	);
	const courses = rows as Course[];
	return courses.length > 0 ? courses[0] : null;
}

export async function getCourseWithLessons(id: number): Promise<{ course: Course; lessons: Lesson[] } | null> {
	const connection = await getConnection();
	
	// Get course
	const [courseRows] = await connection.execute(
		'SELECT * FROM courses WHERE id = ? AND is_published = TRUE',
		[id]
	);
	const courses = courseRows as Course[];
	
	if (courses.length === 0) {
		return null;
	}
	
	// Get lessons
	const [lessonRows] = await connection.execute(
		'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
		[id]
	);
	const lessons = lessonRows as Lesson[];
	
	return {
		course: courses[0],
		lessons
	};
}

// Lesson functions
export async function getLessonById(id: number): Promise<Lesson | null> {
	const connection = await getConnection();
	const [rows] = await connection.execute(
		'SELECT * FROM lessons WHERE id = ?',
		[id]
	);
	const lessons = rows as Lesson[];
	return lessons.length > 0 ? lessons[0] : null;
}

// User functions
export async function getUserById(id: number): Promise<User | null> {
	const connection = await getConnection();
	const [rows] = await connection.execute(
		'SELECT id, email, name, google_id, avatar_url, email_verified, given_name, family_name, last_login, created_at, updated_at FROM users WHERE id = ?',
		[id]
	);
	const users = rows as User[];
	return users.length > 0 ? users[0] : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
	const connection = await getConnection();
	const [rows] = await connection.execute(
		'SELECT id, email, name, google_id, avatar_url, email_verified, given_name, family_name, last_login, created_at, updated_at FROM users WHERE email = ?',
		[email]
	);
	const users = rows as User[];
	return users.length > 0 ? users[0] : null;
}

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
	const connection = await getConnection();
	const [rows] = await connection.execute(
		'SELECT id, email, name, google_id, avatar_url, email_verified, given_name, family_name, last_login, created_at, updated_at FROM users WHERE google_id = ?',
		[googleId]
	);
	const users = rows as User[];
	return users.length > 0 ? users[0] : null;
}

export async function createOrUpdateGoogleUser(googleUser: any): Promise<User> {
	const connection = await getConnection();
	const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
	
	// Try to find existing user by Google ID first
	let user = await getUserByGoogleId(googleUser.sub);
	
	if (user) {
		// Update existing user
		await connection.execute(
			`UPDATE users SET 
				name = ?, 
				email = ?, 
				avatar_url = ?, 
				email_verified = ?, 
				given_name = ?, 
				family_name = ?, 
				last_login = ?, 
				updated_at = NOW() 
			 WHERE google_id = ?`,
			[googleUser.name, googleUser.email, googleUser.picture, googleUser.email_verified, 
			 googleUser.given_name, googleUser.family_name, now, googleUser.sub]
		);
	} else {
		// Check if user exists by email
		user = await getUserByEmail(googleUser.email);
		
		if (user) {
			// Link existing email user to Google account
			await connection.execute(
				`UPDATE users SET 
					google_id = ?, 
					avatar_url = ?, 
					email_verified = ?, 
					given_name = ?, 
					family_name = ?, 
					last_login = ?, 
					updated_at = NOW() 
				 WHERE email = ?`,
				[googleUser.sub, googleUser.picture, googleUser.email_verified, 
				 googleUser.given_name, googleUser.family_name, now, googleUser.email]
			);
		} else {
			// Create new user (password_hash will be NULL for Google users)
			await connection.execute(
				`INSERT INTO users (email, name, google_id, avatar_url, email_verified, given_name, family_name, last_login, password_hash) 
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
				[googleUser.email, googleUser.name, googleUser.sub, googleUser.picture, 
				 googleUser.email_verified, googleUser.given_name, googleUser.family_name, now]
			);
		}
	}
	
	// Return the updated/created user
	return await getUserByGoogleId(googleUser.sub) as User;
}

// Progress functions
export async function getUserProgress(userId: number): Promise<Progress[]> {
	const connection = await getConnection();
	const [rows] = await connection.execute(
		'SELECT * FROM progress WHERE user_id = ?',
		[userId]
	);
	return rows as Progress[];
}

export async function getCourseProgress(userId: number, courseId: number): Promise<{ course: Course; lessons: Lesson[]; progress: Progress[] } | null> {
	const connection = await getConnection();
	
	// Get course
	const course = await getCourseById(courseId);
	if (!course) return null;
	
	// Get lessons
	const [lessonRows] = await connection.execute(
		'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
		[courseId]
	);
	const lessons = lessonRows as Lesson[];
	
	// Get progress for this course
	const [progressRows] = await connection.execute(
		`SELECT p.* FROM progress p 
		 JOIN lessons l ON p.lesson_id = l.id 
		 WHERE p.user_id = ? AND l.course_id = ?`,
		[userId, courseId]
	);
	const progress = progressRows as Progress[];
	
	return { course, lessons, progress };
}

export async function updateLessonProgress(userId: number, lessonId: number, completed: boolean, timeSpent?: number): Promise<Progress> {
	const connection = await getConnection();
	
	const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
	
	if (completed) {
		const [result] = await connection.execute(
			`INSERT INTO progress (user_id, lesson_id, completed, completed_at, time_spent) 
			 VALUES (?, ?, ?, ?, ?) 
			 ON DUPLICATE KEY UPDATE 
			 completed = VALUES(completed), 
			 completed_at = VALUES(completed_at), 
			 time_spent = VALUES(time_spent),
			 updated_at = NOW()`,
			[userId, lessonId, completed, now, timeSpent || null]
		);
	} else {
		const [result] = await connection.execute(
			`INSERT INTO progress (user_id, lesson_id, completed, time_spent) 
			 VALUES (?, ?, ?, ?) 
			 ON DUPLICATE KEY UPDATE 
			 completed = VALUES(completed), 
			 time_spent = VALUES(time_spent),
			 updated_at = NOW()`,
			[userId, lessonId, completed, timeSpent || null]
		);
	}
	
	// Return the updated progress
	const [rows] = await connection.execute(
		'SELECT * FROM progress WHERE user_id = ? AND lesson_id = ?',
		[userId, lessonId]
	);
	const progress = rows as Progress[];
	return progress[0];
}

// Search functions
export async function searchCourses(search: string, difficulty?: string, limit: number = 20, offset: number = 0): Promise<{ courses: Course[]; total: number }> {
	const connection = await getConnection();
	
	let whereClause = 'WHERE is_published = TRUE';
	const params: any[] = [];
	
	if (search) {
		whereClause += ' AND (title LIKE ? OR description LIKE ?)';
		params.push(`%${search}%`, `%${search}%`);
	}
	
	if (difficulty) {
		whereClause += ' AND difficulty = ?';
		params.push(difficulty);
	}
	
	// Get total count
	const [countRows] = await connection.execute(
		`SELECT COUNT(*) as total FROM courses ${whereClause}`,
		params
	);
	const total = (countRows as any)[0].total;
	
	// Get courses
	const [courseRows] = await connection.execute(
		`SELECT * FROM courses ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		[...params, limit, offset]
	);
	const courses = courseRows as Course[];
	
	return { courses, total };
}

// Close connection pool
export async function closeConnection() {
	if (pool) {
		await pool.end();
		pool = null;
	}
} 