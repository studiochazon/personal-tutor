import { getDb } from './db';
import { Lesson } from '../models/lesson';
import { v4 as uuidv4 } from 'uuid';

export async function createLesson(courseId: string, title: string, content: string, videoUrl: string | undefined, order: number): Promise<Lesson> {
  const db = await getDb();
  const id = uuidv4();
  await db.run(
    'INSERT INTO Lessons (id, courseId, title, content, videoUrl, "order") VALUES (?, ?, ?, ?, ?, ?)',
    id, courseId, title, content, videoUrl, order
  );
  return { id, courseId, title, content, videoUrl, order };
}

export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const db = await getDb();
  return db.all('SELECT * FROM Lessons WHERE courseId = ? ORDER BY "order" ASC', courseId);
} 