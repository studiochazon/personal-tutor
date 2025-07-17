import { Router } from 'express';
import * as courseController from '../controllers/courseController';

const router = Router();

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseDetails);
router.post('/', courseController.createCourse);

export default router; 