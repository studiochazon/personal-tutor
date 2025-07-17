import { Request, Response } from 'express';
import * as courseRepo from '../database/courseRepo';
import * as lessonRepo from '../database/lessonRepo';
import { generateCourseFromTopic } from '../services/aiService';

export async function getCourses(req: Request, res: Response) {
  const courses = await courseRepo.getCourses();
  res.json(courses);
}

export async function getCourseDetails(req: Request, res: Response) {
  const { id } = req.params;
  const course = await courseRepo.getCourseById(id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const lessons = await lessonRepo.getLessonsByCourse(id);
  res.json({ ...course, lessons });
}

// AI-powered and manual course creation
export async function createCourse(req: Request, res: Response) {
  try {
    let title: string, description: string, lessons: any[];
    if (req.body.topic) {
      // AI-powered course creation
      const coursePlan = await generateCourseFromTopic(req.body.topic);
      title = coursePlan.title;
      description = coursePlan.description;
      lessons = coursePlan.lessons;
    } else {
      // Manual course creation
      title = req.body.title;
      description = req.body.description || '';
      lessons = req.body.lessons;
    }
    if (!title || !lessons) return res.status(400).json({ error: 'Missing title or lessons' });
    const course = await courseRepo.createCourse(title, description);
    for (const [i, lesson] of lessons.entries()) {
      await lessonRepo.createLesson(course.id, lesson.title, lesson.content, lesson.videoUrl, i);
    }
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course', details: (error as Error).message });
  }
} 