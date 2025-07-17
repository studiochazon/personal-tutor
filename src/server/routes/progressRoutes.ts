import { Router } from 'express';
import * as progressController from '../controllers/progressController';

const router = Router();

router.get('/', progressController.getProgress);
router.post('/', progressController.markProgress);

export default router; 