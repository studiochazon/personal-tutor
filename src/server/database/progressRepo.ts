import { getDb } from './db';
import { Progress } from '../models/progress';
import { v4 as uuidv4 } from 'uuid';

export async function markLessonProgress(userId: string, courseId: string, lessonId: string, completed: boolean): Promise<Progress> {
  const db = await getDb();
  const id = uuidv4();
  const updatedAt = new Date().toISOString();
  await db.run(
    'INSERT OR REPLACE INTO Progress (id, userId, courseId, lessonId, completed, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    id, userId, courseId, lessonId, completed ? 1 : 0, updatedAt
  );
  return { id, userId, courseId, lessonId, completed, updatedAt };
}

export async function getProgress(userId: string, courseId: string): Promise<Progress[]> {
  const db = await getDb();
  return db.all('SELECT * FROM Progress WHERE userId = ? AND courseId = ?', userId, courseId);
} 