import { Request, Response } from 'express';
import * as progressRepo from '../database/progressRepo';

export async function markProgress(req: Request, res: Response) {
  const { userId, courseId, lessonId, completed } = req.body;
  if (!userId || !courseId || !lessonId || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const progress = await progressRepo.markLessonProgress(userId, courseId, lessonId, completed);
  res.status(201).json(progress);
}

export async function getProgress(req: Request, res: Response) {
  const { userId, courseId } = req.query;
  if (!userId || !courseId) {
    return res.status(400).json({ error: 'Missing userId or courseId' });
  }
  const progress = await progressRepo.getProgress(userId as string, courseId as string);
  res.json(progress);
} 