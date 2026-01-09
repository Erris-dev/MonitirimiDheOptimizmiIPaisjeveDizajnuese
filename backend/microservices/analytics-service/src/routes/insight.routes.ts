import { Router } from 'express';
import { saveInsight, getUserHistory } from '../controllers/insight.controllers';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/save', authMiddleware, saveInsight);
router.get('/history/:userId', getUserHistory);

export default router;