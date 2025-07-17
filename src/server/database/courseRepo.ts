import { getDb } from './db';
import { Course } from '../models/course';
import { v4 as uuidv4 } from 'uuid';

export async function createCourse(title: string, description: string): Promise<Course> {
  const db = await getDb();
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  await db.run(
    'INSERT INTO Courses (id, title, description, createdAt) VALUES (?, ?, ?, ?)',
    id, title, description, createdAt
  );
  return { id, title, description, createdAt };
}

export async function getCourses(): Promise<Course[]> {
  const db = await getDb();
  return db.all('SELECT * FROM Courses ORDER BY createdAt DESC');
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const db = await getDb();
  return db.get('SELECT * FROM Courses WHERE id = ?', id);
} 